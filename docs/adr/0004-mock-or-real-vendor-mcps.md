# ADR-0004: Mock-or-real switching for vendor MCP upstreams

- **Status:** Accepted (Phase 2)
- **Date:** 2026-05-13

## Context

`BUILD_BRIEF_ADDENDUM.md` §A.1 lists official vendor MCPs we plan to
integrate (Splunk-in-Splunk, Falcon, Sentinel, Chronicle/SecOps, S1,
Elastic, GitHub, Caldera, ATT&CK). Acquiring credentials for each before
shipping Phase 4's closed loop is impractical and unnecessary — the
addendum §B.2 prescribes building a mock upstream per vendor that conforms
to the same MCP tool surface, with synthetic data of realistic cardinality.

Phase 2 needs the first concrete instance of this pattern.

## Decision

For each official vendor MCP, ship two interchangeable upstreams:

1. **Mock**: a FastMCP server under `mcp/mocks/<vendor>/` that:
   - Exposes the **same tool surface** the official server would.
   - Uses pydantic models whose field shapes mirror the vendor's REST API.
   - Returns realistic synthetic responses backed by a deterministic
     in-memory store (`store.py` with a fixed seed).
   - Documents each REST endpoint via a comment above the model that
     describes it (`/services/search/jobs`, `/security/user/authenticate`,
     etc.).

2. **Real**: the official upstream (vendor MCP or our in-house wrapper),
   selected via `upstreams.<vendor>.mode = real` and addressed by
   `real_url` (HTTP) or `real_cmd` (stdio subprocess).

The proxy reads `upstreams.<vendor>.mode` at startup. Flipping mock→real is
a config change; Conductor, web UI, workflows are unaware.

### Phase 2 concrete

- **Splunk.** Build `mcp/mocks/splunk/` with the four-tool surface
  (`search`, `list_saved_searches`, `deploy_rule`, `estimate_fp_rate`).
  Synthetic data: 12 hosts, ~3.5k events/week, 50 seeded saved searches.
  When operator acquires Splunk Free, flip `upstreams.splunk.mode = http`
  pointing at Splunkbase App 7931's endpoint (`/services/mcp` on mgmt port
  8089).
- **Wazuh.** Build `mcp/wazuh/` as an in-house MCP (no upstream exists),
  using `httpx.MockTransport` in tests. Real container provided by
  `infra/compose.yaml`. Same four-tool surface as Splunk so the Conductor
  workflow is target-agnostic where possible.

## Consequences

Positive:
- Phases 1–5 are demoable with zero commercial license cost.
- Each vendor's mock doubles as integration-test scaffolding for the
  Conductor workflows.
- The tool surface is committed *before* the real integration lands, so
  contract drift is caught early.

Negative:
- The mock's SPL/KQL/EQL parsers are intentionally minimal (substring
  match). LLMs that overfit to the mock's quirks will be embarrassed by
  real Splunk's parser. Documented in each mock's README; mitigated by
  realistic synthetic data so the LLM does not learn "every query
  returns 0".
- Maintaining mocks adds work whenever a vendor's REST surface drifts.
  Mitigation: pin the mock's pydantic models to a documented REST API
  version and update on schema bumps.

## Rejected alternatives

- *Skip mocks, defer until real credentials acquired.* Blocks Phases 2–5
  demoability and forces a single integration sprint per vendor.
- *Record-and-replay real vendor responses (VCR-style).* Tempting but
  every vendor's auth layer differs; recording an authoritative cassette
  per vendor is more work than a small mock.
- *One generic "fake SIEM" mock parameterised by vendor name.* Drops the
  per-vendor field shapes that we want to catch at compile time;
  cross-vendor differences (Splunk's saved-search conf vs Wazuh's rules
  XML vs Sentinel's ARM template) are real and meaningful.
