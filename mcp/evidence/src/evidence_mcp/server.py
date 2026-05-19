"""FastMCP server for capture-bundle access (addendum §E.2).

Tools:
- get_capture(capture_id)
- list_captures(filters, paging)
- summarize_capture(capture_id)
- query_events(capture_id, filter, limit)
- get_artifact_url(capture_id, artifact, ttl_seconds)
- add_marker(capture_id, marker, dry_run=true)
- count_detection_hits(capture_id, rule_id?)

The MCP proxy enforces dry-run for add_marker. summarize_capture, query_events,
and get_artifact_url are read-only.
"""

from __future__ import annotations

import argparse
import json
import os
from datetime import datetime
from pathlib import Path
from typing import Any

from fastmcp import FastMCP

from . import __version__
from .models import (
    ArtifactKind,
    Event,
    EventQueryResult,
    HitCount,
    Marker,
)
from .storage import CaptureNotFoundError, FilesystemStorage

DEFAULT_ROOT_ENV = "EVIDENCE_MCP_ROOT"
DEFAULT_ROOT = "./evidence"

_QUERY_HARD_CAP = 500


def build_server(storage: FilesystemStorage) -> FastMCP:
    mcp: FastMCP = FastMCP(
        name="catchattack-evidence",
        instructions=(
            "Capture-bundle access. summarize_capture is the Conductor's primary "
            "drill-down; query_events is for targeted filtering. Never returns "
            "raw bytes — artifacts are fetched via get_artifact_url."
        ),
    )

    @mcp.tool(
        name="get_capture",
        description="Return the full CaptureBundle manifest by id.",
    )
    def get_capture_tool(capture_id: str) -> dict[str, Any]:
        try:
            return storage.get_bundle(capture_id).model_dump(mode="json")
        except CaptureNotFoundError as exc:
            return {"error": "capture_not_found", "detail": str(exc)}

    @mcp.tool(
        name="list_captures",
        description=(
            "Filter captures by agent_id, technique, trigger_kind, and time range. "
            "Returns metadata only (no artifact bodies)."
        ),
    )
    def list_captures_tool(
        agent_id: str | None = None,
        technique: str | None = None,
        trigger_kind: str | None = None,
        started_after: str | None = None,
        started_before: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> dict[str, Any]:
        return storage.list_bundles(
            agent_id=agent_id,
            technique=technique,
            trigger_kind=trigger_kind,
            started_after=_parse_dt(started_after),
            started_before=_parse_dt(started_before),
            limit=limit,
            offset=offset,
        ).model_dump(mode="json")

    @mcp.tool(
        name="summarize_capture",
        description=(
            "Return aggregated telemetry for the capture (top processes, "
            "duration, suspicious score). PRIMARY Conductor entry point — "
            "returns model-digestible JSON, never the raw firehose."
        ),
    )
    def summarize_capture_tool(capture_id: str) -> dict[str, Any]:
        try:
            return storage.get_summary(capture_id).model_dump(mode="json")
        except CaptureNotFoundError as exc:
            return {"error": "capture_not_found", "detail": str(exc)}

    @mcp.tool(
        name="query_events",
        description=(
            "Filter events from the capture's JSONL stream. Hard-capped at "
            "500 rows server-side; set limit lower for cheaper calls."
        ),
    )
    def query_events_tool(
        capture_id: str,
        filter: dict[str, Any] | None = None,
        limit: int = 100,
    ) -> dict[str, Any]:
        try:
            events_dir = storage.events_dir(capture_id)
        except CaptureNotFoundError as exc:
            return {"error": "capture_not_found", "detail": str(exc)}
        return _query(events_dir, filter or {}, min(limit, _QUERY_HARD_CAP)).model_dump(mode="json")

    @mcp.tool(
        name="get_artifact_url",
        description=(
            "Return a time-limited URL to an artifact (HLS manifest, JSONL "
            "stream, PCAP, …). file:// in Phase 3, presigned S3 in Phase 5."
        ),
    )
    def get_artifact_url_tool(
        capture_id: str,
        artifact: ArtifactKind,
        ttl_seconds: int = 900,
    ) -> dict[str, Any]:
        try:
            return storage.get_artifact_url(capture_id, artifact, ttl_seconds).model_dump(
                mode="json"
            )
        except CaptureNotFoundError as exc:
            return {"error": "capture_not_found", "detail": str(exc)}

    @mcp.tool(
        name="add_marker",
        description=(
            "Append a marker to the capture. dry_run=true returns the marker "
            "as it would be persisted without writing."
        ),
    )
    def add_marker_tool(
        capture_id: str,
        marker: Marker,
        dry_run: bool = True,
    ) -> dict[str, Any]:
        if dry_run:
            return marker.model_dump(mode="json")
        try:
            bundle = storage.get_bundle(capture_id)
        except CaptureNotFoundError as exc:
            return {"error": "capture_not_found", "detail": str(exc)}
        bundle.markers.append(marker)
        storage.put_bundle(bundle)
        return marker.model_dump(mode="json")

    @mcp.tool(
        name="count_detection_hits",
        description=(
            "Count detection-hit markers in the capture, optionally filtered to a single rule_id."
        ),
    )
    def count_detection_hits_tool(
        capture_id: str,
        rule_id: str | None = None,
    ) -> dict[str, Any]:
        try:
            markers = storage.get_markers(capture_id)
        except CaptureNotFoundError as exc:
            return {"error": "capture_not_found", "detail": str(exc)}
        by_rule: dict[str, int] = {}
        total = 0
        for m in markers:
            if m.kind.value != "detection_hit":
                continue
            rid = m.ref or ""
            if rule_id and rid != rule_id:
                continue
            total += 1
            if rid:
                by_rule[rid] = by_rule.get(rid, 0) + 1
        return HitCount(total=total, by_rule=by_rule).model_dump(mode="json")

    return mcp


def _parse_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def _query(events_dir: Path, filt: dict[str, Any], limit: int) -> EventQueryResult:
    """Filter events from the JSONL stream — used by `query_events`.

    Accepts the addendum's filter keys: process_name, parent_name,
    cmd_contains, event_id, t_ms_start, t_ms_end.
    """
    process_name = filt.get("process_name")
    parent_name = filt.get("parent_name")
    cmd_contains = filt.get("cmd_contains")
    event_id = filt.get("event_id")
    t_ms_start = filt.get("t_ms_start")
    t_ms_end = filt.get("t_ms_end")

    # Open the sysmon stream, falling back to auditd. Operate-and-handle
    # rather than exists()-then-open (avoids a TOCTOU stat race).
    fh = None
    for name in ("sysmon.jsonl", "auditd.jsonl"):
        try:
            fh = (events_dir / name).open(encoding="utf-8")
            break
        except FileNotFoundError:
            continue
    if fh is None:
        return EventQueryResult(events=[], truncated=False)

    out: list[Event] = []
    truncated = False
    with fh:
        for line in fh:
            try:
                obj = json.loads(line)
            except json.JSONDecodeError:
                continue
            t_ms = int(obj.get("t_ms", 0))
            if t_ms_start is not None and t_ms < int(t_ms_start):
                continue
            if t_ms_end is not None and t_ms > int(t_ms_end):
                continue
            if event_id is not None and obj.get("event_id") != int(event_id):
                continue
            if process_name and obj.get("process_name") != process_name:
                continue
            if parent_name and obj.get("parent_name") != parent_name:
                continue
            cmd = obj.get("cmd")
            if cmd_contains and (not isinstance(cmd, str) or cmd_contains not in cmd):
                continue
            out.append(Event.model_validate(obj))
            if len(out) >= limit:
                truncated = True
                break
    return EventQueryResult(events=out, truncated=truncated)


def main() -> None:
    parser = argparse.ArgumentParser(prog="evidence-mcp")
    parser.add_argument("--transport", choices=("stdio", "http"), default="stdio")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=9104)
    parser.add_argument(
        "--root",
        default=os.environ.get(DEFAULT_ROOT_ENV, DEFAULT_ROOT),
        help=f"Storage root. Default: ${DEFAULT_ROOT_ENV} or {DEFAULT_ROOT}.",
    )
    parser.add_argument("--version", action="version", version=__version__)
    args = parser.parse_args()

    storage = FilesystemStorage(args.root)
    server = build_server(storage)
    if args.transport == "stdio":
        server.run(transport="stdio")
    else:
        server.run(transport="http", host=args.host, port=args.port)


if __name__ == "__main__":
    main()
