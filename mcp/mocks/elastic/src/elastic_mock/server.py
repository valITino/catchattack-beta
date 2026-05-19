"""FastMCP mock for Elastic Security.

Mirrors the surface of the Elastic Agent Builder MCP endpoint built into
Kibana 9.2.0+ (the standalone elastic/mcp-server-elasticsearch repo is
deprecated — addendum §A.1): ES|QL search, the Kibana Detection Engine
rules, and detection-rule deployment.

References:
- Kibana Detection Engine API:
  https://www.elastic.co/guide/en/security/current/rule-api-overview.html
- ES|QL:
  https://www.elastic.co/guide/en/elasticsearch/reference/current/esql.html

Run:
    elastic-mock                          # stdio
    elastic-mock --transport http --port 9109
"""

from __future__ import annotations

import argparse
import random
import zlib
from datetime import UTC, datetime
from typing import Any

from fastmcp import FastMCP
from pydantic import BaseModel, ConfigDict, Field

from . import __version__

DEFAULT_SEED = 20260513


class DetectionRule(BaseModel):
    model_config = ConfigDict(extra="forbid")

    rule_id: str
    name: str
    type: str = Field(description="query|eql|esql|threshold|machine_learning")
    enabled: bool
    risk_score: int = Field(ge=0, le=100)
    query: str
    attack_id: str


class DeployResult(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str
    dry_run: bool
    deployed: bool
    rule_id: str | None
    rendered_rule: dict[str, object]


def _iso(dt: datetime) -> str:
    return dt.replace(microsecond=0).isoformat()


def build_server(seed: int = DEFAULT_SEED) -> FastMCP:
    mcp: FastMCP = FastMCP(
        name="catchattack-elastic-mock",
        instructions=(
            "MOCK Elastic Security MCP. Synthetic data. "
            "deploy_detection_rule defaults to dry_run=true; the proxy "
            "enforces approval-token policy."
        ),
    )
    rng = random.Random(seed)  # noqa: S311 — synthetic data
    techniques = ["T1059.001", "T1003.001", "T1021.001", "T1486", "T1547.001"]
    rules = [
        DetectionRule(
            rule_id=f"elastic-rule-{i:04d}",
            name=f"Synthetic detection rule {i}",
            type=rng.choice(["query", "eql", "esql", "threshold"]),
            enabled=True,
            risk_score=rng.choice([21, 47, 73, 99]),
            query=f'process where process.name == "proc{i}.exe"',
            attack_id=rng.choice(techniques),
        )
        for i in range(10)
    ]

    @mcp.tool(
        name="esql_query",
        description=(
            "Run an ES|QL query. Returns a synthetic row count and sample "
            "rows — the mock does not execute real ES|QL."
        ),
    )
    def esql_query_tool(esql: str, lookback_hours: int = 24) -> dict[str, Any]:
        local = random.Random(zlib.crc32(esql.encode()))  # noqa: S311
        count = local.randint(0, 50)
        return {
            "esql": esql,
            "lookback_hours": lookback_hours,
            "row_count": count,
            "sample_rows": [
                {"@timestamp": _iso(datetime.now(tz=UTC)), "host.name": f"es-host-{j}"}
                for j in range(min(count, 5))
            ],
        }

    @mcp.tool(
        name="list_detection_rules",
        description="List Kibana Detection Engine rules, optionally filtered by ATT&CK technique.",
    )
    def list_detection_rules_tool(attack_id: str | None = None, limit: int = 50) -> dict[str, Any]:
        out = rules
        if attack_id:
            out = [r for r in out if r.attack_id == attack_id]
        return {"total": len(out), "items": [r.model_dump(mode="json") for r in out[:limit]]}

    @mcp.tool(
        name="deploy_detection_rule",
        description=(
            "Render and (when dry_run=false) create a Kibana Detection "
            "Engine rule. dry_run=true returns the rendered rule payload only."
        ),
    )
    def deploy_detection_rule_tool(
        name: str,
        query: str,
        rule_type: str = "esql",
        risk_score: int = 47,
        dry_run: bool = True,
    ) -> dict[str, Any]:
        rendered: dict[str, object] = {
            "name": name,
            "type": rule_type,
            "query": query,
            "risk_score": risk_score,
            "severity": "medium",
            "enabled": True,
            "interval": "5m",
            "from": "now-6m",
        }
        return DeployResult(
            name=name,
            dry_run=dry_run,
            deployed=not dry_run,
            rule_id=None if dry_run else f"elastic-rule-{zlib.crc32(name.encode()) % 10000:04d}",
            rendered_rule=rendered,
        ).model_dump(mode="json")

    return mcp


def main() -> None:
    parser = argparse.ArgumentParser(prog="elastic-mock")
    parser.add_argument("--transport", choices=("stdio", "http"), default="stdio")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=9109)
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
