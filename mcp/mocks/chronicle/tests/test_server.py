"""End-to-end MCP tests for the mock Chronicle server."""

from __future__ import annotations

import json

from fastmcp import Client


async def test_lists_all_four_tools(server: object) -> None:
    async with Client(server) as c:
        names = {t.name for t in await c.list_tools()}
        assert names == {
            "udm_search",
            "list_detections",
            "list_rules",
            "deploy_yaral_rule",
        }


async def test_udm_search_is_deterministic(server: object) -> None:
    async with Client(server) as c:
        a = _payload(await c.call_tool("udm_search", {"udm_query": "metadata.event_type = x"}))
        b = _payload(await c.call_tool("udm_search", {"udm_query": "metadata.event_type = x"}))
        assert a["match_count"] == b["match_count"]


async def test_list_detections_filters_by_attack_id(server: object) -> None:
    async with Client(server) as c:
        payload = _payload(await c.call_tool("list_detections", {"attack_id": "T1059.001"}))
        assert all(d["attack_id"] == "T1059.001" for d in payload["items"])


async def test_list_detections_ranked_by_risk(server: object) -> None:
    async with Client(server) as c:
        payload = _payload(await c.call_tool("list_detections", {}))
        scores = [d["risk_score"] for d in payload["items"]]
        assert scores == sorted(scores, reverse=True)


async def test_deploy_yaral_rule_dry_run(server: object) -> None:
    async with Client(server) as c:
        payload = _payload(
            await c.call_tool(
                "deploy_yaral_rule",
                {"rule_name": "r1", "yaral_text": "rule r1 { condition: $e }", "dry_run": True},
            )
        )
        assert payload["dry_run"] is True
        assert payload["deployed"] is False
        assert payload["rule_id"] is None


async def test_deploy_yaral_rule_real(server: object) -> None:
    async with Client(server) as c:
        payload = _payload(
            await c.call_tool(
                "deploy_yaral_rule",
                {"rule_name": "r2", "yaral_text": "rule r2 {}", "dry_run": False},
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
