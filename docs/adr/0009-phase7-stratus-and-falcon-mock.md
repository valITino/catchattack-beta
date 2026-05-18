# ADR-0009: Phase 7 — Stratus Red Team MCP + Falcon mock

- **Status:** Accepted (Phase 7)
- **Date:** 2026-05-13

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

### 3. `mcp/mocks/falcon` — second instance of the mock pattern

Following ADR-0004's mock-or-real strategy (first used for Splunk in
Phase 2), Falcon gets an in-tree mock conforming to the official
`falcon-mcp`'s detections/hosts/intel module surface. `FalconStore`
seeds 12 hosts + 50 detections + 3 intel indicators with field shapes
drawn from the Falcon REST API (commented per model). `push_ioa_rule`
renders the real Custom-IOA rule-group payload shape.

Flip to real: change `upstreams.falcon.real_cmd` to launch the official
`falcon-mcp --modules detections,hosts,intel`. The Conductor and UI are
unaware.

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
- Falcon is demoable without CrowdStrike credentials; the closed-loop
  workflow could target Falcon detections as a future SIEM-equivalent.
- The proxy registry now covers sigma, evidence, agents, splunk, wazuh,
  stratus, and falcon — seven upstreams, all routable.

Negative:
- The remaining Phase 7+ vendors (Sentinel, Defender, Chronicle, S1,
  Elastic, Caldera, MISP) are not yet wired. Each is ~1 day of mock +
  registry work following the Falcon template; they are deliberately
  deferred so each lands as its own reviewable increment.
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
