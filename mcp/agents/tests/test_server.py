"""End-to-end bridge MCP tests via the fastmcp in-memory client."""

from __future__ import annotations

import json

from fastmcp import Client


async def test_lists_all_five_tools(server: object) -> None:
    async with Client(server) as c:
        names = {t.name for t in await c.list_tools()}
        assert names == {
            "list_agents",
            "get_inventory",
            "run_atomic",
            "start_capture",
            "stop_capture",
        }


async def test_list_agents_via_mcp(server: object) -> None:
    async with Client(server) as c:
        result = await c.call_tool("list_agents", {})
        payload = _payload(result)
        ids = {a["agent_id"] for a in payload["items"]}
        assert ids == {"lab-linux-01", "lab-win-01"}


async def test_get_inventory_via_mcp(server: object) -> None:
    async with Client(server) as c:
        result = await c.call_tool("get_inventory", {"agent_id": "lab-linux-01"})
        payload = _payload(result)
        assert payload["os"] == "linux"
        assert payload["ip_addresses"] == ["10.0.0.11"]


async def test_get_inventory_unknown_returns_error(server: object) -> None:
    async with Client(server) as c:
        result = await c.call_tool("get_inventory", {"agent_id": "nope"})
        payload = _payload(result)
        assert payload["error"] == "unknown_agent"


async def test_run_atomic_dry_run_returns_receipt(server: object) -> None:
    async with Client(server) as c:
        result = await c.call_tool(
            "run_atomic",
            {
                "agent_id": "lab-linux-01",
                "technique": "T1059.004",
                "test_number": 1,
                "dry_run": True,
            },
        )
        payload = _payload(result)
        assert payload["dry_run"] is True
        assert payload["technique"] == "T1059.004"
        assert payload["capture_id"]


async def test_start_then_stop_capture_via_mcp(server: object) -> None:
    async with Client(server) as c:
        start = _payload(
            await c.call_tool(
                "start_capture",
                {"agent_id": "lab-win-01", "capture_id": "cap-xyz"},
            )
        )
        assert start["capture_id"] == "cap-xyz"
        stop = _payload(await c.call_tool("stop_capture", {"capture_id": "cap-xyz"}))
        assert stop["capture_id"] == "cap-xyz"


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
