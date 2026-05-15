# mcp/evidence

In-house MCP server for capture-bundle access. Implements BUILD_BRIEF_ADDENDUM.md
§E.2 exactly.

## Tools

| Tool | Purpose |
|---|---|
| `get_capture(capture_id)` | Full CaptureBundle manifest. |
| `list_captures(filters, paging)` | Metadata-only listing. |
| `summarize_capture(capture_id)` | Aggregated telemetry (Conductor's primary entry). |
| `query_events(capture_id, filter, limit)` | Filtered JSONL drill-down, capped at 500. |
| `get_artifact_url(capture_id, artifact, ttl_seconds)` | Pre-signed (S3) or file:// URL. |
| `add_marker(capture_id, marker, dry_run=true)` | Append a marker; proxy enforces dry-run. |
| `count_detection_hits(capture_id, rule_id?)` | Hit count for closed-loop validation. |

## Storage

Phase 3: `FilesystemStorage` rooted at `$EVIDENCE_MCP_ROOT` (default `./evidence`).
Layout mirrors addendum §E.4:

```
<root>/tenants/<tenant_id>/captures/<yyyy>/<mm>/<capture_id>/
    manifest.json
    markers.json
    summary.json
    events/{sysmon,auditd,esf}.jsonl
    video/index.m3u8 + segment_*.ts
    pcap/capture.pcap
    process_tree.json
    atomic_output.txt
```

Phase 5: swap `FilesystemStorage` for an `S3Storage` backed by MinIO/S3.
`get_artifact_url` returns a presigned URL in S3 mode. The MCP surface is
unchanged.

## Run

```bash
# stdio
uv run evidence-mcp

# streamable-HTTP (proxy mode)
uv run evidence-mcp --transport http --port 9104

# Custom root
EVIDENCE_MCP_ROOT=/var/lib/catchattack/evidence uv run evidence-mcp
```

## Schema

The CaptureBundle JSON Schema lives at
`packages/schemas/capture_bundle.schema.json`. Pydantic models in `models.py`
mirror it. A future build step will keep them in lock-step via
`datamodel-code-generator`.
