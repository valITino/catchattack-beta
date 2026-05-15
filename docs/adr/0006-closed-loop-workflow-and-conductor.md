# ADR-0006: Conductor workflow runtime + closed-loop rule synthesis

- **Status:** Accepted (Phase 4)
- **Date:** 2026-05-13

## Context

Phase 4 of `BUILD_BRIEF.md` is the platform's flagship workflow: an
autonomous loop that runs an Atomic Red Team test, summarises the resulting
telemetry, drafts a Sigma rule, gates it through lint/dedupe/convert/FP/
deploy/validation, and opens a PR. The brief specifies 11 named steps and
demands that each gate failure produce a named exit code.

This phase also has to decide:

1. How workflows expose progress (the brief says SSE).
2. How the Conductor talks to the LLM (Anthropic SDK with caching, per §3.3).
3. How PR creation works given the GitHub MCP may or may not be connected.
4. How tests run without an Anthropic API key, real agents, or real
   Splunk/Wazuh.

## Decisions

### 1. Each workflow is a coroutine with a `WorkflowDeps` bag

Workflows live in `conductor/workflows/` and are registered via
`@register("name")`. Each takes `(Run, inputs, WorkflowDeps)`. `WorkflowDeps`
holds the MCP client, LLM client, PR opener, and tunable thresholds
(`fp_threshold_per_day=5`, `dedupe_threshold=0.85`, `dedupe_corpus_path`).

Rationale: workflows stay small and linear. No state machine; no DAG
runtime. The 11 brief-named steps map 1:1 to source lines.

### 2. Named gate failures via `GateFailedError(code, message, detail)`

Every blocking check raises `GateFailedError` with a stable, brief-aligned
code. The runner catches it and writes it to `run.error`. The web UI in
Phase 5 maps codes to remediation hints.

Codes shipped in Phase 4:
- `preflight.unknown_agent`
- `emulation.run_failed`
- `evidence.summary_failed`, `evidence.empty`
- `lint.failed`, `lint.errors`
- `dedupe.failed`, `dedupe.near_duplicate`
- `convert.failed`, `convert.empty`
- `fp.failed`, `fp.too_high`
- `deploy.failed`
- `validation.run_failed`, `validation.search_failed`, `validation.no_hits`

### 3. Two `StepEvent`s per tool call

Each `_call` helper emits one event before the MCP call (with `verb` =
present-continuous description) and one after (`verb=ok` or `verb=errored`).
SSE consumers render this as a live progress log without the workflow
having to do anything bespoke.

### 4. Pluggable LLM client; production uses prompt caching

`AnthropicLLM.draft_sigma_rule` sends the system prompt with
`cache_control: ephemeral` so repeated runs in the same hour don't re-bill.
`StaticLLM(rule_yaml=…)` returns a canned PSH-encoded rule for tests; the
default rule passes the workflow's lint/dedupe/convert/FP gates against the
in-tree sigma + splunk-mock servers.

### 5. Pluggable PR opener; local-branch fallback

`LocalBranchPROpener` writes the rule + `report.md` + `spl.txt` +
`fp_report.md` + `reasoning.md` to `detections/_meta/conductor_runs/<id>/`
and commits to a `conductor/<slug>-<short-cap-id>` branch. Works without
GitHub.

`GitHubMCPPROpener` wraps the local opener: it always commits the branch
locally, then calls `github.create_pull_request` via the MCP proxy. If the
MCP call fails, the local result is still valid — the reviewer can open
the PR by hand.

Rationale: the workflow is operable in offline / partner-network settings
without a GitHub token. CI tests use only the local path.

### 6. Test transport: in-memory FastMCP composition

`test_workflow_integration.py` builds a `FastMCP` router with the in-tree
sigma, splunk-mock, agents, and evidence servers mounted under their
production namespaces. The Conductor's `FastMCPClient` runs against that
router. No network, no subprocesses, no mocks at the MCP boundary.

The `agents.run_atomic` call is hooked so each receipt's `capture_id` is
materialised as a real `CaptureBundle` in the filesystem-backed evidence
store. This means `evidence.summarize_capture` returns real data and
`splunk.search` over the second capture's time window exercises the
splunk-mock's synthetic event store.

### 7. In-memory run registry; SSE via `sse-starlette`

`RunRegistry` is a single-process dict + deque. Each `Run` has an
`asyncio.Queue` of `StepEvent | None` for SSE subscribers. The sentinel
`None` signals `close()` and ends the stream.

Phase 5 swaps the registry for a Postgres-backed store; the
`/workflows/runs/{id}/sse` contract doesn't change.

## Consequences

Positive:
- The brief's flagship workflow is demoable in tests without any external
  services. CI passes deterministically.
- Named gate failures + SSE give the eventual web UI everything it needs
  to render a "stopped at step N because X" trace.
- LLM costs are bounded: prompt caching on the system prompt; canned rule
  in tests; future caps would be a thin wrapper on `AnthropicLLM`.
- The PR opener gracefully degrades to local-branch when GitHub MCP is
  unavailable — operators in partner networks aren't blocked.

Negative:
- The 11-step coroutine is long (~150 lines of orchestration). Acceptable
  for brief alignment, but if we add a 12th step we should consider
  splitting into stages. PLR0915 is `# noqa`ed with explicit rationale.
- The in-process integration test depends on the `agents_mcp`,
  `splunk_mock`, `sigma_mcp`, and `evidence_mcp` workspace packages.
  This is a hard coupling — when one of those servers changes its tool
  surface, the conductor integration test is the canary.
- The current PR opener does not push to a remote. Operators triggering
  a real loop with the local opener get a branch they can push manually.
  GitHub MCP path handles push via the upstream MCP server.

## Rejected alternatives

- *DAG / state-machine workflow engine (Temporal, Prefect, arq).* Adds a
  process, a DB, and an SDK. The 11-step linear shape doesn't need them.
- *Stream chunked tool calls to the LLM.* Tempting for cost, but the
  workflow's gates are tighter when each tool call is an explicit
  operator-visible step.
- *Inline GitHub HTTP calls bypassing the GitHub MCP.* Would mean owning
  retry/auth/pagination/rate-limit ourselves — already shipped by the
  official `@modelcontextprotocol/server-github`. We keep the boundary.
