"""FastMCP mock for the CrowdStrike Falcon MCP surface.

Tools match the official falcon-mcp's detections / hosts / intel modules
(github.com/CrowdStrike/falcon-mcp). When operators obtain CrowdStrike
credentials they flip `upstreams.falcon.mode` from `mock` to `real`; no
Conductor or UI changes required (BUILD_BRIEF_ADDENDUM.md §B.2).

Run:
    falcon-mock                          # stdio
    falcon-mock --transport http --port 9103
"""

from __future__ import annotations

import argparse
import zlib
from typing import Any

from fastmcp import FastMCP

from . import __version__
from .models import IOARuleResult
from .store import DEFAULT_SEED, FalconStore


def _stable_id(text: str) -> int:
    """Process-stable 32-bit id from a string.

    `hash()` is salted per-process (PYTHONHASHSEED), so a rule id derived
    from it changes between runs. crc32 is deterministic.
    """
    return zlib.crc32(text.encode())


def build_server(seed: int = DEFAULT_SEED) -> FastMCP:
    mcp: FastMCP = FastMCP(
        name="catchattack-falcon-mock",
        instructions=(
            "MOCK CrowdStrike Falcon MCP. Synthetic data; do not treat "
            "results as ground truth. push_ioa_rule defaults to dry_run=true "
            "and the proxy enforces approval-token policy on top."
        ),
    )
    store = FalconStore(seed=seed)

    @mcp.tool(
        name="search_detections",
        description=(
            "Search Falcon detections. Filter by ATT&CK technique id, "
            "minimum severity (1-100), and status. Returns the highest-"
            "severity matches first."
        ),
    )
    def search_detections_tool(
        attack_id: str | None = None,
        min_severity: int = 1,
        status: str | None = None,
        limit: int = 20,
    ) -> dict[str, Any]:
        items = store.search_detections(
            attack_id=attack_id,
            min_severity=min_severity,
            status=status,
            limit=limit,
        )
        return {
            "total": len(items),
            "items": [d.model_dump(mode="json") for d in items],
        }

    @mcp.tool(
        name="search_hosts",
        description="List Falcon-managed hosts, optionally filtered by platform.",
    )
    def search_hosts_tool(platform: str | None = None, limit: int = 50) -> dict[str, Any]:
        items = store.search_hosts(platform=platform, limit=limit)
        return {
            "total": len(items),
            "items": [h.model_dump(mode="json") for h in items],
        }

    @mcp.tool(
        name="search_intel",
        description=(
            "Search Falcon Intelligence indicators. Filter by type "
            "(hash_sha256|domain|ip_address|url)."
        ),
    )
    def search_intel_tool(indicator_type: str | None = None, limit: int = 50) -> dict[str, Any]:
        items = store.search_intel(indicator_type=indicator_type, limit=limit)
        return {
            "total": len(items),
            "items": [i.model_dump(mode="json") for i in items],
        }

    @mcp.tool(
        name="push_ioa_rule",
        description=(
            "Render and (when dry_run=false) create a custom IOA rule "
            "group. dry_run=true returns the rendered API payload only; no "
            "POST is made. The proxy enforces dry_run/approval policy."
        ),
    )
    def push_ioa_rule_tool(
        name: str,
        pattern_severity: str,
        cmdline_pattern: str,
        platform: str = "windows",
        dry_run: bool = True,
    ) -> dict[str, Any]:
        # Shape mirrors the Custom IOA "rule-groups" + "rules" payload.
        payload: dict[str, object] = {
            "name": name,
            "platform": platform,
            "rules": [
                {
                    "ruletype_id": "5",  # process creation
                    "pattern_severity": pattern_severity,
                    "field_values": [
                        {
                            "name": "CommandLine",
                            "type": "excludable",
                            "values": [{"label": "include", "value": cmdline_pattern}],
                        }
                    ],
                    "disposition_id": 20,  # detect
                }
            ],
        }
        result = IOARuleResult(
            name=name,
            dry_run=dry_run,
            deployed=not dry_run,
            rule_group_id=None if dry_run else f"ioarg-{_stable_id(name) % 10**8:08d}",
            rendered_payload=payload,
        )
        return result.model_dump(mode="json")

    return mcp


def main() -> None:
    parser = argparse.ArgumentParser(
        prog="falcon-mock",
        description="CatchAttack — mock CrowdStrike Falcon MCP for offline development.",
    )
    parser.add_argument("--transport", choices=("stdio", "http"), default="stdio")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=9103)
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
