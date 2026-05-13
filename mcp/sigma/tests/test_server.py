"""End-to-end MCP test: drive the server via fastmcp's in-memory client."""

from __future__ import annotations

import json

import pytest
from fastmcp import Client
from sigma_mcp.server import build_server


@pytest.fixture
def server() -> object:
    return build_server(corpus_root=None)


async def test_lists_all_four_tools(server: object) -> None:
    async with Client(server) as client:
        tools = await client.list_tools()
        names = {t.name for t in tools}
        assert names == {
            "parse_sigma",
            "lint_sigma",
            "convert_sigma",
            "dedupe_against_corpus",
        }


async def test_parse_sigma_via_mcp(server: object, psh_encoded: str) -> None:
    async with Client(server) as client:
        result = await client.call_tool("parse_sigma", {"yaml_text": psh_encoded})
        payload = _payload(result)
        assert payload["title"].startswith("Suspicious PowerShell")
        assert "T1059.001" in payload["attack_techniques"]


async def test_convert_sigma_via_mcp_returns_splunk_query(server: object, psh_encoded: str) -> None:
    async with Client(server) as client:
        result = await client.call_tool(
            "convert_sigma",
            {"yaml_text": psh_encoded, "target": "splunk"},
        )
        payload = _payload(result)
        assert payload["target"] == "splunk"
        assert payload["queries"]
        assert isinstance(payload["queries"][0], str)


async def test_lint_sigma_via_mcp_reports_clean(server: object, psh_encoded: str) -> None:
    async with Client(server) as client:
        result = await client.call_tool("lint_sigma", {"yaml_text": psh_encoded})
        payload = _payload(result)
        assert payload["ok"] is True
        assert payload["errors"] == []


async def test_prompt_template_renders(server: object) -> None:
    async with Client(server) as client:
        prompts = await client.list_prompts()
        names = {p.name for p in prompts}
        assert "sigma_review" in names


def _payload(result: object) -> dict[str, object]:
    structured = getattr(result, "structured_content", None)
    if structured:
        return structured
    data = getattr(result, "data", None)
    if data:
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
