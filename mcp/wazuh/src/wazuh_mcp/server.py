"""FastMCP server for Wazuh.

Tools (all strict-schema):
- search(query, earliest, latest, max_results)
- list_rules(group?, level_min?, limit=100)
- deploy_rule(filename, spec, dry_run=true) — renders XML; PUTs only if dry_run=false
- estimate_fp_rate(query, lookback_days=7)

Configuration via env (read once at process start):
- WAZUH_MANAGER_URL          e.g. https://wazuh.lab:55000
- WAZUH_MANAGER_USER         e.g. wazuh-wui
- WAZUH_MANAGER_PASSWORD
- WAZUH_INDEXER_URL          e.g. https://wazuh.lab:9200
- WAZUH_INDEXER_USER         default 'admin'
- WAZUH_INDEXER_PASSWORD
- WAZUH_VERIFY_TLS           '1' or '0' (default 1)

The proxy wraps this server with the standard dry-run + target-allowlist +
approval-token policy. `deploy_rule` is the only destructive tool exposed.
"""

from __future__ import annotations

import argparse
import os
from typing import Any

from fastmcp import FastMCP

from . import __version__
from .client import WazuhClient, WazuhConfig, summarise_fp, summarise_hits
from .rules import WazuhRuleSpec, render_rule_xml


def _config_from_env() -> WazuhConfig:
    def must(name: str) -> str:
        val = os.environ.get(name)
        if not val:
            raise RuntimeError(f"required env var {name} is not set")
        return val

    return WazuhConfig(
        manager_base_url=must("WAZUH_MANAGER_URL"),
        manager_user=must("WAZUH_MANAGER_USER"),
        manager_password=must("WAZUH_MANAGER_PASSWORD"),
        indexer_base_url=must("WAZUH_INDEXER_URL"),
        indexer_user=os.environ.get("WAZUH_INDEXER_USER", "admin"),
        indexer_password=must("WAZUH_INDEXER_PASSWORD"),
        verify_tls=os.environ.get("WAZUH_VERIFY_TLS", "1") != "0",
    )


def build_server(client: WazuhClient) -> FastMCP:
    mcp: FastMCP = FastMCP(
        name="catchattack-wazuh",
        instructions=(
            "Wazuh SIEM/XDR operations. `search` and `estimate_fp_rate` are "
            "read-only and may be called freely. `deploy_rule` writes to the "
            "manager's rule file; it defaults to dry_run=true and the proxy "
            "enforces approval-token policy on top. A manager restart is "
            "required after a real deploy to reload the ruleset — this server "
            "does not trigger it."
        ),
    )

    @mcp.tool(
        name="search",
        description=(
            "Search Wazuh alerts via the wazuh-indexer (OpenSearch). `query` is "
            "a Lucene query_string; earliest/latest are ISO8601. Returns an "
            "aggregated rollup with up to 10 sample alerts."
        ),
    )
    async def search_tool(
        query: str, earliest: str, latest: str, max_results: int = 10
    ) -> dict[str, Any]:
        try:
            raw = await client.search_alerts(
                query=query, earliest=earliest, latest=latest, size=max(10, max_results)
            )
        except Exception as exc:
            return {"error": "indexer_failed", "detail": str(exc)}
        return summarise_hits(raw, query=query, earliest=earliest, latest=latest)

    @mcp.tool(
        name="list_rules",
        description=(
            "List Wazuh manager rules, optionally filtered by group and minimum "
            "rule level. Returns up to `limit` rules (default 100)."
        ),
    )
    async def list_rules_tool(
        group: str | None = None, level_min: int | None = None, limit: int = 100
    ) -> dict[str, Any]:
        try:
            raw = await client.list_rules(group=group, level_min=level_min, limit=limit)
        except Exception as exc:
            return {"error": "manager_failed", "detail": str(exc)}
        data = raw.get("data") or {}
        items_raw = data.get("affected_items") or []
        items = [
            {
                "id": str(it.get("id") or ""),
                "level": int(it.get("level") or 0),
                "description": str(it.get("description") or ""),
                "groups": list(it.get("groups") or []),
                "file": it.get("filename"),
                "status": it.get("status"),
            }
            for it in items_raw
        ]
        return {"total": int(data.get("total_affected_items") or len(items)), "items": items}

    @mcp.tool(
        name="deploy_rule",
        description=(
            "Render a Wazuh rule XML stanza and (when dry_run=false) PUT it to "
            "the manager's rules/files endpoint. `filename` must end in .xml; "
            "convention is local_rules.xml. Manager restart is operator-triggered."
        ),
    )
    async def deploy_rule_tool(
        filename: str,
        spec: WazuhRuleSpec,
        dry_run: bool = True,
    ) -> dict[str, Any]:
        if not filename.endswith(".xml"):
            return {"error": "invalid_filename", "detail": "filename must end with .xml"}
        xml = render_rule_xml(spec)
        if dry_run:
            return {
                "filename": filename,
                "dry_run": True,
                "rendered_xml": xml,
                "deployed": False,
                "requires_manager_restart": True,
                "manager_response": None,
            }
        try:
            resp = await client.upload_rule_file(filename=filename, content=xml)
        except Exception as exc:
            return {
                "error": "deploy_failed",
                "detail": str(exc),
                "rendered_xml": xml,
            }
        return {
            "filename": filename,
            "dry_run": False,
            "rendered_xml": xml,
            "deployed": True,
            "requires_manager_restart": True,
            "manager_response": resp,
        }

    @mcp.tool(
        name="estimate_fp_rate",
        description=(
            "Run the query over the last `lookback_days` of indexer history and "
            "return the hits/day distribution + unique-agent count + verdict "
            "('low'<5/day, 'medium'<50/day, 'high'>=50/day)."
        ),
    )
    async def estimate_fp_rate_tool(query: str, lookback_days: int = 7) -> dict[str, Any]:
        try:
            raw = await client.count_by_day(query=query, lookback_days=lookback_days)
        except Exception as exc:
            return {"error": "indexer_failed", "detail": str(exc)}
        return summarise_fp(raw, query=query, lookback_days=lookback_days)

    return mcp


def main() -> None:
    parser = argparse.ArgumentParser(prog="wazuh-mcp")
    parser.add_argument("--transport", choices=("stdio", "http"), default="stdio")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=9102)
    parser.add_argument("--version", action="version", version=__version__)
    args = parser.parse_args()

    config = _config_from_env()
    client = WazuhClient(config=config)
    server = build_server(client)

    if args.transport == "stdio":
        server.run(transport="stdio")
    else:
        server.run(transport="http", host=args.host, port=args.port)


if __name__ == "__main__":
    main()
