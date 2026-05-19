"""End-to-end MCP tests for the mock Sentinel server."""

from __future__ import annotations

import json

from fastmcp import Client


async def test_lists_all_four_tools(server: object) -> None:
    async with Client(server) as c:
        names = {t.name for t in await c.list_tools()}
        assert names == {
            "list_incidents",
            "run_kql_hunt",
            "list_analytics_rules",
            "deploy_analytics_rule",
        }


async def test_list_incidents_filters_by_severity(server: object) -> None:
    async with Client(server) as c:
        payload = _payload(await c.call_tool("list_incidents", {"severity": "High"}))
        assert all(i["severity"] == "High" for i in payload["items"])


async def test_run_kql_hunt_is_deterministic(server: object) -> None:
    async with Client(server) as c:
        a = _payload(await c.call_tool("run_kql_hunt", {"kql": "SecurityEvent | count"}))
        b = _payload(await c.call_tool("run_kql_hunt", {"kql": "SecurityEvent | count"}))
        assert a["row_count"] == b["row_count"]


async def test_list_analytics_rules(server: object) -> None:
    async with Client(server) as c:
        payload = _payload(await c.call_tool("list_analytics_rules", {}))
        assert payload["total"] >= 1


async def test_deploy_analytics_rule_dry_run(server: object) -> None:
    async with Client(server) as c:
        payload = _payload(
            await c.call_tool(
                "deploy_analytics_rule",
                {"display_name": "psh-enc", "kql": "SecurityEvent | where x", "dry_run": True},
            )
        )
        assert payload["dry_run"] is True
        assert payload["deployed"] is False
        assert payload["rule_id"] is None
        assert payload["rendered_arm"]["kind"] == "Scheduled"


async def test_deploy_analytics_rule_real(server: object) -> None:
    async with Client(server) as c:
        payload = _payload(
            await c.call_tool(
                "deploy_analytics_rule",
                {"display_name": "psh-enc-real", "kql": "x", "dry_run": False},
            )
        )
        assert payload["deployed"] is True
        assert payload["rule_id"] is not None


def _payload(result: object) -> dict[str, object]:
    structured = getattr(result, "structured_content", None)
    if structured:
        return structured
    data = getattr(result, "data", None)
    if data is not None:
        if hasattr(data, "model_dump"):
            return data.model_dump(mode="json")
        if isinstance(data, dict):
            return data
    content = getattr(result, "content", None)
    if content:
        text = getattr(content[0], "text", None)
        if text:
            return json.loads(text)
    raise AssertionError(f"could not extract payload from {result!r}")
