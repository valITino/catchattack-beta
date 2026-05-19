"""End-to-end MCP tests for the mock Elastic Security server."""

from __future__ import annotations

import json

from fastmcp import Client


async def test_lists_all_three_tools(server: object) -> None:
    async with Client(server) as c:
        names = {t.name for t in await c.list_tools()}
        assert names == {
            "esql_query",
            "list_detection_rules",
            "deploy_detection_rule",
        }


async def test_esql_query_is_deterministic(server: object) -> None:
    async with Client(server) as c:
        a = _payload(await c.call_tool("esql_query", {"esql": "FROM logs | LIMIT 10"}))
        b = _payload(await c.call_tool("esql_query", {"esql": "FROM logs | LIMIT 10"}))
        assert a["row_count"] == b["row_count"]


async def test_list_detection_rules_filters_by_attack_id(server: object) -> None:
    async with Client(server) as c:
        payload = _payload(await c.call_tool("list_detection_rules", {"attack_id": "T1059.001"}))
        assert all(r["attack_id"] == "T1059.001" for r in payload["items"])


async def test_deploy_detection_rule_dry_run(server: object) -> None:
    async with Client(server) as c:
        payload = _payload(
            await c.call_tool(
                "deploy_detection_rule",
                {"name": "psh-enc", "query": "process where x", "dry_run": True},
            )
        )
        assert payload["dry_run"] is True
        assert payload["deployed"] is False
        assert payload["rule_id"] is None
        assert payload["rendered_rule"]["name"] == "psh-enc"


async def test_deploy_detection_rule_real(server: object) -> None:
    async with Client(server) as c:
        payload = _payload(
            await c.call_tool(
                "deploy_detection_rule",
                {"name": "psh-enc-real", "query": "x", "dry_run": False},
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
