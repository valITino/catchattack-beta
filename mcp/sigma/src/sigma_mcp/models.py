"""Pydantic models for Sigma MCP tool inputs and outputs.

Every model declares `extra="forbid"` so that prompt-injected fields never
slip through; this is the same posture the proxy enforces upstream.
"""

from __future__ import annotations

from enum import StrEnum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

# ---------------------------------------------------------------------------
# Targets
# ---------------------------------------------------------------------------


class ConvertTarget(StrEnum):
    """Supported pySigma backend targets.

    `falcon` maps to the CrowdStrike LogScale backend. `sentinel` maps to the
    Microsoft Sentinel/Kusto KQL backend. `chronicle` maps to the
    Google SecOps UDM-search backend.
    """

    SPLUNK = "splunk"
    SENTINEL = "sentinel"
    CHRONICLE = "chronicle"
    ELASTIC = "elastic"
    FALCON = "falcon"


# ---------------------------------------------------------------------------
# Tool I/O — parse_sigma
# ---------------------------------------------------------------------------


class LogSource(BaseModel):
    model_config = ConfigDict(extra="forbid")

    product: str | None = None
    category: str | None = None
    service: str | None = None


class ParsedRule(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str | None = Field(default=None, description="Sigma rule UUID.")
    title: str
    description: str | None = None
    level: str | None = Field(default=None, description="informational|low|medium|high|critical")
    status: str | None = None
    tags: list[str] = Field(default_factory=list)
    attack_techniques: list[str] = Field(
        default_factory=list,
        description="ATT&CK technique IDs extracted from tags (e.g. ['T1059.001']).",
    )
    logsource: LogSource = Field(default_factory=LogSource)
    detection_keys: list[str] = Field(
        default_factory=list,
        description="Top-level detection block keys (selection names, 'condition', etc.).",
    )
    condition: str | None = Field(
        default=None,
        description="The string value of the rule's detection.condition.",
    )
    falsepositives: list[str] = Field(default_factory=list)
    references: list[str] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Tool I/O — lint_sigma
# ---------------------------------------------------------------------------


class LintIssue(BaseModel):
    model_config = ConfigDict(extra="forbid")

    severity: str = Field(description="error|warning|info")
    code: str
    message: str
    path: str | None = Field(
        default=None, description="Dotted path inside the rule, when applicable."
    )


class LintReport(BaseModel):
    model_config = ConfigDict(extra="forbid")

    ok: bool
    errors: list[LintIssue] = Field(default_factory=list)
    warnings: list[LintIssue] = Field(default_factory=list)
    info: list[LintIssue] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Tool I/O — convert_sigma
# ---------------------------------------------------------------------------


class ConvertResult(BaseModel):
    model_config = ConfigDict(extra="forbid")

    target: ConvertTarget
    pipeline: str | None = Field(
        default=None, description="Named processing pipeline applied, if any."
    )
    queries: list[str] = Field(
        default_factory=list,
        description="One or more backend-specific query strings (a Sigma rule may "
        "expand into multiple queries depending on the pipeline).",
    )
    pipeline_trace: list[str] = Field(
        default_factory=list,
        description="High-level steps applied by the pySigma pipeline, suitable for "
        "showing to a reviewer.",
    )
    backend: str = Field(description="Concrete pySigma backend class used.")
    warnings: list[str] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Tool I/O — dedupe_against_corpus
# ---------------------------------------------------------------------------


class DedupeMatch(BaseModel):
    model_config = ConfigDict(extra="forbid")

    rule_id: str
    rule_path: str
    title: str
    ast_overlap: float = Field(ge=0.0, le=1.0)
    embedding_similarity: float = Field(ge=0.0, le=1.0)
    score: float = Field(
        ge=0.0,
        le=1.0,
        description="Combined similarity score (max of AST overlap and embedding sim).",
    )


class DedupeReport(BaseModel):
    model_config = ConfigDict(extra="forbid")

    corpus_path: str
    corpus_size: int
    threshold: float
    embedder: str = Field(description="Identifier of the embedding backend used.")
    max_score: float = Field(ge=0.0, le=1.0)
    is_duplicate: bool = Field(description="True iff max_score >= threshold.")
    matches: list[DedupeMatch] = Field(
        default_factory=list,
        description="Top-K matches ranked by combined score (descending).",
    )


# ---------------------------------------------------------------------------
# Misc
# ---------------------------------------------------------------------------


class ServerError(BaseModel):
    """Returned by every tool on a handled validation error.

    Tools never raise on user-supplied YAML — they return ServerError so the
    LLM can fix and retry without seeing a stack trace.
    """

    model_config = ConfigDict(extra="forbid")

    error: str
    detail: str | None = None
    suggestions: list[str] = Field(default_factory=list)


def is_error(value: Any) -> bool:
    """Helper for callers and tests."""
    return isinstance(value, dict) and "error" in value
