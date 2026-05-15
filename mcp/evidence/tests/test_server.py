"""End-to-end MCP tests via fastmcp's in-memory client."""

from __future__ import annotations

import json

from fastmcp import Client


async def test_lists_all_seven_tools(server: object) -> None:
    async with Client(server) as c:
        names = {t.name for t in await c.list_tools()}
        assert names == {
            "get_capture",
            "list_captures",
            "summarize_capture",
            "query_events",
            "get_artifact_url",
            "add_marker",
            "count_detection_hits",
        }


async def test_get_capture_returns_manifest(server: object, sample_bundle: object) -> None:
    async with Client(server) as c:
        result = await c.call_tool("get_capture", {"capture_id": sample_bundle.id})  # type: ignore[attr-defined]
        payload = _payload(result)
        assert payload["id"] == sample_bundle.id  # type: ignore[attr-defined]


async def test_get_capture_unknown_returns_error(server: object) -> None:
    async with Client(server) as c:
        result = await c.call_tool(
            "get_capture",
            {"capture_id": "00000000-0000-0000-0000-aaaaaaaaaaaa"},
        )
        payload = _payload(result)
        assert payload["error"] == "capture_not_found"


async def test_summarize_capture_via_mcp(server: object, sample_bundle: object) -> None:
    async with Client(server) as c:
        result = await c.call_tool(
            "summarize_capture",
            {"capture_id": sample_bundle.id},  # type: ignore[attr-defined]
        )
        payload = _payload(result)
        assert payload["technique"] == "T1059.001"
        assert payload["top_processes"][0]["name"] == "powershell.exe"


async def test_query_events_filters_by_process(server: object, sample_bundle: object) -> None:
    async with Client(server) as c:
        result = await c.call_tool(
            "query_events",
            {
                "capture_id": sample_bundle.id,  # type: ignore[attr-defined]
                "filter": {"process_name": "powershell.exe"},
                "limit": 10,
            },
        )
        payload = _payload(result)
        assert all(e["process_name"] == "powershell.exe" for e in payload["events"])
        assert len(payload["events"]) == 2


async def test_query_events_filters_by_cmd_contains(server: object, sample_bundle: object) -> None:
    async with Client(server) as c:
        result = await c.call_tool(
            "query_events",
            {
                "capture_id": sample_bundle.id,  # type: ignore[attr-defined]
                "filter": {"cmd_contains": "whoami"},
                "limit": 5,
            },
        )
        payload = _payload(result)
        assert len(payload["events"]) == 1
        assert payload["events"][0]["process_name"] == "cmd.exe"


async def test_query_events_caps_at_500(server: object, sample_bundle: object) -> None:
    async with Client(server) as c:
        result = await c.call_tool(
            "query_events",
            {"capture_id": sample_bundle.id, "filter": {}, "limit": 9999},  # type: ignore[attr-defined]
        )
        payload = _payload(result)
        # Only 3 events seeded; truncated should be False.
        assert payload["truncated"] is False


async def test_get_artifact_url_via_mcp(server: object, sample_bundle: object) -> None:
    async with Client(server) as c:
        result = await c.call_tool(
            "get_artifact_url",
            {"capture_id": sample_bundle.id, "artifact": "sysmon_events"},  # type: ignore[attr-defined]
        )
        payload = _payload(result)
        assert payload["url"].startswith("file://")


async def test_count_detection_hits_aggregates_by_rule(
    server: object, sample_bundle: object
) -> None:
    async with Client(server) as c:
        result = await c.call_tool(
            "count_detection_hits",
            {"capture_id": sample_bundle.id},  # type: ignore[attr-defined]
        )
        payload = _payload(result)
        assert payload["total"] == 1
        assert payload["by_rule"]["rule-100100"] == 1


async def test_add_marker_dry_run_does_not_persist(
    server: object, sample_bundle: object, populated_storage: object
) -> None:
    async with Client(server) as c:
        result = await c.call_tool(
            "add_marker",
            {
                "capture_id": sample_bundle.id,  # type: ignore[attr-defined]
                "marker": {"t_ms": 20_000, "kind": "operator_note", "label": "test note"},
                "dry_run": True,
            },
        )
        payload = _payload(result)
        assert payload["label"] == "test note"

    # Verify nothing was persisted.
    bundle = populated_storage.get_bundle(sample_bundle.id)  # type: ignore[attr-defined]
    assert all(m.label != "test note" for m in bundle.markers)


async def test_add_marker_real_persists(
    server: object, sample_bundle: object, populated_storage: object
) -> None:
    async with Client(server) as c:
        result = await c.call_tool(
            "add_marker",
            {
                "capture_id": sample_bundle.id,  # type: ignore[attr-defined]
                "marker": {"t_ms": 25_000, "kind": "operator_note", "label": "kept"},
                "dry_run": False,
            },
        )
        payload = _payload(result)
        assert payload["label"] == "kept"
    bundle = populated_storage.get_bundle(sample_bundle.id)  # type: ignore[attr-defined]
    assert any(m.label == "kept" for m in bundle.markers)


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
