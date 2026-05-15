# apps/conductor

Server-side AI Conductor. FastAPI + workflow runtime + clients for MCP,
Anthropic, and PR opening. Houses the flagship `closed_loop_rule_synthesis`
workflow.

## Surface

```
POST  /workflows/{name}/run    → 202 {run_id, status}
GET   /workflows/runs/{id}     → full Run state (events, result, error)
GET   /workflows/runs/{id}/sse → Server-Sent Events stream of StepEvents
GET   /workflows               → list registered workflow names
GET   /health                  → liveness + workflow registry
```

## Workflows

### closed_loop_rule_synthesis(agent_id, technique, test_number?, target_siem?, index_target?)

The 11-step loop from `BUILD_BRIEF.md` Phase 4:

1. `agents.list_agents` — confirm `agent_id` is connected.
2. `agents.run_atomic(dry_run=false)` — first emulation; receive `capture_id_1`.
3. `evidence.summarize_capture(capture_id_1)` — must report ≥1 notable marker.
4. `llm.draft_sigma_rule(technique, evidence, system_prompt)` — drafts YAML.
5. `sigma.lint_sigma` then `sigma.dedupe_against_corpus(threshold=0.85)` — both gates.
6. `sigma.convert_sigma(target=splunk|wazuh)` — must return ≥1 query.
7. `splunk.estimate_fp_rate(lookback_days=7)` (or `wazuh.estimate_fp_rate`) — p95 < threshold.
8. `splunk.deploy_rule(dry_run=true)` (or `wazuh.deploy_rule`) — renders conf.
9. `agents.run_atomic` again — second emulation; receive `capture_id_2`.
10. `splunk.search` over capture-2's window — must return ≥1 hit.
11. `pr.open` — drops the rule under `detections/enterprise/<platform>/<tactic>/` and either commits a branch locally or opens a PR via the GitHub MCP.

Each gate failure raises `GateFailedError(code, message, detail)` with a
named code such as `dedupe.near_duplicate`, `fp.too_high`,
`validation.no_hits`. The run record + SSE stream expose the exact code.

The Conductor never calls `deploy_rule(dry_run=false)`. Promotion is human.

## Clients

| Module | Production | Test fake |
|---|---|---|
| `clients/mcp.py` | `FastMCPClient(transport)` against the proxy at `/mcp` | `StaticMCPClient.respond_to(tool, params_subset, result=…)` |
| `clients/llm.py` | `AnthropicLLM(api_key)` with prompt caching on the system prompt | `StaticLLM(rule_yaml=…)` returns a canned PSH-encoded rule |
| `clients/pr.py`  | `GitHubMCPPROpener` calls `github.create_pull_request` via the proxy; falls back to local on failure. `LocalBranchPROpener` writes to a git branch and a report dir under `detections/_meta/conductor_runs/<id>/` | `LocalBranchPROpener` works against any temp repo |

## Run

```bash
CATCHATTACK_PROXY_URL=http://localhost:7100/mcp/ \
ANTHROPIC_API_KEY=… \
uv run conductor --port 7200 --repo /path/to/catchattack-beta
```

Trigger:

```bash
curl -X POST http://localhost:7200/workflows/closed_loop_rule_synthesis/run \
  -H 'Content-Type: application/json' \
  -d '{
        "inputs": {
          "agent_id": "lab-win-01",
          "technique": "T1059.001",
          "test_number": 1
        }
      }'
```

Watch progress over SSE:

```bash
curl -N http://localhost:7200/workflows/runs/<run_id>/sse
```

## Tests

```bash
cd apps/conductor
uv run pytest -q
```

Four layers:

- **`test_clients.py`** — unit tests for the static and production client wrappers.
- **`test_workflow_closed_loop.py`** — seven scenarios exercising every named gate failure (`preflight.unknown_agent`, `evidence.empty`, `lint.errors`, `dedupe.near_duplicate`, `fp.too_high`, `validation.no_hits`) plus the happy path.
- **`test_workflow_integration.py`** — wires every in-tree MCP server (sigma, splunk-mock, agents, evidence) into a single in-process FastMCP router and drives the workflow against it. No mocks at the MCP boundary.
- **`test_api.py`** — FastAPI surface smoke (queue, fetch, 404 on unknown workflow).

## System prompt

The Conductor loads `apps/conductor/prompts/system_v1.md` at startup (see
addendum §D). The prompt is cached on the Anthropic side so it does not
re-bill on every run. Versioned.
