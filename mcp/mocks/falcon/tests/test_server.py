"""End-to-end MCP tests via the fastmcp in-memory client."""

from __future__ import annotations

import json

from fastmcp import Client


async def test_lists_all_four_tools(server: object) -> None:
    async with Client(server) as c:
        names = {t.name for t in await c.list_tools()}
        assert names == {
            "search_detections",
            "search_hosts",
            "search_intel",
            "push_ioa_rule",
        }


async def test_search_detections_via_mcp(server: object) -> None:
    async with Client(server) as c:
        result = await c.call_tool("search_detections", {"min_severity": 50, "limit": 10})
        payload = _payload(result)
        assert payload["total"] <= 10
        assert all(d["severity"] >= 50 for d in payload["items"])


async def test_search_hosts_via_mcp(server: object) -> None:
    async with Client(server) as c:
        result = await c.call_tool("search_hosts", {"platform": "Linux"})
        payload = _payload(result)
        assert all(h["platform_name"] == "Linux" for h in payload["items"])


async def test_search_intel_via_mcp(server: object) -> None:
    async with Client(server) as c:
        result = await c.call_tool("search_intel", {"indicator_type": "ip_address"})
        payload = _payload(result)
        assert all(i["type"] == "ip_address" for i in payload["items"])


async def test_push_ioa_rule_dry_run(server: object) -> None:
    async with Client(server) as c:
        result = await c.call_tool(
            "push_ioa_rule",
            {
                "name": "psh-encoded",
                "pattern_severity": "high",
                "cmdline_pattern": ".*-enc.*",
                "dry_run": True,
            },
        )
        payload = _payload(result)
        assert payload["dry_run"] is True
        assert payload["deployed"] is False
        assert payload["rule_group_id"] is None
        assert payload["rendered_payload"]["name"] == "psh-encoded"


async def test_push_ioa_rule_real_returns_group_id(server: object) -> None:
    async with Client(server) as c:
        result = await c.call_tool(
            "push_ioa_rule",
            {
                "name": "psh-encoded-real",
                "pattern_severity": "high",
                "cmdline_pattern": ".*-enc.*",
                "dry_run": False,
            },
        )
        payload = _payload(result)
        assert payload["deployed"] is True
        assert payload["rule_group_id"] is not None


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
