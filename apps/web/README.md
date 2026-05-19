# apps/web

Next.js 15 web UI for CatchAttack. App Router + React 19 + Tailwind v4 +
Auth.js v5. Server components fetch from the Conductor (`:7200`) and call
MCP tools through the proxy (`:7100/mcp/`).

## Routes (per BUILD_BRIEF.md §5)

| Route | What it does | Data source |
|---|---|---|
| `/` | Landing tiles | static |
| `/coverage` | MITRE ATT&CK matrix coloured by rule count × validation | walks `detections/` |
| `/captures` | List capture bundles | `evidence.list_captures` |
| `/captures/[id]` | HLS player + timeline marker lanes + top processes | `evidence.get_capture` |
| `/captures/live/[run_id]` | Live emulation viewer — LiveKit video + marker stream | `conductor:/live/*` + LiveKit |
| `/rules` | Detection-as-code browser | walks `detections/` |
| `/rules/prs` | Conductor-drafted PR queue with FP report, SPL, reasoning | reads `detections/_meta/conductor_runs/` |
| `/agents` | Fleet view | `agents.list_agents` |
| `/runs` | Workflow registry | `conductor:/workflows` |
| `/runs/[id]` | Per-run view with live SSE event tail | `conductor:/workflows/runs/{id}` + `/sse` |

All upstream calls live in `src/lib/`:

- `lib/config.ts` — server-side env config (Conductor + proxy URLs, auth mode, approval token).
- `lib/conductor.ts` — typed fetch wrapper around `/workflows/*`.
- `lib/mcp.ts` — minimal JSON-RPC client for the proxy's `/mcp` endpoint.
- `lib/mitre.ts` — seeded ATT&CK tactics + filesystem coverage lookup.
- `lib/rules.ts` — Sigma-rule walker for the DAC browser.
- `lib/auth.ts` — Auth.js v5 with `dev` / `github` / `email` modes.

## Auth modes

Selected by `AUTH_MODE`:

- `dev` (default) — no real auth. Server components see a fixed dev operator
  identity. Use for laptop development.
- `github` — GitHub OIDC via `next-auth/providers/github`. Requires
  `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET`.
- `email` — magic-link email (Phase 6+ wiring; falls back to dev for now).

## Design tokens

```
attacker:  oklch(60% 0.18 25)   /* red, BUILD_BRIEF.md §5 */
defender:  oklch(60% 0.15 240)  /* blue */
warn:      oklch(75% 0.18 75)   /* amber */
ok:        oklch(70% 0.14 145)  /* green */
```

Dark by default; light mode is not wired (operators run in dark consoles).

## Run

```bash
cd apps/web
pnpm install
pnpm dev       # http://localhost:3000
```

With the rest of the stack:

```bash
# in three shells:
cd /repo && uv run uvicorn mcp_proxy.app:app --port 7100
cd /repo && uv run conductor --port 7200
cd /repo/apps/web && pnpm dev
```

## Tests

```bash
pnpm typecheck
pnpm build
pnpm exec playwright install chromium --with-deps  # once
pnpm exec playwright test
```

The Playwright suite (`tests/routes.spec.ts`) renders the primary routes
against a production build. The Conductor and MCP proxy are NOT running
during the test; each route exercises its empty/unreachable state.
