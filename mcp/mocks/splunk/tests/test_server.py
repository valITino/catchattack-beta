"""End-to-end MCP test via fastmcp's in-memory client."""

from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta

from fastmcp import Client


async def test_lists_all_four_tools(server: object) -> None:
    async with Client(server) as client:
        tools = await client.list_tools()
        assert {t.name for t in tools} == {
            "search",
            "list_saved_searches",
            "deploy_rule",
            "estimate_fp_rate",
        }


async def test_search_via_mcp_returns_summary(server: object) -> None:
    async with Client(server) as client:
        earliest = (datetime.now(tz=UTC) - timedelta(days=2)).isoformat()
        latest = datetime.now(tz=UTC).isoformat()
        result = await client.call_tool(
            "search",
            {"spl": "powershell", "earliest": earliest, "latest": latest, "max_results": 5},
        )
        payload = _payload(result)
        assert "count" in payload
        assert payload["count"] >= 0
        assert isinstance(payload["samples"], list)


async def test_search_invalid_time_range_returns_error(server: object) -> None:
    async with Client(server) as client:
        result = await client.call_tool(
            "search",
            {"spl": "powershell", "earliest": "not-a-date", "latest": "also-bad"},
        )
        payload = _payload(result)
        assert payload["error"] == "invalid_time_range"


async def test_deploy_rule_dry_run_via_mcp(server: object) -> None:
    async with Client(server) as client:
        result = await client.call_tool(
            "deploy_rule",
            {
                "name": "psh_encoded_demo",
                "spl": 'search index=test "EncodedCommand"',
                "schedule": "*/15 * * * *",
                "index_target": "test",
                "dry_run": True,
            },
        )
        payload = _payload(result)
        assert payload["dry_run"] is True
        assert payload["deployed"] is False
        assert "[psh_encoded_demo]" in payload["rendered_stanza"]


async def test_list_saved_searches_via_mcp(server: object) -> None:
    async with Client(server) as client:
        result = await client.call_tool("list_saved_searches", {"app": "search"})
        payload = _payload(result)
        assert payload["app"] == "search"
        assert len(payload["items"]) == 50


async def test_estimate_fp_rate_via_mcp(server: object) -> None:
    async with Client(server) as client:
        result = await client.call_tool(
            "estimate_fp_rate",
            {"spl": "EncodedCommand", "lookback_days": 3},
        )
        payload = _payload(result)
        assert payload["lookback_days"] == 3
        assert payload["verdict"] in {"low", "medium", "high"}


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
    raise AssertionError(f"Could not extract payload from {result!r}")
