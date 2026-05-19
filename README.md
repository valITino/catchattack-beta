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
├── mcp/                     # In-house MCP servers (sigma, wazuh, evidence, agents, stratus)
│   └── mocks/               # Synthetic vendor MCPs (splunk, falcon, sentinel, …)
├── mcp-proxy/               # Trust-boundary proxy — namespacing, dry-run, audit
├── agent/                   # Go cross-platform endpoint agent (Phase 3)
├── packages/
│   ├── schemas/             # JSON Schema source of truth
│   └── ui/                  # Shared shadcn components
├── infra/
│   ├── compose.yaml         # Local dev stack — Wazuh, MinIO, LiveKit, proxy
│   ├── Dockerfile.proxy     # Container image for the MCP proxy
│   ├── livekit.yaml         # LiveKit SFU dev config
│   └── egress.yaml          # LiveKit Egress (HLS recording) config
├── detections/              # Detection-as-code (Sigma YAML), see addendum §C
├── docs/                    # ADRs
└── legacy/                  # FROZEN — old code preserved for reference
```

Official vendor MCPs (Falcon, Sentinel, Splunk-in-Splunk, Google SecOps, S1,
Elastic Agent Builder, Caldera plugin, MITRE ATT&CK, GitHub) are **not**
rebuilt in this tree — they are registered as upstreams in
`mcp-proxy/upstreams.yaml` (copy it from `upstreams.example.yaml`). Until
credentials are supplied each routes to a synthetic mock under `mcp/mocks/`.

## Quickstart

Prereqs: `uv`, `pnpm`, `make`, Go 1.25+, and Docker (for `make dev`).
Python 3.12, Node 20.

```bash
make install   # uv sync + pnpm install
make verify    # install + format-check + lint + mypy + tests (Python, Go, web)
```

### Local dev stack

```bash
cp mcp-proxy/upstreams.example.yaml mcp-proxy/upstreams.yaml   # optional, then edit
make dev       # docker compose -f infra/compose.yaml up — Wazuh, MinIO, LiveKit, proxy
```

### Running pieces individually

```bash
# Sigma MCP server on stdio (what Claude Desktop launches)
uv run sigma-mcp
# …or over streamable-HTTP
uv run sigma-mcp --transport http --port 7110

# The MCP proxy — namespaced routing, dry-run + approval policy, audit log.
# MCP endpoint at /mcp, health at /health, dry-run preview at /policy/preview.
cd mcp-proxy && uv run uvicorn mcp_proxy.app:app --port 7100

# The Conductor — FastAPI workflow orchestrator
cd apps/conductor && uv run conductor --port 7200

# The web UI + BFF
cd apps/web && pnpm dev   # http://localhost:3000
```

## legacy/ is frozen

`legacy/` contains the previous implementation — Kafka, Avro contracts, the
five microservices, the Supabase layer, the FastAPI `mgmt_api`, the Vite/React
frontend. **Do not extend it.** It is kept solely for reference while we
re-implement features in the new tree.

Anything inside `legacy/` is excluded from `ruff`, `biome`, `mypy`, and CI
test runs.
