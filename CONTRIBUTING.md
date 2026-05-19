# Contributing to CatchAttack

Thanks for contributing. This document covers the workflow, tooling, and
standards for the CatchAttack v2 tree. Work in `legacy/` is frozen — see
[`docs/adr/0001-quarantine-legacy-and-monorepo-layout.md`](docs/adr/0001-quarantine-legacy-and-monorepo-layout.md).

## Getting started

1. Clone the repository.
2. Install prerequisites: `uv`, `pnpm`, `make`, Go 1.25+, Docker.
3. Install workspaces: `make install`.
4. Confirm a clean baseline: `make verify`.
5. Create a feature branch off `main`.

## Development process

### Branching

Development happens on short-lived feature branches cut from `main`; `main`
is the integration branch and stays releasable. There is no long-lived
`develop` branch. Name branches with a prefix that matches the change:

- `feature/` — new functionality
- `fix/` — bug fixes
- `refactor/` — restructuring without behaviour change
- `docs/` — documentation only

### Commit messages

- Imperative mood, present tense ("Add X", not "Added X").
- First line ≤ 72 characters; blank line; body explaining the *why*.
- Reference issues/PRs in the body.

### Pull requests

1. Rebase your branch on the latest `main`.
2. Run `make verify` locally — it must pass.
3. Open the PR against `main` and describe the change and its test plan.
4. Address review feedback.

## Coding standards

The monorepo spans three languages. Each has a pinned toolchain; `make fmt`
applies formatters and `make verify` enforces them.

| Area | Format + lint | Type check | Tests |
|---|---|---|---|
| Python 3.12 (`mcp/`, `mcp-proxy/`, `apps/conductor/`) | `ruff` | `mypy --strict` | `pytest` |
| TypeScript (`apps/web/`) | `biome` | `tsc` (`pnpm typecheck`) | Playwright |
| Go 1.25 (`agent/`) | `gofmt` / `golangci-lint` | — | `go test` |

Guidelines:

- Pydantic models use `ConfigDict(extra="forbid")`.
- Keep functions small and names meaningful; avoid `any`/`Any` where a
  concrete type fits.
- Match existing patterns in the file you are editing.
- Comment the non-obvious *why*, not the *what*.

## Testing

`make test` runs every suite; `make verify` adds install + lint + type
checks. Per-language entry points:

- `make test-py` — runs `pytest` **inside each package directory**. Run it
  this way (not bare `pytest` from the repo root): the local `mcp/`
  directory would otherwise shadow the installed `mcp` SDK on `sys.path`.
- `make test-go` — `go test ./...` in `agent/`.
- `make test-ts` — `apps/web` typecheck, production build, and Playwright.

New features and bug fixes should ship with tests.

## Documentation

- Update the affected component `README.md` and the root `README.md`.
- Record non-obvious decisions as a new ADR under `docs/adr/`.
- Keep code examples and commands in docs runnable.

## Issue reporting

1. Search existing issues first.
2. Include reproduction steps and environment details.
3. Attach logs, screenshots, or minimal examples where useful.
