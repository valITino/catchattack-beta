"""Policy engine — enforces dry-run + target allowlist + approval token.

The proxy runs every inbound tool call through `evaluate()` before forwarding.
Phase 0 ships the engine and its tests; Phase 1 wires it into the FastAPI
request path.
"""

from __future__ import annotations

import hmac
from dataclasses import dataclass
from typing import Any

from .config import ProxyConfig


@dataclass(frozen=True, slots=True)
class PolicyDecision:
    allowed: bool
    reason: str
    requires_approval: bool = False
    dry_run_enforced: bool = False


class PolicyEngine:
    """Evaluates whether a tool call should be allowed through the proxy.

    Inputs are treated as untrusted (they come from an LLM). The engine never
    raises on bad input — it returns a denial reason the caller can audit.
    """

    def __init__(self, config: ProxyConfig, approval_token: str | None) -> None:
        self._config = config
        self._approval_token = approval_token
        self._destructive = set(config.destructive_tools)

    def evaluate(
        self,
        tool: str,
        params: dict[str, Any],
        approval_header: str | None,
    ) -> PolicyDecision:
        if not self._is_destructive(tool):
            return PolicyDecision(allowed=True, reason="non_destructive")

        approved = self._is_approval_valid(approval_header)
        dry_run = bool(params.get("dry_run", False))

        if not approved and not dry_run:
            return PolicyDecision(
                allowed=False,
                reason=f"destructive tool '{tool}' requires dry_run=true or approval token",
                requires_approval=True,
            )

        target_check = self._check_target(tool, params)
        if not target_check[0]:
            if approved:
                return PolicyDecision(allowed=True, reason="approved_override")
            return PolicyDecision(
                allowed=False,
                reason=target_check[1],
                requires_approval=True,
            )

        if approved:
            return PolicyDecision(allowed=True, reason="approved")
        return PolicyDecision(allowed=True, reason="dry_run", dry_run_enforced=True)

    def _is_destructive(self, tool: str) -> bool:
        return tool in self._destructive

    def _is_approval_valid(self, header_value: str | None) -> bool:
        if not header_value or not self._approval_token:
            return False
        return hmac.compare_digest(header_value, self._approval_token)

    def _check_target(self, tool: str, params: dict[str, Any]) -> tuple[bool, str]:
        allowlist = self._config.target_allowlists.get(tool)
        if allowlist is None:
            return True, ""
        value = params.get(allowlist.param)
        if value is None:
            return False, f"tool '{tool}' missing required target param '{allowlist.param}'"
        if value not in allowlist.allowed:
            return (
                False,
                f"tool '{tool}' target '{value}' not in lab=true allowlist for '{allowlist.param}'",
            )
        return True, ""
