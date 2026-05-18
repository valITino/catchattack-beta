# CatchAttack

> Run an attack, see it live, get a validated Sigma rule auto-deployed to your SIEM —
> through chat or a clean web UI, both backed by the same MCP fleet.

This is **CatchAttack v2** — a lean, AI-native, MCP-centric detection
engineering platform. The previous Kafka/Avro/5-microservice/Supabase
implementation is frozen under [`legacy/`](./legacy/) and superseded by this
tree.

## Build status

This is an in-progress rewrite executed against
[`BUILD_BRIEF.md`](./BUILD_BRIEF.md) (with
[`BUILD_BRIEF_ADDENDUM.md`](./BUILD_BRIEF_ADDENDUM.md) taking precedence).
Phases land one at a time with explicit operator greenlight.

| Phase | Status |
|---|---|
| 0 — Quarantine + scaffold + proxy skeleton | done |
| 1 — `mcp/sigma` + Claude Desktop hookup + proxy routing | done |
| 2 — `mcp/mocks/splunk` + `mcp/wazuh` + deploy flow + compose stack | done |
| 3 — Go agent + `mcp/evidence` + `mcp/agents` + capture-bundle | done |
| 4 — Closed-loop rule synthesis + Conductor FastAPI | done |
| 5 — Web UI v1 (Next.js 15, six routes) | done |
| 6 — Live WebRTC mode (LiveKit + marker stream) | done |
| 7 — `mcp/stratus` + 6 vendor mocks (falcon/sentinel/chronicle/s1/elastic/caldera) | done |

## Layout

```
catchattack/
├── apps/
│   ├── web/                 # Next.js 15 — UI + BFF (Phase 5)
│   └── conductor/           # Python FastAPI — server-side AI Conductor (Phase 4)
├── mcp/                     # In-house MCP servers (sigma, evidence, agents, stratus)
├── mcp-proxy/               # Trust-boundary proxy — namespacing, dry-run, audit
├── agent/                   # Go cross-platform endpoint agent (Phase 3)
├── packages/
│   ├── schemas/             # JSON Schema source of truth
│   └── ui/                  # Shared shadcn components
├── infra/
│   ├── compose.yaml         # Local dev stack (Phase 1+)
│   └── terraform/           # Production infra (later)
├── detections/              # Detection-as-code (Sigma YAML), see addendum §C
├── docs/                    # ADRs, architecture diagrams
└── legacy/                  # FROZEN — old code preserved for reference
```

Official vendor MCPs (Falcon, Sentinel, Splunk-in-Splunk, Google SecOps, S1,
Elastic Agent Builder, Caldera plugin, MITRE ATT&CK, GitHub) are **not**
rebuilt in this tree — they are integrated via `mcp-proxy/upstreams.yaml`.

## Quickstart (Phase 0)

Prereqs: `uv`, `pnpm`, `make`. Python 3.12, Node 20.

```bash
make install   # uv sync + pnpm install
make verify    # workspace installs + format check
```

Phase 1 capabilities:

```bash
# Sigma MCP server on stdio (what Claude Desktop launches)
uv run sigma-mcp

# Or expose it via streamable-HTTP
uv run sigma-mcp --transport http --port 7110

# Run the proxy (mounts sigma + future upstreams; MCP endpoint at /mcp,
# health at /health, dry-run preview at /policy/preview)
cd mcp-proxy && uv run uvicorn mcp_proxy.app:app --port 7100
```

`make dev` becomes meaningful from Phase 2 onward when `infra/compose.yaml`
adds Splunk Free and Wazuh.

## legacy/ is frozen

`legacy/` contains the previous implementation — Kafka, Avro contracts, the
five microservices, the Supabase layer, the FastAPI `mgmt_api`, the Vite/React
frontend. **Do not extend it.** It is kept solely for reference while we
re-implement features in the new tree.

Anything inside `legacy/` is excluded from `ruff`, `biome`, `mypy`, and CI
test runs.
