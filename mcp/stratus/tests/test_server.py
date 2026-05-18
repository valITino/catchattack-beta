"""End-to-end MCP tests via the fastmcp in-memory client."""

from __future__ import annotations

import json

from fastmcp import Client


async def test_lists_all_five_tools(server: object) -> None:
    async with Client(server) as c:
        names = {t.name for t in await c.list_tools()}
        assert names == {
            "list_techniques",
            "get_status",
            "detonate",
            "revert",
            "cleanup",
        }


async def test_list_techniques_via_mcp(server: object) -> None:
    async with Client(server) as c:
        result = await c.call_tool("list_techniques", {"platform": "aws"})
        payload = _payload(result)
        assert payload["total"] >= 1
        assert all(t["platform"] == "aws" for t in payload["items"])


async def test_get_status_unknown_returns_error(server: object) -> None:
    async with Client(server) as c:
        result = await c.call_tool("get_status", {"technique_id": "aws.bogus"})
        payload = _payload(result)
        assert payload["error"] == "unknown_technique"


async def test_detonate_dry_run_does_not_change_state(server: object) -> None:
    async with Client(server) as c:
        result = await c.call_tool(
            "detonate",
            {"technique_id": "aws.execution.ec2-user-data", "dry_run": True},
        )
        payload = _payload(result)
        assert payload["dry_run"] is True
        assert payload["detonated"] is False
        assert payload["state"] == "COLD"

        status = _payload(
            await c.call_tool("get_status", {"technique_id": "aws.execution.ec2-user-data"})
        )
        assert status["state"] == "COLD"


async def test_detonate_real_then_revert_then_cleanup(server: object) -> None:
    tid = "azure.execution.vm-run-command"
    async with Client(server) as c:
        det = _payload(await c.call_tool("detonate", {"technique_id": tid, "dry_run": False}))
        assert det["detonated"] is True
        assert det["state"] == "DETONATED"

        rev = _payload(await c.call_tool("revert", {"technique_id": tid, "dry_run": False}))
        assert rev["reverted"] is True
        assert rev["state"] == "WARM"

        clean = _payload(await c.call_tool("cleanup", {"technique_id": tid, "dry_run": False}))
        assert clean["state"] == "COLD"


async def test_revert_dry_run_previews_only(server: object) -> None:
    async with Client(server) as c:
        result = await c.call_tool(
            "revert",
            {"technique_id": "gcp.persistence.create-admin-service-account"},
        )
        payload = _payload(result)
        assert payload["reverted"] is False
        assert "[dry-run]" in payload["output"]


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
