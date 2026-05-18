"""End-to-end MCP tests for the mock SentinelOne server."""

from __future__ import annotations

import json

from fastmcp import Client


async def test_lists_all_four_tools(server: object) -> None:
    async with Client(server) as c:
        names = {t.name for t in await c.list_tools()}
        assert names == {
            "powerquery",
            "list_alerts",
            "list_threats",
            "get_inventory",
        }


async def test_purple_mcp_surface_is_read_only(server: object) -> None:
    # The real purple-mcp is read-only — no deploy/destructive tools.
    async with Client(server) as c:
        names = {t.name for t in await c.list_tools()}
        assert not any("deploy" in n or "push" in n or "isolate" in n for n in names)


async def test_powerquery_is_deterministic(server: object) -> None:
    async with Client(server) as c:
        a = _payload(await c.call_tool("powerquery", {"query": "EndpointProcessEvents"}))
        b = _payload(await c.call_tool("powerquery", {"query": "EndpointProcessEvents"}))
        assert a["row_count"] == b["row_count"]


async def test_list_alerts_filters_by_attack_id(server: object) -> None:
    async with Client(server) as c:
        payload = _payload(await c.call_tool("list_alerts", {"attack_id": "T1059.001"}))
        assert all(a["attack_id"] == "T1059.001" for a in payload["items"])


async def test_list_threats_filters_by_mitigation_status(server: object) -> None:
    async with Client(server) as c:
        payload = _payload(await c.call_tool("list_threats", {"mitigation_status": "mitigated"}))
        assert all(t["mitigation_status"] == "mitigated" for t in payload["items"])


async def test_get_inventory_filters_by_os(server: object) -> None:
    async with Client(server) as c:
        payload = _payload(await c.call_tool("get_inventory", {"os_type": "windows"}))
        assert all(a["os_type"] == "windows" for a in payload["items"])


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
