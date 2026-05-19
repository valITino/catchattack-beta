"""Anthropic-backed LLM client used by Conductor workflows.

Wraps `anthropic.AsyncAnthropic` with:
- Prompt caching on the system prompt (the v1 file ~5 KB; cheap to keep cached
  across runs).
- A narrow `draft_sigma_rule()` method that returns just the YAML string.
- A `Protocol` so tests inject a deterministic fake.

Model: `claude-opus-4-7` per the brief's pinned stack.
"""

from __future__ import annotations

import os
import re
from pathlib import Path
from typing import Any, Protocol

DEFAULT_MODEL = "claude-opus-4-7"
DEFAULT_MAX_TOKENS = 2048

_SIGMA_DRAFT_INSTRUCTIONS = """\
You are drafting a single Sigma detection rule from this evidence summary.

Rules:
- Output ONLY a YAML code block. No prose before or after.
- The rule must describe BEHAVIOUR, not IOCs (no hashes, IPs, or domains in
  the detection block). IOCs may appear in `references` only.
- Pick a Sigma `id` UUID; pick `level` (medium/high) based on how
  unambiguously malicious the behaviour is.
- Tag with the ATT&CK technique provided.
- `falsepositives` should list at least one realistic FP.
- `logsource` must match the platform observed (product/category).

Evidence summary follows below.
"""


class LLMClient(Protocol):
    """Surface used by workflows."""

    async def draft_sigma_rule(
        self,
        *,
        technique: str,
        evidence: dict[str, Any],
        system_prompt: str,
    ) -> str: ...


class AnthropicLLM:
    """Production client. Uses `anthropic.AsyncAnthropic` with prompt caching."""

    def __init__(
        self,
        api_key: str | None = None,
        model: str = DEFAULT_MODEL,
        max_tokens: int = DEFAULT_MAX_TOKENS,
    ) -> None:
        from anthropic import AsyncAnthropic  # noqa: PLC0415 — defer import

        self._client = AsyncAnthropic(api_key=api_key or os.environ.get("ANTHROPIC_API_KEY"))
        self._model = model
        self._max_tokens = max_tokens

    async def draft_sigma_rule(
        self,
        *,
        technique: str,
        evidence: dict[str, Any],
        system_prompt: str,
    ) -> str:
        response = await self._client.messages.create(
            model=self._model,
            max_tokens=self._max_tokens,
            system=[
                {
                    "type": "text",
                    "text": system_prompt,
                    # Long-lived system prompt — cache so we don't re-bill on
                    # every workflow run.
                    "cache_control": {"type": "ephemeral"},
                },
            ],
            messages=[
                {
                    "role": "user",
                    "content": (
                        f"{_SIGMA_DRAFT_INSTRUCTIONS}\n"
                        f"ATT&CK technique: {technique}\n\n"
                        f"Evidence summary (JSON):\n```json\n{evidence}\n```"
                    ),
                }
            ],
        )
        text = "".join(
            getattr(block, "text", "")
            for block in response.content
            if getattr(block, "type", None) == "text"
        )
        return _extract_yaml(text)


class StaticLLM:
    """Deterministic fake. Returns a canned YAML string for tests.

    The default rule looks like a plausible PowerShell encoded-command
    behaviour rule so the rest of the workflow (lint, dedupe, convert, FP,
    deploy, validate) exercises real code paths.
    """

    DEFAULT_RULE = """\
title: Suspicious PowerShell EncodedCommand Behaviour (conductor-drafted)
id: 11111111-2222-3333-4444-555555555555
status: experimental
description: |
    Behaviour-only detection drafted by the Conductor from a captured
    Atomic Red Team test. Looks for powershell.exe invoked with an
    encoded-command argument anywhere in the command line.
references:
    - https://attack.mitre.org/techniques/T1059/001/
author: CatchAttack Conductor
date: 2026-05-13
tags:
    - attack.execution
    - attack.t1059.001
logsource:
    category: process_creation
    product: windows
detection:
    sel_image:
        Image|endswith:
            - '\\powershell.exe'
            - '\\pwsh.exe'
    sel_args:
        CommandLine|contains:
            - ' -EncodedCommand '
            - ' -enc '
    condition: sel_image and sel_args
falsepositives:
    - SCCM and Intune deployment scripts that base64 their args.
level: high
"""

    def __init__(self, rule_yaml: str | None = None) -> None:
        self._rule_yaml = rule_yaml or self.DEFAULT_RULE
        self._calls = 0

    async def draft_sigma_rule(
        self,
        *,
        technique: str,
        evidence: dict[str, Any],
        system_prompt: str,
    ) -> str:
        self._calls += 1
        return self._rule_yaml

    @property
    def call_count(self) -> int:
        return self._calls


def load_system_prompt(path: Path | str | None = None) -> str:
    """Load the Conductor system prompt. Defaults to `apps/conductor/prompts/system_v1.md`."""
    default = Path(__file__).resolve().parents[3] / "prompts" / "system_v1.md"
    return Path(path or default).read_text(encoding="utf-8")


def _extract_yaml(text: str) -> str:
    """Pull the first ```yaml ... ``` block (or the whole thing if none)."""
    m = re.search(r"```(?:yaml|yml)?\s*\n(.*?)```", text, re.DOTALL)
    return m.group(1).strip() if m else text.strip()
