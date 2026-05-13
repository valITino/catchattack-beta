# mcp/mocks/

Per BUILD_BRIEF_ADDENDUM.md §B.2 — for every official vendor MCP we plan to
integrate (Falcon, Sentinel, Splunk-in-Splunk, Chronicle/SecOps, S1, Elastic,
GitHub, Caldera, ATT&CK), we ship a mock upstream that serves the same MCP
tool surface with realistic synthetic data.

The CatchAttack proxy routes to the mock until the operator flips
`upstreams.<vendor>.mode` from `mock` to `real` in `upstreams.yaml`. Nothing
else changes — the Conductor, the web UI, and the workflows are unaware.

Each mock lives at `mcp/mocks/<vendor>/` with:

- `pyproject.toml`
- Pydantic models derived from the vendor's published REST schema
  (REST URL commented above each model where applicable).
- A FastAPI/FastMCP process serving the tool surface.
- `data/` — seed JSON mirroring real cardinality.

| Vendor | Status | Phase |
|---|---|---|
| `splunk/` | implemented (4 tools, ~50 detections / 12 hosts) | 2 |
| `falcon/` | pending | 7+ |
| `sentinel/` | pending | 7+ |
| `chronicle/` | pending | 7+ |
| `sentinelone/` | pending | 7+ |
| `elastic/` | pending | 7+ |
