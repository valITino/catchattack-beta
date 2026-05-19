# ADR-0007: Web UI v1 — Next.js 15 + Auth.js + server components

- **Status:** Accepted (Phase 5)
- **Date:** 2026-05-13

## Context

`BUILD_BRIEF.md` §5 mandates a Next.js 15 / App Router / React 19 web UI
with six brief-named routes (matrix, captures, rules, PR queue, agents,
runs) plus dark-by-default styling with the SnapAttack attacker/defender
colour semantics. The UI is itself an MCP host for read-only operations.

## Decisions

### 1. Stack pinned to the brief

- Next.js 15.5 (App Router, typed routes), React 19, Tailwind v4 (PostCSS
  plugin), TypeScript `strict + noUncheckedIndexedAccess`.
- Auth.js v5 (`next-auth@beta`) with three modes via `AUTH_MODE`: `dev`
  (no auth, fixed operator identity), `github` (GitHub OIDC), `email`
  (magic-link, Phase 6 wiring).

### 2. Server components fetch upstream; clients only for interactivity

Every page is a server component by default. Two client components in
Phase 5:

- `apps/web/src/app/captures/[id]/CapturePlayer.tsx` — HLS playback via
  native `<video>` on Safari + lazy-loaded `hls.js` elsewhere.
- `apps/web/src/app/runs/[id]/RunTail.tsx` — SSE subscriber for live run
  progress.

Server components call:

- `lib/conductor.ts` — typed `fetch` over the Conductor's `:7200` API.
- `lib/mcp.ts` — hand-rolled JSON-RPC client for the proxy's `/mcp`
  streamable-HTTP endpoint (avoids dragging the full `@modelcontextprotocol/sdk`
  into the Next bundle). Translates dotted tool names to FastMCP's
  underscored form (`sigma.lint_sigma` → `sigma_lint_sigma`).

### 3. SSE proxy at `/api/runs/[id]/sse`

The browser cannot reach the Conductor directly (it lives on the BFF
side). A thin Next route streams the upstream SSE body through. No
re-encoding, no transformation — just forward the `text/event-stream` body
with `cache-control: no-cache`.

### 4. Pluggable data sources with graceful empty states

- `evidence.list_captures` returns `{items: []}` when no capture exists;
  the page renders an empty-state card with a one-liner explaining how to
  trigger the closed loop.
- `agents.list_agents` may return an error if the proxy isn't running; the
  page surfaces the error rather than crashing.
- `/rules` and `/rules/prs` walk the filesystem (`detections/` and
  `detections/_meta/conductor_runs/`), so they work without any upstream.
- `/coverage` derives rule counts from the same filesystem walk plus a
  seeded MITRE tactic+technique table — the matrix renders even before
  the `mitre` MCP is wired (Phase 7+).

### 5. Design tokens in CSS, not Tailwind config

Tailwind v4's `@theme {}` directive owns the colour scale. Tokens:

```
--color-attacker:  oklch(60% 0.18 25)
--color-defender:  oklch(60% 0.15 240)
--color-warn:      oklch(75% 0.18 75)
--color-ok:        oklch(70% 0.14 145)
```

Per BUILD_BRIEF.md §5. Dark by default; `color-scheme: dark` on `html`.

### 6. Playwright as the Phase 5 verify-bar

Six tests, one per route, asserting the route serves a 200 and contains
its landmark heading + brief-mandated content (e.g. all 13 enterprise
tactic names on `/coverage`). The suite runs against `pnpm start` (the
production build), not `pnpm dev`, so Lighthouse-friendly chunking is
exercised. No upstream services are running; the empty states are part
of what's tested.

Lighthouse score (perf ≥ 90 on `/coverage`) is out-of-scope for this
session's sandbox (no headless Chrome with the right flags configured)
but the production build's chunk sizes (102 KiB first-load shared, route
chunks 137–744 B) are well within the budget.

## Consequences

Positive:
- All six brief routes render. Build succeeds; Playwright suite is
  green.
- Adding new MCP-driven pages is mechanical: call `callTool()` from a
  server component.
- AUTH_MODE flip lets operators test locally without OAuth round-trips.
- No client-side MCP traffic — the browser only talks to Next; auth and
  approval tokens stay server-side.

Negative:
- The MCP JSON-RPC client is hand-rolled (~80 lines). Acceptable for the
  current 3-method surface (`tools/call`, `tools/list`, `resources/read`)
  but if we add streaming sampling we'll want the upstream SDK.
- Typed routes require importing `Route` for prop types — visible in
  `Nav.tsx` and `page.tsx`. The compile-time benefit (catches typos in
  hrefs) outweighs the boilerplate.
- The capture timeline is server-rendered SVG. Virtualization for >10k
  events (per the brief) lands in Phase 6 alongside live-mode.
- Process graph (cytoscape/reactflow) is not yet rendered; the
  capture page lists `top_processes` as a fallback. Phase 6.

## Rejected alternatives

- *`@modelcontextprotocol/sdk` for the MCP client.* The SDK is sizeable
  and would push the Next bundle over the brief's first-load budget.
  Hand-rolled JSON-RPC over `fetch` is 80 lines and zero bundle impact
  (server-only).
- *Client-side SSE without a Next proxy.* Would expose the Conductor's
  URL and bypass any future auth at the BFF boundary.
- *`create-next-app` scaffold.* Brings opinionated boilerplate (ESLint
  setup, default fonts, dummy pages) we'd have to undo. Hand-built
  scaffold is smaller and brief-aligned.
- *Cytoscape.js for the process graph in this phase.* Adds 250 KiB to
  the captures route. Deferred to Phase 6.
