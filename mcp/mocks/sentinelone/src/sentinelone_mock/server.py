"""FastMCP mock for SentinelOne.

Mirrors the surface of the official `purple-mcp`
(github.com/Sentinel-One/purple-mcp), which is **read-only** — Purple AI
conversational investigation, PowerQuery, alerts, threats, and inventory.
No deploy/destructive tools, matching the real server.

References:
- SentinelOne Deep Visibility / PowerQuery:
  https://usea1-partners.sentinelone.net/docs/en/power-query.html
- SentinelOne Threats API:
  https://usea1-partners.sentinelone.net/api-doc/overview

Run:
    sentinelone-mock                          # stdio
    sentinelone-mock --transport http --port 9108
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
# Fraction of synthetic agents that are inactive.
_INACTIVE_AGENT_RATIO = 0.15


class Alert(BaseModel):
    model_config = ConfigDict(extra="forbid")

    alert_id: str
    name: str
    attack_id: str
    severity: str = Field(description="Critical|High|Medium|Low")
    agent_hostname: str
    reported_utc: str


class Threat(BaseModel):
    model_config = ConfigDict(extra="forbid")

    threat_id: str
    classification: str
    confidence_level: str = Field(description="malicious|suspicious")
    mitigation_status: str = Field(description="mitigated|active|blocked")
    agent_hostname: str


class AgentInventory(BaseModel):
    model_config = ConfigDict(extra="forbid")

    agent_id: str
    hostname: str
    os_type: str
    agent_version: str
    is_active: bool
    last_active_utc: str


def _iso(dt: datetime) -> str:
    return dt.replace(microsecond=0).isoformat()


def build_server(seed: int = DEFAULT_SEED) -> FastMCP:
    mcp: FastMCP = FastMCP(
        name="catchattack-sentinelone-mock",
        instructions=(
            "MOCK SentinelOne (Purple AI) MCP. Synthetic data. Read-only — "
            "the real purple-mcp exposes no deploy/destructive tools."
        ),
    )
    rng = random.Random(seed)  # noqa: S311 — synthetic data
    now = datetime.now(tz=UTC)
    techniques = ["T1059.001", "T1055", "T1486", "T1003.001", "T1112"]

    alerts = [
        Alert(
            alert_id=f"alert-{i:06d}",
            name=f"Behavioral detection {i}",
            attack_id=rng.choice(techniques),
            severity=rng.choice(["Critical", "High", "Medium", "Low"]),
            agent_hostname=f"s1-host-{i % 12:02d}",
            reported_utc=_iso(now - timedelta(hours=rng.randint(0, 200))),
        )
        for i in range(30)
    ]
    threats = [
        Threat(
            threat_id=f"threat-{i:06d}",
            classification=rng.choice(["Ransomware", "Trojan", "PUA", "Exploit"]),
            confidence_level=rng.choice(["malicious", "suspicious"]),
            mitigation_status=rng.choice(["mitigated", "active", "blocked"]),
            agent_hostname=f"s1-host-{i % 12:02d}",
        )
        for i in range(18)
    ]
    inventory = [
        AgentInventory(
            agent_id=f"s1agent-{i:08x}",
            hostname=f"s1-host-{i:02d}",
            os_type=rng.choice(["windows", "linux", "macos"]),
            agent_version="24.2.1.x",
            is_active=rng.random() > _INACTIVE_AGENT_RATIO,
            last_active_utc=_iso(now - timedelta(minutes=rng.randint(0, 600))),
        )
        for i in range(12)
    ]

    @mcp.tool(
        name="powerquery",
        description=(
            "Run a SentinelOne Deep Visibility PowerQuery. Returns a "
            "synthetic row count and sample rows — the mock does not "
            "execute real PowerQuery."
        ),
    )
    def powerquery_tool(query: str, lookback_hours: int = 24) -> dict[str, Any]:
        local = random.Random(hash(query) & 0xFFFFFFFF)  # noqa: S311
        count = local.randint(0, 80)
        return {
            "query": query,
            "lookback_hours": lookback_hours,
            "row_count": count,
            "sample_rows": [
                {"endpoint.name": f"s1-host-{j:02d}", "event.type": "Process Creation"}
                for j in range(min(count, 5))
            ],
        }

    @mcp.tool(
        name="list_alerts",
        description="List SentinelOne alerts, optionally filtered by ATT&CK technique.",
    )
    def list_alerts_tool(attack_id: str | None = None, limit: int = 50) -> dict[str, Any]:
        out = alerts
        if attack_id:
            out = [a for a in out if a.attack_id == attack_id]
        return {"total": len(out), "items": [a.model_dump(mode="json") for a in out[:limit]]}

    @mcp.tool(
        name="list_threats",
        description="List SentinelOne threats, optionally filtered by mitigation status.",
    )
    def list_threats_tool(mitigation_status: str | None = None) -> dict[str, Any]:
        out = threats
        if mitigation_status:
            out = [t for t in out if t.mitigation_status == mitigation_status]
        return {"total": len(out), "items": [t.model_dump(mode="json") for t in out]}

    @mcp.tool(
        name="get_inventory",
        description="Return the SentinelOne agent inventory, optionally filtered by OS.",
    )
    def get_inventory_tool(os_type: str | None = None) -> dict[str, Any]:
        out = inventory
        if os_type:
            out = [a for a in out if a.os_type == os_type]
        return {"total": len(out), "items": [a.model_dump(mode="json") for a in out]}

    return mcp


def main() -> None:
    parser = argparse.ArgumentParser(prog="sentinelone-mock")
    parser.add_argument("--transport", choices=("stdio", "http"), default="stdio")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=9108)
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
