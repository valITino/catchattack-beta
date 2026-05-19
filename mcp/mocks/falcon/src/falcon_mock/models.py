"""Pydantic models for the mock Falcon MCP surface.

Field shapes follow the CrowdStrike Falcon API so a flip from mock to the
official falcon-mcp doesn't ripple into the Conductor.

References:
- Detects (Alerts) API:
  https://falcon.crowdstrike.com/documentation/page/d2c9eb38/detections-monitoring-apis
- Hosts API:
  https://falcon.crowdstrike.com/documentation/page/c0bc0bb3/host-and-host-group-management-apis
- IOA rules (custom IOA):
  https://falcon.crowdstrike.com/documentation/page/c4753c1f/custom-ioa-apis
- Falcon Intelligence (indicators):
  https://falcon.crowdstrike.com/documentation/page/intel-apis
"""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class Detection(BaseModel):
    """A Falcon detection (EPP "detect" / next-gen "alert")."""

    model_config = ConfigDict(extra="forbid")

    detection_id: str
    severity: int = Field(ge=1, le=100, description="Falcon 1-100 severity scale.")
    tactic: str
    technique: str
    attack_id: str = Field(description="ATT&CK technique id, e.g. T1059.001.")
    device_id: str
    hostname: str
    filename: str
    cmdline: str
    status: str = Field(description="new|in_progress|true_positive|false_positive|closed")
    timestamp: str


class DetectionList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    total: int
    items: list[Detection]


class Host(BaseModel):
    model_config = ConfigDict(extra="forbid")

    device_id: str
    hostname: str
    platform_name: str = Field(description="Windows|Linux|Mac")
    os_version: str
    local_ip: str
    external_ip: str
    status: str = Field(description="normal|containment_pending|contained")
    last_seen: str
    agent_version: str


class HostList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    total: int
    items: list[Host]


class IOARuleResult(BaseModel):
    """Result of a custom-IOA rule push.

    dry_run=true renders the rule group payload without POSTing. A real
    POST requires dry_run=false AND the proxy's approval token.
    """

    model_config = ConfigDict(extra="forbid")

    name: str
    dry_run: bool
    deployed: bool
    rule_group_id: str | None = None
    rendered_payload: dict[str, object]


class IntelIndicator(BaseModel):
    model_config = ConfigDict(extra="forbid")

    indicator: str
    type: str = Field(description="hash_sha256|domain|ip_address|url")
    malicious_confidence: str = Field(description="high|medium|low|unverified")
    threat_types: list[str] = Field(default_factory=list)
    actors: list[str] = Field(default_factory=list)
    last_updated: str


class IntelList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    total: int
    items: list[IntelIndicator]
