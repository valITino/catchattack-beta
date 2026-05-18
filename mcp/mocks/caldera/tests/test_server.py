"""End-to-end MCP tests for the mock CALDERA server."""

from __future__ import annotations

import json

from fastmcp import Client


async def test_lists_all_four_tools(server: object) -> None:
    async with Client(server) as c:
        names = {t.name for t in await c.list_tools()}
        assert names == {
            "list_abilities",
            "list_operations",
            "create_operation",
            "run_ability",
        }


async def test_list_abilities_filters_by_technique(server: object) -> None:
    async with Client(server) as c:
        payload = _payload(await c.call_tool("list_abilities", {"technique_id": "T1059.001"}))
        assert payload["total"] >= 1
        assert all(a["technique_id"] == "T1059.001" for a in payload["items"])


async def test_create_operation_dry_run_does_not_persist(server: object) -> None:
    async with Client(server) as c:
        payload = _payload(
            await c.call_tool(
                "create_operation",
                {"name": "op1", "adversary": "FIN7", "dry_run": True},
            )
        )
        assert payload["dry_run"] is True
        assert payload["created"] is False
        assert payload["operation_id"] is None

        ops = _payload(await c.call_tool("list_operations", {}))
        assert ops["total"] == 0


async def test_create_operation_real_persists(server: object) -> None:
    async with Client(server) as c:
        payload = _payload(
            await c.call_tool(
                "create_operation",
                {"name": "op2", "adversary": "APT29", "dry_run": False},
            )
        )
        assert payload["created"] is True
        assert payload["operation_id"] is not None

        ops = _payload(await c.call_tool("list_operations", {}))
        assert ops["total"] == 1


async def test_run_ability_dry_run(server: object) -> None:
    async with Client(server) as c:
        payload = _payload(
            await c.call_tool(
                "run_ability",
                {"ability_id": "c1cd6388-3ced-48c7-a511-0434c6ba8f48", "dry_run": True},
            )
        )
        assert payload["dry_run"] is True
        assert payload["executed"] is False
        assert payload["link_id"] is None
        assert payload["technique_id"] == "T1059.001"


async def test_run_ability_unknown_returns_error(server: object) -> None:
    async with Client(server) as c:
        payload = _payload(await c.call_tool("run_ability", {"ability_id": "nope"}))
        assert payload["error"] == "unknown_ability"


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
