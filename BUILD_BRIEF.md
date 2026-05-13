# CatchAttack v2 — Build Brief for Claude Code

> Drop this file at the repo root as `BUILD_BRIEF.md` and point Claude Code at it.
> Tell Claude Code: *"Read BUILD_BRIEF.md and execute Phase 0. Do not proceed past a phase without my explicit greenlight."*

---

## 0. How to work this brief

You are a senior full-stack security-tooling engineer working in the existing `valITino/catchattack-beta` repository. You will execute this brief in **numbered phases**. After each phase:

1. Run `make verify` (the phase will define what this means).
2. Post a short status summary: what changed, what works, what doesn't, what you decided.
3. **Wait for my explicit "go" before starting the next phase.** Do not chain phases unprompted.

If at any point you would deviate from this brief — adding a dependency, picking a different transport, splitting a service, etc. — **stop and ask first**. Surprise architecture is the failure mode I most want to avoid.

If a requirement is ambiguous, ask one focused clarifying question rather than guessing.

---

## 1. Mission

Replace the current over-engineered Kafka/Avro/microservice/Supabase stack with a **lean, AI-native, MCP-centric detection engineering platform** that does what SnapAttack does, plus closed-loop AI rule generation and live emulation streaming.

The product in one sentence: **"Run an attack, see it live, get a validated Sigma rule auto-deployed to your SIEM — through chat or a clean web UI, both backed by the same MCP fleet."**

---

## 2. Non-negotiable guardrails

Read these twice. Violations require explicit override.

- **Remove, do not extend:** Kafka, Redpanda, Zookeeper, Avro contracts, the 5-microservice split (`infra_builder`, `rt_script_gen`, `rule_factory`, `deployer`, `edge_agent`), Supabase as a data layer.
- **No microservice sprawl.** New rule: a service exists only if it has a different *runtime profile* (stateful vs stateless, GPU vs CPU, public vs internal) or a different *trust boundary*. Co-locate everything else.
- **MCP servers are not microservices.** They are small, single-purpose, JSON-RPC processes. Each is one folder under `mcp/` with a `pyproject.toml` and ≤500 LoC of business logic.
- **Every MCP tool** has a strict JSON Schema input with `additionalProperties: false`, an explicit `dry_run` parameter where the operation has side effects, and a per-tool allowlist of targets read from config (no free-form destination URLs from the model).
- **Destructive ops** (`push_rule_to_prod`, `isolate_host`, `delete_*`, `deploy_*`) default to `dry_run=true`. Production execution requires `dry_run=false` AND a human-approval flag from the calling host (the Conductor's prompt forbids setting both without an explicit user instruction).
- **Never invent vendor APIs.** If you don't have a reference for a CrowdStrike/Defender/Splunk/Sentinel endpoint, stop and fetch the official docs before implementing. Comment the doc URL above each call.
- **No new TODO stubs.** If a feature can't be implemented this phase, leave a clearly-marked `NotImplementedError("Phase N")` with a tracking issue, not a fake response.
- **Treat all MCP tool inputs as untrusted** — they come from an LLM, not a human. Validate everything server-side.

---

## 3. Target architecture

### 3.1 Three surfaces, one brain

```
┌─────────────────────────────┐    ┌──────────────────────────────┐
│  Claude Desktop (human)     │    │  Conductor (server-side AI)  │
│  - interactive analyst use  │    │  - autonomous loops 24/7     │
│  - MCP host                 │    │  - MCP host                  │
└──────────────┬──────────────┘    └──────────────┬───────────────┘
               │                                  │
               └───────────────┬──────────────────┘
                               │  JSON-RPC / Streamable HTTP
                ┌──────────────▼───────────────┐
                │       MCP Server Fleet       │
                │  ──────────────────────────  │
                │  EDR:  falcon / defender /   │
                │        elastic-defend /      │
                │        sentinelone           │
                │  SIEM: splunk / sentinel /   │
                │        chronicle /           │
                │        elastic-siem          │
                │  EMU:  atomic / caldera /    │
                │        stratus               │
                │  CORE: sigma / mitre /       │
                │        evidence / cti /      │
                │        agents               │
                └──────────────┬───────────────┘
                               │
        ┌──────────────────────┼───────────────────────┐
        │                      │                       │
   ┌────▼────┐         ┌───────▼────────┐      ┌───────▼─────────┐
   │ Postgres│         │ Redis Streams  │      │ Object storage  │
   │ (state) │         │ (agent firehose)│     │ (evidence, HLS) │
   └─────────┘         └───────┬────────┘      └─────────────────┘
                               │
                       ┌───────▼────────┐    ┌──────────────────┐
                       │ Endpoint agents│◄───┤ LiveKit SFU      │
                       │ (Go, mTLS)     │    │ (WebRTC + Egress)│
                       └────────────────┘    └──────────────────┘

                       ┌──────────────────────────────────────┐
                       │  Web UI (Next.js 15)                 │
                       │  - MITRE matrix, timeline w/ markers │
                       │  - evidence viewer, rule PR queue    │
                       │  - lives next to the Conductor       │
                       └──────────────────────────────────────┘
```

### 3.2 Repo structure (target)

```
catchattack/
├── apps/
│   ├── web/                 # Next.js 15 — UI + BFF + auth (NextAuth/Auth.js)
│   └── conductor/           # Python — server-side MCP host + autonomous loops
├── mcp/                     # MCP servers, one folder each
│   ├── sigma/               # pySigma wrapper: parse, lint, convert, dedupe
│   ├── mitre/               # ATT&CK STIX: techniques, coverage math
│   ├── evidence/            # Capture bundle index + retrieval
│   ├── cti/                 # MISP / OTX / internal IOC store
│   ├── agents/              # Bridge to Go agent fleet (gRPC ↔ MCP)
│   ├── splunk/              # SIEM connectors
│   ├── sentinel/
│   ├── chronicle/
│   ├── elastic-siem/
│   ├── falcon/              # EDR connectors
│   ├── defender/
│   ├── elastic-defend/
│   ├── sentinelone/
│   ├── atomic/              # Emulation
│   ├── caldera/
│   └── stratus/
├── agent/                   # Go cross-platform endpoint agent
├── packages/
│   ├── schemas/             # JSON Schema + generated TS + Python types
│   └── ui/                  # Shared shadcn components
├── infra/
│   ├── compose.yaml         # Local dev (Postgres, Redis, LiveKit, MCP)
│   └── terraform/           # Prod (later phases)
├── legacy/                  # Archived old code during Phase 0
├── docs/
├── BUILD_BRIEF.md           # this file
└── README.md
```

### 3.3 Pinned tech stack

Use these versions or the latest patch within the same minor. Do not substitute.

| Layer            | Choice                                        |
|------------------|-----------------------------------------------|
| Web framework    | Next.js 15 (App Router, RSC)                  |
| UI               | React 19, Tailwind v4, shadcn/ui (latest)     |
| Backend lang     | Python 3.12                                   |
| Conductor        | FastAPI + `anthropic` SDK (Opus 4.7)          |
| MCP framework    | `fastmcp` (the official FastMCP library)      |
| Agent lang       | Go 1.23                                       |
| Agent transport  | gRPC over mTLS                                |
| DB               | Postgres 16 + Drizzle ORM (web) / SQLAlchemy 2 (Python) |
| Event bus        | Redis 7 Streams                               |
| Object storage   | S3 / MinIO                                    |
| Live video       | LiveKit (self-hosted), WebRTC + Egress→HLS    |
| Sigma            | `pysigma` + per-backend pipelines             |
| MITRE            | `mitreattack-python`                          |
| Auth             | Auth.js v5 (web), OAuth 2.1 (MCP servers)     |
| Lint/format      | `ruff` + `mypy --strict` (Python), `biome` (TS), `golangci-lint` (Go) |
| Tests            | `pytest`, `vitest`, `go test`                 |

---

## 4. Phase plan

Each phase ends with a working, demoable slice. Don't move on until the demo works.

### Phase 0 — Inventory and quarantine (≈ ½ day)

**Goal:** Get to a clean baseline without losing history.

Tasks:
1. Create branch `v2` from `main`.
2. Create `legacy/` and `git mv` the following into it:
   - `services/` (all 5 microservices)
   - `contracts/` (Avro)
   - `supabase/`
   - `docker-compose.dev.yml`
   - `ops/`
3. Move the current `src/` (React/Vite) into `legacy/frontend/`. We will rebuild on Next.js.
4. Move `backend/` into `legacy/backend/` so the FastAPI mgmt_api is preserved for reference.
5. Add a top-level `README.md` noting that `legacy/` is frozen and superseded by the new tree.
6. Scaffold the new tree (`apps/`, `mcp/`, `agent/`, `packages/`, `infra/`, `docs/`) with placeholder `README.md` in each.
7. Add `pnpm` workspace config and `uv`/`hatch` for Python monorepo management. Pick `uv` for speed.
8. Top-level `Makefile` with: `make dev`, `make verify`, `make fmt`, `make test`.
9. Add `.editorconfig`, root-level `biome.json`, `ruff.toml`, `mypy.ini`.

`make verify` for this phase = `pnpm install` succeeds, `uv sync` succeeds, `make fmt` is clean.

**Status report I want:** confirmation of branch, what got moved, the new tree, and any item from `legacy/` you think we should *not* archive.

---

### Phase 1 — Sigma MCP + Claude Desktop hookup (≈ 1–2 days)

**Goal:** A working MCP server that converts/lints/dedupes Sigma rules, callable from Claude Desktop. End-to-end thin slice.

Tasks:
1. In `mcp/sigma/`:
   - `pyproject.toml` with `fastmcp`, `pysigma`, `pysigma-backend-splunk`, `pysigma-backend-elasticsearch`, `pysigma-backend-kusto`, `pysigma-backend-crowdstrike`.
   - `server.py` exposing these tools (strict schemas, all params `additionalProperties: false`):
     - `parse_sigma(yaml_text: str) -> ParsedRule` — returns title, id, level, tags, ATT&CK techniques, logsource, condition AST.
     - `lint_sigma(yaml_text: str) -> LintReport` — schema validity + style warnings.
     - `convert_sigma(yaml_text: str, target: Enum[splunk|sentinel|chronicle|elastic|falcon], pipeline: str|null) -> ConvertResult` — uses pySigma backends. Return both the converted query and the pipeline trace.
     - `dedupe_against_corpus(yaml_text: str, corpus_path: str) -> DedupeReport` — embedding similarity (use `sentence-transformers` with `all-MiniLM-L6-v2`) + AST overlap. Threshold configurable.
   - Resources (read-only):
     - `sigma://corpus/{rule_id}` — fetch a rule from the local detection-as-code repo.
   - Prompts:
     - `sigma_review` — template for "review this Sigma rule for quality."
2. Stdio transport for local dev; Streamable HTTP for prod. Provide a `claude_desktop_config.json` snippet in `mcp/sigma/README.md`.
3. Tests in `mcp/sigma/tests/` covering: valid rule conversion to each backend, malformed YAML, ATT&CK tag extraction, dedupe with a known duplicate, dedupe with a near-duplicate.

`make verify` = `pytest mcp/sigma` green; manual: connect Claude Desktop to the server and convert a sample Sigma rule to Splunk SPL via chat.

**Demo:** Show me a Claude Desktop session converting `process_creation/win_susp_powershell_encoded_b64.yml` (the SigmaHQ canonical example) to Splunk SPL and Sentinel KQL via chat.

---

### Phase 2 — Splunk MCP + end-to-end deploy flow (≈ 2–3 days)

**Goal:** Deploy a Sigma rule into a Splunk test index from Claude Desktop, end to end.

Tasks:
1. In `mcp/splunk/`:
   - Reference: Splunk REST API docs at https://docs.splunk.com/Documentation/Splunk/latest/RESTREF/RESTprolog. Comment each call with the doc URL.
   - Tools:
     - `search(spl: str, earliest: str, latest: str, max_results: int) -> SearchSummary` — returns aggregated rollup (count, top hosts/users/sources, sample of 10 events), not the firehose.
     - `list_saved_searches(app: str|null) -> SavedSearchList`
     - `deploy_rule(name: str, spl: str, schedule: str, index_target: str, dry_run: bool = true) -> DeployResult` — dry_run renders the savedsearch.conf stanza but does not POST. Real POST only when `dry_run=false` AND `index_target` is in the configured allowlist.
     - `estimate_fp_rate(spl: str, lookback_days: int) -> FPReport` — runs the search over historical logs, returns hits/day distribution and unique-host count.
   - Auth via Splunk session token from env, never logged.
2. Add a `detections/` directory at repo root for detection-as-code (Sigma YAML, one per file). Schema-validated by pre-commit hook calling the Sigma MCP's `lint_sigma`.
3. Conductor prompt update (in `apps/conductor/prompts/`): given a Sigma rule, the Conductor should call Sigma→Splunk convert, then `estimate_fp_rate`, then `deploy_rule(dry_run=true)`, then surface the rendered conf to the user for approval.

`make verify` = `pytest mcp/splunk` green against a local Splunk container (use `splunk/splunk:latest` in `infra/compose.yaml`); manual: deploy a converted Sigma rule via Claude Desktop into the local Splunk's test index, then run a query and see the saved search exists.

**Demo:** In Claude Desktop: "Convert `detections/win_susp_psh_b64.yml` to Splunk, estimate FP rate against the last 7 days of `index=test`, dry-run deploy. If FP rate < 5/day, run for real." End state: saved search exists in Splunk; rule file has a deployment record committed back.

---

### Phase 3 — Go endpoint agent v0 + capture pipeline (≈ 3–4 days)

**Goal:** A real agent on a real Windows/Linux host that does inventory, runs Atomic tests, and captures evidence (video + Sysmon/auditd + PCAP) during the test window.

Tasks:
1. `agent/` Go module, cross-compiled to Win amd64, Linux amd64, macOS arm64 via `goreleaser`.
2. Sub-commands:
   - `agent enroll --server https://catchattack.example.com --token <one-time>` — mTLS cert exchange, persists to local secure storage.
   - `agent run` — long-running daemon. Connects via gRPC stream to `mcp/agents` backend.
   - `agent inventory` — one-shot dump.
3. Capabilities (each behind a feature flag in `agent/config.toml`):
   - Inventory: OS, hostname, IPs, installed software (WMI on Win, `dpkg`/`rpm` on Linux), running processes, EDR presence detection (look for Falcon/Defender/Elastic/S1 services).
   - Capture: spawn `ffmpeg` for screen recording (1280×720, 15fps, libx264, 2 Mbps). On Windows use `gdigrab`; on Linux use `x11grab`; on macOS use `avfoundation`. Output: HLS segments to local temp dir.
   - Telemetry: tail Sysmon EventLog on Win (via `wevtutil` or the Windows event log API), `auditd` on Linux, ESF events on macOS. Forward as structured JSON over the gRPC stream.
   - PCAP: optional, off by default (privacy/size). Uses `tshark` if installed.
   - Atomic Red Team runner: `agent atomic --technique T1059.001 --test-number 1 --dry-run` shells out to `Invoke-AtomicTest` (Win) or the cross-platform fork.
4. `mcp/agents/` MCP server (Python) that bridges:
   - Tools: `list_agents() -> AgentList`, `get_inventory(agent_id) -> Inventory`, `run_atomic(agent_id, technique, test_number, dry_run=true) -> RunReceipt`, `start_capture(agent_id, capture_id) -> CaptureHandle`, `stop_capture(capture_id) -> CaptureBundle`.
   - The MCP server holds the gRPC connection to each agent; the model never sees the gRPC layer.
   - All tools that *execute on the endpoint* are dry-run by default and require the target `agent_id` to be in an allowlist tagged `lab=true`.
5. Capture Bundle format (define in `packages/schemas/capture_bundle.schema.json`):
   ```
   {
     "id": "uuid",
     "started_at": "ISO8601",
     "ended_at": "ISO8601",
     "agent_id": "uuid",
     "atomic_test": {"technique": "T1059.001", "test_number": 1},
     "artifacts": {
       "video_hls": "s3://.../index.m3u8",
       "sysmon": "s3://.../sysmon.jsonl.zst",
       "pcap":   "s3://.../capture.pcap | null",
       "process_tree": "s3://.../proc_tree.json"
     },
     "markers": [
       {"t_ms": 1234, "kind": "atomic_step", "label": "Step 1: powershell -enc"},
       {"t_ms": 5678, "kind": "sysmon_event", "event_id": 1, "ref": "..."}
     ]
   }
   ```

`make verify` = unit tests for the agent's capture spawn logic (mocked ffmpeg); integration test that boots a Linux container as a "fake endpoint," runs `T1059.004` (bash -c), and produces a valid Capture Bundle that round-trips through `mcp/evidence`.

**Demo:** From Claude Desktop: "List my lab agents. Run T1059.001 test 1 on `lab-win-01`, capture everything, give me the bundle URL." End state: Capture Bundle in S3/MinIO, MCP returns the bundle JSON.

---

### Phase 4 — Closed-loop rule generation (≈ 3–4 days)

**Goal:** The flagship workflow. Conductor runs an Atomic test, reads the resulting telemetry from the Capture Bundle, drafts a Sigma rule, validates against the capture, deploys to Splunk test index, re-runs the test, confirms the rule fires.

Tasks:
1. `apps/conductor/` FastAPI app with two concerns:
   - HTTP API for the web UI to kick off workflows.
   - Background worker (APScheduler or arq) running scheduled workflows.
2. Define the workflow `closed_loop_rule_synthesis` in `apps/conductor/workflows/`:
   ```
   inputs: agent_id, technique, test_number
   steps:
     1. mcp.agents.run_atomic(agent_id, technique, test_number, dry_run=false)
        with capture=true → capture_bundle_id
     2. mcp.evidence.summarize(capture_bundle_id) → aggregated telemetry
        (top process names, parent-child chains, command lines, network dests)
     3. anthropic.messages.create with prompt:
          "Given this evidence, draft a Sigma rule that would have detected
           the malicious behavior. Focus on behavior, not IOCs."
        → draft Sigma YAML
     4. mcp.sigma.lint_sigma → must pass
     5. mcp.sigma.dedupe_against_corpus → must score < 0.85 similarity
     6. mcp.sigma.convert_sigma(target=splunk) → SPL
     7. mcp.splunk.estimate_fp_rate(lookback=7d) → must show < FP_THRESHOLD/day
     8. mcp.splunk.deploy_rule(dry_run=true) → render conf
     9. mcp.agents.run_atomic(...) again on a fresh capture
    10. mcp.splunk.search over the new capture's time window using the new
        rule's SPL → must return ≥ 1 hit
    11. If all gates pass: open a PR in the detections/ repo with rule +
        evidence + validation proof. If any gate fails: mark as "needs human."
   ```
3. Each gate failure is a specific, named exit code. The PR (via GitHub MCP if you have credentials, otherwise just commit to a branch) includes: rule YAML, capture bundle ID, SPL, FP estimate, validation hit count, the conductor's reasoning trace.
4. Add a `/workflows/runs/{id}` HTTP endpoint that streams progress as SSE for the web UI later.

`make verify` = end-to-end test: trigger the workflow against a lab agent, assert PR is opened with all expected artifacts.

**Demo:** I send you a TTP I haven't seen detected before. You run the workflow. Within 5 minutes I have a PR with a validated Sigma rule, the capture bundle, and the proof it fires.

---

### Phase 5 — Web UI v1: matrix, timeline, evidence viewer, PR queue (≈ 4–5 days)

**Goal:** The visualizations chat can't do well. SnapAttack-quality timeline with marker overlay.

Tasks:
1. `apps/web/` Next.js 15 with App Router, Auth.js v5 (start with email + GitHub OIDC).
2. Routes:
   - `/coverage` — MITRE matrix. Cell color = (rules count × validation status × env confidence). Hover = rule list. Click = drill into technique.
   - `/captures/[id]` — Capture playback page. **This is the SnapAttack-equivalent.**
     - HLS video player (use `hls.js` + native `<video>`).
     - Timeline below with horizontal lanes: video lane, sysmon lane, network lane, detection-hit lane.
     - Red stars on the timeline for atomic test steps and labeled attacks (filled=detected, hollow=gap).
     - Blue circles for detection hits (filled=true positive validated against label, hollow=unvalidated).
     - Pause/scrub jumps the lanes in sync.
     - Right rail: process graph (use `cytoscape.js` or `reactflow`).
   - `/rules` — detection-as-code browser. Filter by ATT&CK, status, target SIEM.
   - `/rules/prs` — PR review queue. For each Conductor-opened PR: side-by-side rule diff, capture bundle preview, FP estimate, "Approve & merge" button.
   - `/agents` — fleet view. Status, last-seen, capabilities, run-atomic action.
   - `/runs` — workflow run history with SSE-live progress.
3. Use the `mcp/mitre` server's tools server-side (RSC) for matrix data. The web UI is itself an MCP host for read-only operations.
4. Design tokens: dark by default. Red `oklch(60% 0.18 25)` for attacker, blue `oklch(60% 0.15 240)` for defender. Keep the SnapAttack color semantics — analysts will switch contexts and that mental model is gold.
5. Performance: matrix renders 14 tactics × ~600 techniques without jank. Virtualize the timeline if a capture has > 10k events.

`make verify` = Playwright tests for the four main routes; Lighthouse score ≥ 90 perf on `/coverage`.

**Demo:** Walk through a real capture from Phase 3, scrub the timeline, see markers light up, click an event, jump to the process graph, then open the PR queue and approve a rule.

---

### Phase 6 — Live mode: WebRTC streaming via LiveKit (≈ 3 days)

**Goal:** Watch an emulation live in the browser, with sub-second video and live marker stream.

Tasks:
1. Add LiveKit to `infra/compose.yaml` (use the open-source self-hosted image).
2. Extend the Go agent: in addition to writing HLS locally, publish a WebRTC track to LiveKit using the LiveKit Go SDK. Track name = `screen-{agent_id}`.
3. LiveKit Egress configured to also record the same room to HLS in S3/MinIO. **One pipeline, both outputs.**
4. New UI route `/captures/live/[run_id]`:
   - Subscribe to the LiveKit room via the JS SDK.
   - Subscribe to a parallel WebSocket from the Conductor for live markers (atomic step started, sysmon event, detection hit).
   - Render the same timeline component as `/captures/[id]`, but in append-only mode: markers stream in as they happen, MITRE matrix cells flash red as TTPs execute, detection hits flash blue.
5. When the run completes: the live page auto-redirects to `/captures/[id]` (the recorded view) with all the same data, now scrubbable.

`make verify` = manual: trigger a run, open `/captures/live/{id}` in a browser, see video and markers within 2 seconds of execution.

**Demo:** I open the UI, you trigger a multi-step CALDERA chain. I watch it unfold live — video on the left, MITRE matrix lighting up on the right, detection hits flashing in as Splunk fires. Run ends, page seamlessly becomes scrubbable replay.

---

### Phase 7+ — Additional MCP servers (parallelizable, ≈ 1–2 days each)

Each follows the Phase 2 template. Implement in this priority order (informed by market share + your stated targets):

1. `mcp/defender/` — Microsoft Defender for Endpoint via Microsoft Graph Security + Advanced Hunting API. KQL queries, custom detection rules, live response.
2. `mcp/falcon/` — CrowdStrike Falcon via the documented Falcon API (OAuth2 client credentials). Detects, custom IOA rules, RTR.
3. `mcp/elastic-defend/` + `mcp/elastic-siem/` — Kibana Detection Engine API. EQL/ES|QL.
4. `mcp/sentinel/` — Microsoft Sentinel via the `Microsoft.SecurityInsights` ARM API.
5. `mcp/chronicle/` — Google SecOps. YARA-L 2.0 + UDM Search.
6. `mcp/sentinelone/` — S1 Singularity Deep Visibility + STAR rules.
7. `mcp/caldera/` — MITRE CALDERA REST API (port 8888).
8. `mcp/stratus/` — Stratus Red Team for cloud TTPs.
9. `mcp/mitre/` — already partially used in Phase 5; flesh out: technique relationships, group/software lookups, coverage scoring.
10. `mcp/cti/` — MISP + AlienVault OTX + internal IOC store.

Each new EDR/SIEM MCP unlocks: rule deployment to that backend, hunting in that backend, and inclusion in the closed-loop workflow.

---

## 5. Coding standards

**Python (`apps/conductor/`, `mcp/*/`):**
- `python = "^3.12"`, fully type-annotated, `mypy --strict` clean.
- `ruff` for lint + format (replaces black/isort/flake8).
- `pydantic` v2 for all schemas; emit JSON Schema for MCP tool inputs via `model_json_schema()`.
- No bare `except`. No `Any` without a comment justifying it.
- Async by default for I/O. `httpx.AsyncClient` for HTTP.

**TypeScript (`apps/web/`, `packages/`):**
- `strict: true`, `noUncheckedIndexedAccess: true`.
- `biome` for lint + format.
- Server components by default; `"use client"` only when you need state, effects, or browser APIs.
- All MCP/BFF calls go through a typed client generated from the Python JSON Schemas (use `quicktype` or `json-schema-to-typescript` in the build).

**Go (`agent/`):**
- Go 1.23, `golangci-lint` clean.
- Structured logging via `slog`.
- Context-aware everywhere; no goroutine leaks. Use `errgroup`.

**Commits:** Conventional Commits. One logical change per commit. Phase number in the body footer: `Phase: 3`.

**Tests:**
- Unit + integration per phase, listed in that phase's `make verify`.
- Coverage target: 70% lines on `mcp/*` and `apps/conductor/`, 50% on `apps/web/` (components are visually tested via Playwright).
- Every MCP tool has at least one happy-path and one validation-failure test.

**Secrets:**
- Never in repo. `.env.example` for shape; `.env` git-ignored.
- For prod, env injection via the deployment system. Document required vars in each MCP's README.

---

## 6. Documentation requirements

For each new component, produce:
- A `README.md` with: what it is, env vars, how to run, how to test, MCP tool catalog with input/output schemas.
- An ADR (Architecture Decision Record) under `docs/adr/NNNN-title.md` for any non-obvious choice (e.g., "ADR-0003: Redis Streams over Kafka", "ADR-0007: LiveKit over Janus").
- Update `docs/architecture.md` with a diagram (Mermaid) after each phase that materially changes topology.

---

## 7. Definition of Done — per phase

Before claiming a phase is complete:

1. `make verify` is green.
2. The phase's named demo runs end-to-end without manual intervention beyond the documented inputs.
3. README updated, ADRs written, architecture diagram refreshed.
4. No new TODO/FIXME without a tracking issue number.
5. No new dependency unjustified in an ADR or this brief.
6. CI passes on the `v2` branch (set up GitHub Actions in Phase 0: lint + test on push).
7. Status report posted to me with: what works, what doesn't, surprises, deviations.

---

## 8. What I want from you right now

Read this brief end to end. Then respond with:

1. **A confirmation** that you understand the mission, guardrails, and phase model.
2. **A list of questions** about anything ambiguous *before you write a single line of code*. Maximum 10 questions, ranked by impact on the architecture.
3. **A proposed schedule** — your honest estimate per phase, with risk callouts.
4. **Nothing else.** No code yet. No Phase 0 work yet. Wait for my "go on Phase 0."

---

*End of brief. Welcome aboard.*
