# ADR-0009: Phase 7 — Stratus Red Team MCP + vendor mock fleet

- **Status:** Accepted (Phase 7)
- **Date:** 2026-05-13

> **Update (same phase):** the first increment shipped `mcp/stratus` +
> `mcp/mocks/falcon`. This ADR was then extended to cover the rest of the
> vendor mock fleet — `sentinel`, `chronicle`, `sentinelone`, `elastic`,
> `caldera` — all built to the same template (§3 below).

## Context

`BUILD_BRIEF.md` Phase 7+ lists ten additional MCP servers,
"parallelizable, ≈ 1–2 days each", in a priority order. The addendum
substantially rewrites this: most of those vendors (Falcon, Sentinel,
Defender, Chronicle, S1, Elastic, Caldera, MITRE ATT&CK, MISP) have
**official MCP servers we integrate, not rebuild** (§A.1). The only
genuine build-it-ourselves item left for Phase 7 is `mcp/stratus`
(§A.2 — "No MCP exists for Stratus Red Team").

This ADR covers the first Phase 7 increment: the in-house Stratus MCP
plus the next-priority vendor mock (Falcon, brief priority #2).

## Decisions

### 1. `mcp/stratus` — in-house, pluggable runner

Stratus Red Team is DataDog's cloud attack-emulation CLI. The MCP wraps
it with five tools (`list_techniques`, `get_status`, `detonate`,
`revert`, `cleanup`). The execution layer is a `StratusRunner` Protocol
with two implementations:

- `InMemoryStratusRunner` — deterministic, seeded with a representative
  catalogue slice, tracks per-technique `COLD/WARM/DETONATED` state. CI
  default.
- `CLIStratusRunner` — shells out to the `stratus` binary. The command
  mapping is shipped; output parsing is a documented integration point
  (needs real cloud credentials).

This mirrors the Phase 3 `mcp/agents` pattern (in-memory transport for
CI, real transport for production) so the codebase stays consistent.

### 2. `detonate`/`revert`/`cleanup` are destructive

They mutate live cloud infrastructure, so they default `dry_run=true`
and are registered in the proxy's `destructive_tools`. The lifecycle is
explicit: `detonate` warms `COLD` techniques automatically; `revert`
returns to `WARM` (re-detonatable); `cleanup` destroys infra back to
`COLD`. No per-technique target allowlist yet — cloud-account scoping is
a Phase 8 concern when real credentials land.

### 3. The vendor mock fleet — one template, six vendors

Following ADR-0004's mock-or-real strategy (first used for Splunk in
Phase 2), every §A.1 vendor with an official MCP gets an in-tree mock
conforming to that server's tool surface. Phase 7 completes the fleet:

| Mock | Conforms to | Tools | Notable |
|---|---|---|---|
| `falcon` | CrowdStrike `falcon-mcp` (detections/hosts/intel) | search_detections, search_hosts, search_intel, push_ioa_rule | 12 hosts / 50 detections; IOA rule-group payload |
| `sentinel` | Microsoft-hosted Sentinel MCP (triage) | list_incidents, run_kql_hunt, list_analytics_rules, deploy_analytics_rule | renders the scheduled-rule ARM template |
| `chronicle` | `google-secops-mcp` | udm_search, list_detections, list_rules, deploy_yaral_rule | YARA-L 2.0 rule create |
| `sentinelone` | `purple-mcp` | powerquery, list_alerts, list_threats, get_inventory | **read-only** — matches the real server (no deploy tools) |
| `elastic` | Elastic Agent Builder MCP (Kibana 9.2+) | esql_query, list_detection_rules, deploy_detection_rule | Detection Engine rule payload |
| `caldera` | `mitre/mcp` Caldera plugin | list_abilities, list_operations, create_operation, run_ability | emulation source, like agents/stratus |

Each is deterministic per seed, exposes strict `additionalProperties:
false` schemas, and renders the real vendor's deploy payload shape.
Every deploy/emulation tool defaults `dry_run=true` and is registered in
the proxy's `destructive_tools`. Flip-to-real is a one-line
`upstreams.<vendor>.real_cmd`/`real_url` change.

`sentinelone` deliberately exposes **no** destructive tools — the real
`purple-mcp` is read-only, and the mock matches it (a test asserts no
tool name contains `deploy`/`push`/`isolate`).

`search_*` tool determinism: query-driven tools (`run_kql_hunt`,
`udm_search`, `powerquery`, `esql_query`) seed a local RNG from the query
string so the same query always returns the same synthetic row count —
this lets the closed-loop workflow's validation step be reproducible.

### 4. The MITRE ATT&CK MCP is integrate-not-build

The brief's Phase 7 item #9 says "build `mcp/mitre`". The addendum §A.1
supersedes: use `imouiche/complete-mitre-attack-mcp-server`. We do not
build a MITRE MCP. The web UI's `/coverage` already ships a seeded
14-tactic table (ADR-0007); when the `imouiche` server is registered as
a proxy upstream, `loadCoverage()` switches to calling it. No code in
this phase.

## Consequences

Positive:
- The genuine Phase 7 build item (`mcp/stratus`) is delivered and
  testable offline.
- The full vendor fleet is demoable without any commercial credentials.
  The proxy registry now covers twelve upstreams — sigma, evidence,
  agents, splunk, wazuh, stratus, falcon, sentinel, chronicle,
  sentinelone, elastic, caldera — all routable, all flip-to-real with a
  one-line config change.
- The closed-loop workflow can now target any of the SIEM/EDR backends
  by namespace; the deploy step is no longer Splunk-specific.

Negative:
- The MISP / CTI integration (brief Phase 7 item #10) is not built —
  the addendum routes it to `jmstar85/SecurityInfrastructure` and an
  internal IOC store, which is a larger design question deferred to a
  later phase.
- The vendor mocks' query engines are intentionally shallow (seeded RNG
  keyed on the query string, not real query parsing). LLMs that overfit
  to a mock's row counts will be surprised by the real backend; the
  mock READMEs and ADR-0004 flag this.
- `CLIStratusRunner` output parsing is unimplemented — running real
  cloud detonations needs credentials this environment doesn't have.
  The in-memory runner covers the MCP contract.
- No cloud-account allowlist on `stratus.detonate` yet. Acceptable while
  the only runner is in-memory; must land before the CLI runner is used
  against a real account.

## Rejected alternatives

- *Build all ten Phase 7 MCPs at once.* The brief itself says
  "parallelizable, 1–2 days each" — batching them into one change would
  produce an unreviewable diff. One coherent increment per turn.
- *Build a `mcp/mitre` server.* Directly contradicts addendum §A.1.
- *Skip the Falcon mock and wait for credentials.* Breaks the
  addendum's §B.2 no-credentials-development guarantee.
- *Make Stratus an agent capability instead of its own MCP.* The brief's
  target tree (§3.2) lists `mcp/stratus/` explicitly, and cloud TTPs
  have no endpoint agent — they target cloud control planes.
