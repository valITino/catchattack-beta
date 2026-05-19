"""FastMCP mock for Google SecOps (Chronicle).

Mirrors the surface of the official `google-secops-mcp` from
github.com/google/mcp-security: UDM search, curated/custom detections,
and YARA-L 2.0 rule management. Flip `upstreams.chronicle.mode` when
real Google ADC credentials are available.

References:
- Chronicle UDM search:
  https://cloud.google.com/chronicle/docs/reference/udm-search-api
- YARA-L 2.0:
  https://cloud.google.com/chronicle/docs/detection/yara-l-2-0-overview

Run:
    chronicle-mock                          # stdio
    chronicle-mock --transport http --port 9107
"""

from __future__ import annotations

import argparse
import random
import zlib
from datetime import UTC, datetime, timedelta
from typing import Any

from fastmcp import FastMCP
from pydantic import BaseModel, ConfigDict, Field

from . import __version__

DEFAULT_SEED = 20260513


class Detection(BaseModel):
    model_config = ConfigDict(extra="forbid")

    detection_id: str
    rule_name: str
    attack_id: str
    udm_event_type: str
    hostname: str
    detected_utc: str
    risk_score: int = Field(ge=0, le=100)


class YaraLRule(BaseModel):
    model_config = ConfigDict(extra="forbid")

    rule_id: str
    rule_name: str
    enabled: bool
    yaral_text: str


class DeployResult(BaseModel):
    model_config = ConfigDict(extra="forbid")

    rule_name: str
    dry_run: bool
    deployed: bool
    rule_id: str | None
    rendered_yaral: str


def _iso(dt: datetime) -> str:
    return dt.replace(microsecond=0).isoformat()


def build_server(seed: int = DEFAULT_SEED) -> FastMCP:
    mcp: FastMCP = FastMCP(
        name="catchattack-chronicle-mock",
        instructions=(
            "MOCK Google SecOps (Chronicle) MCP. Synthetic data. "
            "deploy_yaral_rule defaults to dry_run=true; the proxy enforces "
            "approval-token policy."
        ),
    )
    rng = random.Random(seed)  # noqa: S311 — synthetic data
    now = datetime.now(tz=UTC)
    techniques = ["T1059.001", "T1003.001", "T1021.002", "T1486", "T1567.002"]
    detections = [
        Detection(
            detection_id=f"de_{i:08x}",
            rule_name=f"chronicle_rule_{i % 6}",
            attack_id=rng.choice(techniques),
            udm_event_type=rng.choice(["PROCESS_LAUNCH", "NETWORK_CONNECTION", "FILE_CREATION"]),
            hostname=f"secops-host-{i % 10:02d}",
            detected_utc=_iso(now - timedelta(hours=rng.randint(0, 168))),
            risk_score=rng.choice([35, 55, 70, 85, 95]),
        )
        for i in range(40)
    ]
    # Highest-risk first — the synthetic set never changes, so rank once.
    detections.sort(key=lambda d: d.risk_score, reverse=True)
    rules = [
        YaraLRule(
            rule_id=f"ru_{i:08x}",
            rule_name=f"chronicle_rule_{i}",
            enabled=True,
            yaral_text=f"rule chronicle_rule_{i} {{ condition: $e }}",
        )
        for i in range(6)
    ]

    @mcp.tool(
        name="udm_search",
        description=(
            "Run a Chronicle UDM search. Returns a synthetic match count "
            "and sample events — the mock does not execute real UDM."
        ),
    )
    def udm_search_tool(udm_query: str, lookback_hours: int = 24) -> dict[str, Any]:
        local = random.Random(zlib.crc32(udm_query.encode()))  # noqa: S311
        count = local.randint(0, 60)
        return {
            "udm_query": udm_query,
            "lookback_hours": lookback_hours,
            "match_count": count,
            "sample_events": [
                {"event_type": "PROCESS_LAUNCH", "timestamp": _iso(now)}
                for _ in range(min(count, 5))
            ],
        }

    @mcp.tool(
        name="list_detections",
        description="List Chronicle detections, optionally filtered by ATT&CK technique.",
    )
    def list_detections_tool(attack_id: str | None = None, limit: int = 50) -> dict[str, Any]:
        out = detections
        if attack_id:
            out = [d for d in out if d.attack_id == attack_id]
        return {
            "total": len(out),
            "items": [d.model_dump(mode="json") for d in out[:limit]],
        }

    @mcp.tool(name="list_rules", description="List YARA-L 2.0 detection rules.")
    def list_rules_tool() -> dict[str, Any]:
        return {"total": len(rules), "items": [r.model_dump(mode="json") for r in rules]}

    @mcp.tool(
        name="deploy_yaral_rule",
        description=(
            "Render and (when dry_run=false) create a YARA-L 2.0 rule. "
            "dry_run=true returns the rendered rule text only."
        ),
    )
    def deploy_yaral_rule_tool(
        rule_name: str, yaral_text: str, dry_run: bool = True
    ) -> dict[str, Any]:
        return DeployResult(
            rule_name=rule_name,
            dry_run=dry_run,
            deployed=not dry_run,
            rule_id=None if dry_run else f"ru_{zlib.crc32(rule_name.encode()) % 10**8:08x}",
            rendered_yaral=yaral_text,
        ).model_dump(mode="json")

    return mcp


def main() -> None:
    parser = argparse.ArgumentParser(prog="chronicle-mock")
    parser.add_argument("--transport", choices=("stdio", "http"), default="stdio")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=9107)
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
