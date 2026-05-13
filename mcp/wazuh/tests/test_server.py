"""End-to-end MCP tests via fastmcp's in-memory client."""

from __future__ import annotations

import json

import pytest
from fastmcp import Client
from wazuh_mcp.client import WazuhClient
from wazuh_mcp.server import build_server


@pytest.fixture
def server(client: WazuhClient) -> object:
    return build_server(client)


async def test_lists_all_four_tools(server: object) -> None:
    async with Client(server) as c:
        names = {t.name for t in await c.list_tools()}
        assert names == {"search", "list_rules", "deploy_rule", "estimate_fp_rate"}


async def test_list_rules_via_mcp(server: object) -> None:
    async with Client(server) as c:
        result = await c.call_tool("list_rules", {"group": "windows"})
        payload = _payload(result)
        assert payload["total"] == 2
        ids = [r["id"] for r in payload["items"]]
        assert "100100" in ids


async def test_search_via_mcp_returns_summary(server: object) -> None:
    async with Client(server) as c:
        result = await c.call_tool(
            "search",
            {
                "query": "powershell",
                "earliest": "2026-05-12T00:00:00Z",
                "latest": "2026-05-13T00:00:00Z",
                "max_results": 10,
            },
        )
        payload = _payload(result)
        assert payload["total_hits"] == 2
        assert payload["top_agents"][0][0] == "lab-win-01"


async def test_deploy_rule_dry_run_returns_xml(server: object) -> None:
    async with Client(server) as c:
        result = await c.call_tool(
            "deploy_rule",
            {
                "filename": "local_rules.xml",
                "spec": {
                    "rule_id": 100100,
                    "level": 10,
                    "description": "Test rule",
                    "match_text": "EncodedCommand",
                    "groups": ["powershell"],
                },
                "dry_run": True,
            },
        )
        payload = _payload(result)
        assert payload["dry_run"] is True
        assert payload["deployed"] is False
        assert '<rule id="100100" level="10">' in payload["rendered_xml"]
        assert payload["requires_manager_restart"] is True


async def test_deploy_rule_real_uploads_and_returns_manager_response(server: object) -> None:
    async with Client(server) as c:
        result = await c.call_tool(
            "deploy_rule",
            {
                "filename": "local_rules.xml",
                "spec": {
                    "rule_id": 100200,
                    "level": 8,
                    "description": "Real deploy",
                    "match_text": "/dev/tcp",
                },
                "dry_run": False,
            },
        )
        payload = _payload(result)
        assert payload["deployed"] is True
        assert payload["manager_response"]["error"] == 0


async def test_deploy_rule_rejects_non_xml_filename(server: object) -> None:
    async with Client(server) as c:
        result = await c.call_tool(
            "deploy_rule",
            {
                "filename": "local_rules.txt",
                "spec": {"rule_id": 100100, "level": 5, "description": "x"},
                "dry_run": True,
            },
        )
        payload = _payload(result)
        assert payload["error"] == "invalid_filename"


async def test_estimate_fp_rate_via_mcp(server: object) -> None:
    async with Client(server) as c:
        result = await c.call_tool(
            "estimate_fp_rate",
            {"query": "powershell", "lookback_days": 3},
        )
        payload = _payload(result)
        assert payload["lookback_days"] == 3
        assert payload["total_hits"] == 12
        assert payload["unique_agents"] == 3


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
