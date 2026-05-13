"""FastMCP mock for the Splunk MCP tool surface.

The four-tool contract matches BUILD_BRIEF.md Phase 2 and the surface the
official Splunk MCP (CiscoDevNet/Splunk-MCP-Server-official, Splunkbase App
7931) exposes at /services/mcp on Splunk's mgmt port 8089. When operators
acquire Splunk credentials they flip `upstreams.splunk.mode` from `mock` to
`real` in upstreams.yaml; no Conductor/UI changes required.

Run:
    splunk-mock                          # stdio (Claude Desktop)
    splunk-mock --transport http --port 9101    # mock_url for the proxy

References:
- /services/search/jobs
  https://docs.splunk.com/Documentation/Splunk/latest/RESTREF/RESTsearch
- /servicesNS/{user}/{app}/saved/searches
  https://docs.splunk.com/Documentation/Splunk/latest/RESTREF/RESTknowledge
"""

from __future__ import annotations

import argparse
from typing import Any

from fastmcp import FastMCP
from pydantic import BaseModel

from . import __version__
from .store import DEFAULT_SEED, SplunkStore


def _as_dict(value: BaseModel) -> dict[str, Any]:
    return value.model_dump(mode="json")


def build_server(seed: int = DEFAULT_SEED, history_days: int = 7) -> FastMCP:
    mcp: FastMCP = FastMCP(
        name="catchattack-splunk-mock",
        instructions=(
            "MOCK Splunk MCP. Synthetic data; do not treat results as ground "
            "truth. `deploy_rule` defaults to dry_run=true. The proxy layers "
            "approval-token enforcement on top of this."
        ),
    )
    store = SplunkStore(seed=seed, history_days=history_days)

    @mcp.tool(
        name="search",
        description=(
            "Run an SPL search over the synthetic event store. Returns an "
            "aggregated rollup (count, top hosts/users/sources, up to 10 "
            "sample events). Mirrors /services/search/jobs."
        ),
    )
    def search_tool(spl: str, earliest: str, latest: str, max_results: int = 10) -> dict[str, Any]:
        try:
            return _as_dict(store.search(spl, earliest, latest, max_results))
        except ValueError as exc:
            return {"error": "invalid_time_range", "detail": str(exc)}

    @mcp.tool(
        name="list_saved_searches",
        description=(
            "List saved searches, optionally filtered by app. Mirrors "
            "/servicesNS/{user}/{app}/saved/searches."
        ),
    )
    def list_saved_searches_tool(app: str | None = None) -> dict[str, Any]:
        items = store.list_saved_searches(app)
        return {"app": app, "items": [s.model_dump(mode="json") for s in items]}

    @mcp.tool(
        name="deploy_rule",
        description=(
            "Render and (when dry_run=false) install a Splunk savedsearch. "
            "dry_run=true returns the rendered savedsearch.conf stanza only; "
            "no POST is made. The proxy enforces dry_run/approval policy on "
            "top of this server."
        ),
    )
    def deploy_rule_tool(
        name: str,
        spl: str,
        schedule: str,
        index_target: str,
        app: str = "search",
        dry_run: bool = True,
    ) -> dict[str, Any]:
        stanza, ss = store.deploy_rule(
            name=name,
            spl=spl,
            schedule=schedule,
            index_target=index_target,
            app=app,
            dry_run=dry_run,
        )
        return {
            "name": name,
            "dry_run": dry_run,
            "rendered_stanza": stanza,
            "deployed": ss is not None,
            "saved_search": ss.model_dump(mode="json") if ss else None,
        }

    @mcp.tool(
        name="estimate_fp_rate",
        description=(
            "Run the SPL over the last lookback_days of synthetic history. "
            "Returns hits/day distribution + unique-host count + verdict "
            "('low'<5/day, 'medium'<50/day, 'high'>=50/day)."
        ),
    )
    def estimate_fp_rate_tool(spl: str, lookback_days: int = 7) -> dict[str, Any]:
        return _as_dict(store.estimate_fp_rate(spl, lookback_days))

    return mcp


def main() -> None:
    parser = argparse.ArgumentParser(
        prog="splunk-mock",
        description="CatchAttack — mock Splunk MCP for offline development.",
    )
    parser.add_argument("--transport", choices=("stdio", "http"), default="stdio")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=9101)
    parser.add_argument("--seed", type=int, default=DEFAULT_SEED)
    parser.add_argument("--days", type=int, default=7, help="History depth (days).")
    parser.add_argument("--version", action="version", version=__version__)
    args = parser.parse_args()

    server = build_server(seed=args.seed, history_days=args.days)
    if args.transport == "stdio":
        server.run(transport="stdio")
    else:
        server.run(transport="http", host=args.host, port=args.port)


if __name__ == "__main__":
    main()
