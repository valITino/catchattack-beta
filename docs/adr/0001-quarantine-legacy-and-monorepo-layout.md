# ADR-0001: Quarantine legacy and adopt the v2 monorepo layout

- **Status:** Accepted (Phase 0)
- **Date:** 2026-05-13

## Context

The repository previously implemented a five-microservice stack
(`infra_builder`, `rt_script_gen`, `rule_factory`, `deployer`, `edge_agent`)
glued together with Kafka, Avro contracts, and a Supabase data layer; the UI
was a Vite/React/Shadcn SPA. `BUILD_BRIEF.md` and its addendum mandate a
ground-up rewrite to an MCP-centric architecture and remove this stack
wholesale.

## Decision

1. **Quarantine, do not delete.** All previous code is moved verbatim into
   `legacy/` via `git mv` so history is preserved. `legacy/` is excluded from
   `ruff`, `biome`, `mypy`, and CI tests. No new work targets it.
2. **Monorepo layout** matches addendum §A:
   `apps/{web,conductor}`, `mcp/*`, `mcp-proxy/`, `agent/`, `packages/{schemas,ui}`,
   `infra/`, `detections/`, `docs/`, `legacy/`.
3. **Workspace managers:**
   - `pnpm` for TypeScript (`apps/web`, `packages/*`).
   - `uv` for Python (`apps/conductor`, `mcp-proxy`, `mcp/*`).
4. **MCP proxy is a first-class component**, not an add-on. Phase 0 ships
   the config loader, policy engine (dry-run enforcement + target allowlist +
   approval-token check), and append-only JSONL audit log with secret
   redaction. Upstream transports land in Phase 1.
5. **Approval-token mechanism** is the same protocol Phase 0→∞:
   `X-CatchAttack-Approval-Token` header compared with `hmac.compare_digest`
   against a value read at startup from `CATCHATTACK_APPROVAL_TOKEN`.
   Phase 0–4 the operator pastes the env value; Phase 5+ the web UI mints
   short-lived tokens. No protocol change between modes.
6. **Branch policy:** development on the assigned feature branch
   (`claude/review-build-briefs-gWBZg`); the original brief's `v2` branch
   is dropped; final destination is `main`.

## Consequences

Positive:
- Clean slate for the new architecture; readers cannot accidentally extend
  legacy code (lint/CI ignore it).
- `git log --follow` still reaches legacy history.
- The approval-token protocol is settled before any destructive tool exists,
  so we never need to retrofit auth into already-running workflows.

Negative:
- `legacy/` adds ~50 MB of read-only code to checkouts. Acceptable for the
  reference value; can be pruned later once nothing references it.
- The previous CI workflows (`backend.yml`, `ci.yml`) are renamed
  `*.disabled` rather than deleted, so they show up in PR file listings
  during Phase 0–1.

## Rejected alternatives

- *Hard-delete legacy code.* Loses reference value during the rewrite and
  forces archaeology against an old commit when debugging migrated tests.
- *Defer the MCP proxy to Phase 1.* The addendum's threat model treats
  upstream MCP servers as untrusted; deferring would mean writing destructive
  tools (Phase 2 `splunk.deploy_rule`) before the enforcement layer exists.
  Cheaper to land the policy engine first.
- *Pin `mcp.server.fastmcp` from the official MCP SDK over `jlowin/fastmcp`
  v2.* The v2 fork has streamable-HTTP server support, richer middleware
  hooks, and active maintenance; we adopt it as the FastMCP implementation
  for `mcp/*` and revisit if upstream consolidates.
