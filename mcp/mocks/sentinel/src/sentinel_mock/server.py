"""FastMCP mock for Microsoft Sentinel.

Mirrors the surface the Microsoft-hosted Sentinel MCP triage collection
exposes (incidents, advanced-hunting/KQL, analytics rules). When the
operator wires the real hosted endpoint
(https://sentinel.microsoft.com/mcp/triage) they flip
`upstreams.sentinel.mode`; Conductor/UI are unaware.

References:
- Microsoft Sentinel ARM API (Microsoft.SecurityInsights):
  https://learn.microsoft.com/rest/api/securityinsights/
- Advanced Hunting / KQL:
  https://learn.microsoft.com/azure/sentinel/hunting

Run:
    sentinel-mock                          # stdio
    sentinel-mock --transport http --port 9106
"""

from __future__ import annotations

import argparse
import random
from datetime import UTC, datetime, timedelta
from typing import Any

from fastmcp import FastMCP
from pydantic import BaseModel, ConfigDict, Field

from . import __version__

DEFAULT_SEED = 20260513

_TACTICS = [
    "Execution",
    "Persistence",
    "PrivilegeEscalation",
    "DefenseEvasion",
    "CredentialAccess",
    "LateralMovement",
]


class Incident(BaseModel):
    model_config = ConfigDict(extra="forbid")

    incident_id: str
    title: str
    severity: str = Field(description="High|Medium|Low|Informational")
    status: str = Field(description="New|Active|Closed")
    tactics: list[str] = Field(default_factory=list)
    created_utc: str


class AnalyticsRule(BaseModel):
    model_config = ConfigDict(extra="forbid")

    rule_id: str
    display_name: str
    kind: str = Field(description="Scheduled|NRT|MicrosoftSecurityIncidentCreation")
    enabled: bool
    query: str
    severity: str


class DeployResult(BaseModel):
    model_config = ConfigDict(extra="forbid")

    display_name: str
    dry_run: bool
    deployed: bool
    rule_id: str | None
    rendered_arm: dict[str, object]


def _iso(dt: datetime) -> str:
    return dt.replace(microsecond=0).isoformat()


def _seed_incidents(seed: int) -> list[Incident]:
    rng = random.Random(seed)  # noqa: S311 — synthetic data
    now = datetime.now(tz=UTC)
    return [
        Incident(
            incident_id=f"inc-{i:05d}",
            title=f"Suspicious activity on host srv-{i:02d}",
            severity=rng.choice(["High", "Medium", "Low", "Informational"]),
            status=rng.choice(["New", "Active", "Closed"]),
            tactics=rng.sample(_TACTICS, k=rng.randint(1, 3)),
            created_utc=_iso(now - timedelta(hours=rng.randint(0, 240))),
        )
        for i in range(15)
    ]


def _seed_rules() -> list[AnalyticsRule]:
    return [
        AnalyticsRule(
            rule_id=f"ar-{i:04d}",
            display_name=f"Synthetic scheduled rule {i}",
            kind="Scheduled",
            enabled=True,
            query=f"SecurityEvent | where EventID == {4624 + i}",
            severity="Medium",
        )
        for i in range(8)
    ]


def build_server(seed: int = DEFAULT_SEED) -> FastMCP:
    mcp: FastMCP = FastMCP(
        name="catchattack-sentinel-mock",
        instructions=(
            "MOCK Microsoft Sentinel MCP. Synthetic data. deploy_analytics_rule "
            "defaults to dry_run=true; the proxy enforces approval-token policy."
        ),
    )
    incidents = _seed_incidents(seed)
    rules = _seed_rules()

    @mcp.tool(
        name="list_incidents",
        description="List Sentinel incidents, optionally filtered by severity and status.",
    )
    def list_incidents_tool(
        severity: str | None = None, status: str | None = None, limit: int = 50
    ) -> dict[str, Any]:
        out = incidents
        if severity:
            out = [i for i in out if i.severity == severity]
        if status:
            out = [i for i in out if i.status == status]
        return {"total": len(out), "items": [i.model_dump(mode="json") for i in out[:limit]]}

    @mcp.tool(
        name="run_kql_hunt",
        description=(
            "Run an Advanced Hunting KQL query. Returns a synthetic row "
            "count and sample rows — the mock does not execute real KQL."
        ),
    )
    def run_kql_hunt_tool(kql: str, lookback_hours: int = 24) -> dict[str, Any]:
        rng = random.Random(hash(kql) & 0xFFFFFFFF)  # noqa: S311
        count = rng.randint(0, 40)
        return {
            "kql": kql,
            "lookback_hours": lookback_hours,
            "row_count": count,
            "sample_rows": [
                {
                    "TimeGenerated": _iso(datetime.now(tz=UTC)),
                    "Account": f"user{j}",
                    "EventID": 4688,
                }
                for j in range(min(count, 5))
            ],
        }

    @mcp.tool(
        name="list_analytics_rules",
        description="List Sentinel analytics (detection) rules.",
    )
    def list_analytics_rules_tool() -> dict[str, Any]:
        return {"total": len(rules), "items": [r.model_dump(mode="json") for r in rules]}

    @mcp.tool(
        name="deploy_analytics_rule",
        description=(
            "Render and (when dry_run=false) create a Sentinel scheduled "
            "analytics rule. dry_run=true returns the ARM template only."
        ),
    )
    def deploy_analytics_rule_tool(
        display_name: str,
        kql: str,
        severity: str = "Medium",
        dry_run: bool = True,
    ) -> dict[str, Any]:
        arm: dict[str, object] = {
            "type": "Microsoft.SecurityInsights/alertRules",
            "kind": "Scheduled",
            "properties": {
                "displayName": display_name,
                "severity": severity,
                "query": kql,
                "queryFrequency": "PT15M",
                "queryPeriod": "PT15M",
                "triggerOperator": "GreaterThan",
                "triggerThreshold": 0,
                "enabled": True,
            },
        }
        return DeployResult(
            display_name=display_name,
            dry_run=dry_run,
            deployed=not dry_run,
            rule_id=None if dry_run else f"ar-{abs(hash(display_name)) % 10000:04d}",
            rendered_arm=arm,
        ).model_dump(mode="json")

    return mcp


def main() -> None:
    parser = argparse.ArgumentParser(prog="sentinel-mock")
    parser.add_argument("--transport", choices=("stdio", "http"), default="stdio")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=9106)
    parser.add_argument("--seed", type=int, default=DEFAULT_SEED)
    parser.add_argument("--version", action="version", version=__version__)
    args = parser.parse_args()
    server = build_server(seed=args.seed)
    if args.transport == "stdio":
        server.run(transport="stdio")
    else:
        server.run(transport="http", host=args.host, port=args.port)


if __name__ == "__main__":
    main()
