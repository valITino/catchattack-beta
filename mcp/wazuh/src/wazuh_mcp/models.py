"""Pydantic models for Wazuh MCP tool I/O."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class AlertSample(BaseModel):
    model_config = ConfigDict(extra="forbid")

    timestamp: str
    rule_id: str
    rule_description: str
    rule_level: int
    agent_name: str | None = None
    agent_ip: str | None = None
    location: str | None = None
    full_log: str = Field(description="Raw event text, truncated server-side.")


class SearchSummary(BaseModel):
    model_config = ConfigDict(extra="forbid")

    query: str
    earliest: str
    latest: str
    total_hits: int
    top_agents: list[tuple[str, int]] = Field(default_factory=list)
    top_rule_ids: list[tuple[str, int]] = Field(default_factory=list)
    samples: list[AlertSample] = Field(default_factory=list)
    truncated: bool


class WazuhRule(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    level: int
    description: str
    groups: list[str] = Field(default_factory=list)
    file: str | None = None
    status: str | None = None


class RuleList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    total: int
    items: list[WazuhRule]


class DeployResult(BaseModel):
    """Outcome of a Wazuh `deploy_rule` call.

    dry_run=true returns the rendered XML stanza without writing.
    dry_run=false PUTs to /rules/files/{filename}; the operator must trigger
    a manager restart separately for the ruleset reload.
    """

    model_config = ConfigDict(extra="forbid")

    filename: str
    dry_run: bool
    rendered_xml: str
    deployed: bool
    requires_manager_restart: bool = True
    manager_response: dict[str, object] | None = None


class FPBucket(BaseModel):
    model_config = ConfigDict(extra="forbid")

    date: str
    hits: int


class FPReport(BaseModel):
    model_config = ConfigDict(extra="forbid")

    query: str
    lookback_days: int
    total_hits: int
    hits_per_day: list[FPBucket]
    unique_agents: int
    p95_hits_per_day: int
    verdict: str = Field(description="'low' < 5/day, 'medium' < 50/day, 'high' >= 50/day.")


class ServerError(BaseModel):
    model_config = ConfigDict(extra="forbid")

    error: str
    detail: str | None = None
    upstream_status: int | None = None
