# CatchAttack — Claude Code Instructions

Behavioral guidelines + project-specific rules. Read the whole file before touching anything.

---

## ⚠️ Mandatory Protocol — Read Before Touching Anything

Before making **any** fix, refactor, addition, or change — no matter how small it looks — you must complete all three phases below in order. **No exceptions.**

> **Note on tradeoffs:** Generic coding guidance often says "for trivial tasks, use judgment and skip the ceremony." That shortcut **does not apply here.** This is a security-sensitive Detection-as-Code platform: a one-line change can silently break a Sigma rule's logic, corrupt an Avro contract that downstream Kafka consumers depend on, weaken role-based access on a sensitive endpoint, or push a malformed payload to a customer SIEM. Bias toward caution over speed, always.

### Phase 1: Web Research — Cast a Wide Net

Search the web for current, accurate information on **anything the task touches** that may have changed, broken, or gained known issues since your training cutoff. Err on the side of over-researching. The goal is to catch surprises *before* you write code, not after.

At minimum, research:

- **Every framework, library, package, runtime, or base image involved in the change** — current API, deprecations, breaking changes between versions, known CVEs, security advisories. This stack includes Vite, React 18, TypeScript 5, Tailwind, shadcn-ui, React Query, React Router, Zod, FastAPI, Pydantic, SQLAlchemy/Alembic, Postgres 16, Kafka, fastavro, Supabase JS, Elastic, OpenTelemetry.
- **Every external tool, CLI, flag, or service** whose behavior the change depends on — Sigma CLI / pySigma backends, Elastic / Splunk REST APIs, EDR/XDR endpoints, Nessus, MITRE ATT&CK STIX/TAXII data, Atomic Red Team. Verify current request/response shape, auth model, and rate limits.
- **Every protocol, spec, or standard** the change interacts with — Sigma rule spec, MITRE ATT&CK technique IDs, Avro schema evolution rules, OpenTelemetry semantic conventions, OAuth/JWT specifics for Supabase.
- **Domain context relevant to the task** — current detection engineering best practices, ATT&CK technique coverage shifts, Sigma backend gotchas, known false-positive patterns — whatever applies to *this* specific change.

Then broaden: is there a recent post-mortem, GitHub issue, or advisory describing a bug very similar to what you're about to fix or introduce? Check.

If your web research is inconclusive, contradicts your prior assumptions, or returns nothing relevant — **say so explicitly** before proceeding. Do not silently fill gaps with memory.

### Phase 2: Full Codebase Review — Understand the Blast Radius

Read the **actual current state** of the codebase. Do not rely on memory from previous sessions, and do not trust summaries — open the files.

Baseline reading (always, every session):

- `CLAUDE.md` (this file), `README.md`, and `CONTRIBUTING.md`
- Top-level configuration: `package.json`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `tailwind.config.ts`, `backend/requirements.txt`, `backend/pyproject.toml`, `backend/alembic.ini`, `docker/docker-compose.yml`, `docker-compose.dev.yml`, `ops/Makefile`, `.env` / `.env.example` files in repo root, `backend/`, and each service under `services/`.

Task-specific reading (scale to the change):

- **Every file you plan to modify — in full**, not just the region you're touching. Adjacent code often encodes invariants that aren't obvious from the target line alone.
- **Every file that imports or is imported by the files you're touching** — to see the blast radius. Frontend services in `src/services/` are consumed across many `src/pages/` and `src/components/`; backend services in `backend/app/services/` are wired into `backend/app/api/v1/` routers.
- **Related tests, schemas, fixtures, type definitions, Pydantic models, and Avro schemas** — they describe the contract you're about to honor or break. In particular: `contracts/asset_event.avsc`, `contracts/audit_event.avsc`, `backend/schemas.py`, `backend/app/api/v1/*.py` request/response models, frontend `src/types/`.
- **Any documentation, comment, or prompt template** that references the behavior you're changing — including the `docs/` folder and inline JSDoc / docstrings.
- **Any orchestration or glue layer** that wires the touched component into the rest of the system: `docker/docker-compose.yml`, `docker-compose.dev.yml`, `ops/Makefile`, `ops/demo.py`, `ops/seed_users.py`, `.github/workflows/`, `supabase/config.toml`, and the per-service `services/*/` Kafka producers/consumers.

If mid-review you discover the change touches more than you thought, **expand the review** — do not push ahead with a partial picture.

### Phase 3: Understand Before Acting

Before writing code, answer these internally:

1. **Root cause** — not the symptom, the actual root cause?
2. **Blast radius** — which other files, modules, behaviors, or contracts does this change affect? Pay particular attention to cross-language boundaries (TypeScript frontend ↔ FastAPI backend ↔ Kafka services).
3. **Stable contracts** — does the fix break any stable internal contract that downstream consumers rely on? Examples include the Avro schemas in `contracts/` (consumed by every Kafka producer/consumer), the FastAPI request/response models in `backend/schemas.py` and `backend/app/api/v1/*.py` (consumed by the frontend), the Sigma rule output shape produced by `rule_factory` and consumed by `deployer`, Kafka topic names (`asset.events`, `rules.draft`, `audit.events`), and the Supabase function signatures.
4. **Security invariants** — does it violate any core safety rule? Subprocess calls must use `shell=False` with an args list; secrets and API tokens (`EDR_API_TOKEN`, `NESSUS_API_TOKEN`, Supabase keys, JWT secrets) must never be logged; every MCP-style or HTTP request body must be validated with Pydantic/Zod before reaching business logic; role-based access checks must remain on every privileged route (`/deploy`, `/rules`, admin-only paths); generated Sigma rules must round-trip through validation before deployment; CORS origins and rate limits in `backend/app/core/` must not be loosened casually.
5. **Simplicity** — is there a simpler fix that achieves the same result?

Only after answering all five — write the fix.

---

## Implementation Principles

These govern *how* you write code once the mandatory protocol is complete. They complement Phase 3, not replace it.

### 1. Think Before Coding
**Don't assume. Don't hide confusion. Surface tradeoffs.**

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First
**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: *"Would a senior engineer say this is overcomplicated?"* If yes, simplify.

### 3. Surgical Changes
**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently. The frontend leans on functional React components + hooks + shadcn-ui patterns; the backend uses FastAPI routers per resource under `backend/app/api/v1/` with services under `backend/app/services/`.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that **your** changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution
**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure `npm run lint`, `npm run build`, and `pytest` pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

## Project Purpose

CatchAttack is an end-to-end **Detection-as-Code** platform. It automates adversary emulation aligned with MITRE ATT&CK, generates Sigma rules from emulation results, checks them for duplicates, and deploys them to SIEMs (Elastic, Splunk, EDR/XDR) via a CI/CD pipeline and a dashboard.

The architecture is event-driven micro-services around a FastAPI control plane:

- **Frontend (`src/`)** — Vite + React 18 + TypeScript + Tailwind + shadcn-ui; uses React Query against the FastAPI backend (`VITE_API_BASE` / `VITE_API_URL`). The UI renders no mock data — it requires the backend to be reachable.
- **Backend (`backend/`)** — FastAPI app with versioned routers under `backend/app/api/v1/` (auth, rules, runs, deploy, coverage, builder, tuning, imports, ai, schedules, priorities, profiles, search, health), service layer under `backend/app/services/`, Postgres via SQLAlchemy + Alembic migrations, core middleware (auth, rate limit, logging) under `backend/app/core/`, OTLP telemetry to the OpenTelemetry collector.
- **Kafka micro-services (`services/`)** — `edge_agent` (asset telemetry → `asset.events`), `infra_builder` (Terraform lab provisioning), `rt_script_gen` (Atomic Red Team playbook prompts), `rule_factory` (lab findings → draft Sigma in `rules.draft`), `deployer` (validate + push rules to external SIEM/EDR/XDR/scanner APIs). Audit events flow on `audit.events`.
- **Contracts (`contracts/`)** — Avro schemas (`asset_event.avsc`, `audit_event.avsc`) that pin the on-the-wire format between producers and consumers.
- **Supabase (`supabase/`)** — Edge functions and config for the hosted auth/data path.
- **Ops (`ops/`)** — `Makefile` (top-level entrypoint: `make -f ops/Makefile dev` / `demo`), `seed_users.py`, `demo.py`, `smoke.sh`.

---

## Code Standards

### Python (backend + services)
- All Python code must be type-annotated.
- All HTTP request/response bodies must be validated with Pydantic models — never trust raw `dict`s into business logic.
- All subprocess calls must use `subprocess.run(args_list, shell=False)`. Never use `shell=True`.
- Never log API keys, JWTs, EDR/Nessus tokens, Supabase service-role keys, or any secret. If a payload may contain a secret, redact before logging.
- Database schema changes go through Alembic (`make migrate`) — never edit committed migrations after they've shipped; add a new revision instead.
- Kafka producers must serialize against the Avro schema in `contracts/`. Schema changes must be backwards-compatible (add optional fields with defaults) unless every consumer is updated in the same change.
- Generated Sigma rules must pass parser validation before being persisted or deployed.

### TypeScript (frontend)
- Strict TypeScript — avoid `any`; prefer narrowing or `unknown`.
- Functional components + hooks. Co-locate component-specific types.
- Validate untrusted input (URL params, form data, API responses where shape matters) with Zod.
- All API access goes through `src/services/` — don't fetch directly from components/pages.
- Match existing shadcn-ui + Tailwind composition patterns; don't introduce a parallel UI kit.
- Run `npm run lint` (zero warnings — the script enforces `--max-warnings=0`) and `npm run build` before declaring done.

### Cross-cutting
- The Avro contracts in `contracts/`, the FastAPI schemas exposed under `/api/v1/`, the Sigma rule output of `rule_factory`, and the Kafka topic names are **stable contracts**. Do not break them without updating every consumer in the same change.
- CORS, rate limiting, and auth middleware in `backend/app/core/` are security primitives — change deliberately and with justification.
- Role-based access (analyst vs. admin, as seeded by `ops/seed_users.py`) must be enforced server-side, not just hidden in the UI.

---

## Adding a New Backend Service / Kafka Worker

Follow the existing conventions under `services/` — don't invent new patterns. Before you start, read at least one existing service end-to-end (e.g. `services/edge_agent/`) to match its structure.

1. Create `services/<new_service>/` alongside the existing service directories.
2. Define or reuse the Avro schema in `contracts/`. If new, add the `.avsc` and confirm compatibility with all producers/consumers.
3. Implement the worker using the same Kafka client, settings loader, and logging conventions as the other services. Topic names belong in config, not string literals scattered through the code.
4. Add the service to `docker/docker-compose.yml` (and `docker-compose.dev.yml` if it should run in the dev profile). Include a healthcheck and a non-root user in the Dockerfile.
5. Wire any control-plane endpoints into a new router under `backend/app/api/v1/` and register it; add Pydantic request/response models.
6. Add a `make logs-<name>` target to `ops/Makefile` (use backticks around `<name>` in docs so it renders).
7. Update the README components table and `docs/` if there's user-facing behavior.
8. Add tests — at minimum, Pydantic validation tests for every new endpoint and unit tests for any Avro (de)serialization logic.

---

## Adding a New Frontend Feature

1. Add API access in `src/services/` (extend the appropriate service or create a new one alongside `rulesService.ts`, `siemService.ts`, etc.).
2. Define types in `src/types/` and validate untrusted shapes with Zod.
3. Build the UI from shadcn-ui primitives under `src/components/ui/`; place feature components in the matching `src/components/<area>/` subfolder (detection, emulation, mitre, rules, siem, sigma, tenant, layout).
4. Add or extend a page in `src/pages/` and wire React Router.
5. Use React Query for server state — don't roll a custom cache.
6. Run `npm run lint` and `npm run build`. For UI work, start the dev server and verify the change in a browser before declaring done.

---

## Local Development & Verification

```bash
# Full dev stack (Postgres, API, Web, Elastic, OTel collector)
make -f ops/Makefile dev

# Seeded demo (creates analyst + admin users, sample data)
make -f ops/Makefile demo

# Backend tests
pytest                                # from repo root, uses backend/pytest.ini
# Lint (inside api container)
make -f ops/Makefile lint
# Coverage
make -f ops/Makefile coverage
# Tail API logs
make -f ops/Makefile logs-api
```

Frontend:

```bash
npm install
npm run dev          # http://localhost:3000
npm run lint         # zero warnings required
npm run build
```

The UI renders no data until the backend is reachable at `VITE_API_BASE` / `VITE_API_URL`. There are no mocks.

---

## Key Reference Links

| Resource | URL |
|----------|-----|
| MITRE ATT&CK | https://attack.mitre.org |
| Sigma rule spec | https://github.com/SigmaHQ/sigma-specification |
| pySigma | https://github.com/SigmaHQ/pySigma |
| Atomic Red Team | https://atomicredteam.io |
| FastAPI | https://fastapi.tiangolo.com |
| Pydantic v2 | https://docs.pydantic.dev |
| SQLAlchemy / Alembic | https://docs.sqlalchemy.org / https://alembic.sqlalchemy.org |
| Apache Avro | https://avro.apache.org/docs/current/specification/ |
| Vite | https://vitejs.dev |
| React Query (TanStack) | https://tanstack.com/query/latest |
| shadcn-ui | https://ui.shadcn.com |
| Zod | https://zod.dev |
| Supabase | https://supabase.com/docs |
| OpenTelemetry | https://opentelemetry.io/docs |

---

## Authorization — This Is a Defensive Security Platform

CatchAttack runs adversary emulation and pushes detection rules to live SIEMs and EDR/XDR endpoints. That means:

- **Only operate against infrastructure you own or have explicit written authorization to test.** Emulation playbooks generated by `rt_script_gen` and infra provisioning by `infra_builder` are scoped to lab targets defined in configuration — never broaden that scope without an authorization signal from the operator.
- **Deployment targets** (`deployer` service, `/api/v1/deploy` routes) push rules to customer SIEMs. Treat every deploy as production-affecting: validate the rule, confirm the target tenant, and respect any dry-run / staging flags before pushing.
- **Tenancy boundaries** — multi-tenant code paths (`src/components/tenant/`, tenant-scoped queries in `backend/app/services/`) must filter by the authenticated tenant on the server side. Never trust a tenant ID supplied by the client without verification.
- **Secrets** (`EDR_API_TOKEN`, `NESSUS_API_TOKEN`, `EDR_TOKEN`, `NESSUS_TOKEN`, Supabase keys, JWT signing keys) live in `.env` files and must never be committed, logged, or echoed back through an API response.

---

## Self-Check — Are These Guidelines Working?

These guidelines are working if:
- Diffs contain fewer unnecessary changes.
- Fewer rewrites due to overcomplication.
- Clarifying questions come **before** implementation, not after mistakes.
- Every Phase 3 question is answered before code is written.
- No `shell=True`, no broken Avro / FastAPI / Sigma contracts, no loosened CORS or auth checks, no leaked secrets.
- When research is inconclusive or the codebase review surfaces a surprise, it's named explicitly instead of papered over.

---

*CatchAttack is a defensive security tool. Only run emulations and deploy rules against environments you own or have explicit written authorization to test. Unauthorized adversary emulation is illegal.*
