# mcp/mocks/

Per BUILD_BRIEF_ADDENDUM.md §B.2 — for each commercial vendor MCP we plan to
integrate, we ship a mock upstream that serves the same MCP tool surface with
realistic synthetic data, so the platform is fully demoable without
commercial credentials.

The CatchAttack proxy routes to the mock until the operator flips
`upstreams.<vendor>.mode` from `mock` to `real` in `upstreams.yaml`. Nothing
else changes — the Conductor, the web UI, and the workflows are unaware.

Each mock lives at `mcp/mocks/<vendor>/` with:

- `pyproject.toml` and a `<vendor>_mock` package.
- Pydantic models (`extra="forbid"`) shaped after the vendor's published
  API / MCP surface.
- A FastMCP process serving the tool surface. Synthetic data is generated
  deterministically in-process from a seed — there is no on-disk fixture.

GitHub and MITRE ATT&CK are integrated directly via their official MCP
servers, so they are not mocked here.

| Vendor | Status | Phase | HTTP port |
|---|---|---|---|
| `splunk/` | implemented — 4 tools, ~50 detections / 12 hosts | 2 | 9101 |
| `falcon/` | implemented — 4 tools, detections/hosts/intel + IOA | 7 | 9111 |
| `sentinel/` | implemented — incidents, KQL hunt, analytics rules | 7 | 9106 |
| `chronicle/` | implemented — UDM search, detections, YARA-L | 7 | 9107 |
| `sentinelone/` | implemented — PowerQuery, alerts, threats (read-only) | 7 | 9108 |
| `elastic/` | implemented — ES\|QL, Detection Engine rules | 7 | 9109 |
| `caldera/` | implemented — abilities, operations, run-ability | 7 | 9110 |

Mocks default to stdio; the HTTP port above applies only when a mock is run
with `--transport http`.
