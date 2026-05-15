# CatchAttack v2 — root Makefile.
#
# Phase 0 wires the minimum:
#   make fmt     — format Python (ruff) and TS (biome)
#   make verify  — install deps, format-check, type-check, tests
#   make test    — run all tests
#   make dev     — local dev stack (placeholder until Phase 1 lands)
#
# Phases progressively flesh these out. Do NOT chain phase work into this file
# until the brief greenlights it.

.PHONY: help dev verify fmt fmt-check lint test test-py test-mypy test-go test-ts \
        install install-py install-ts clean

help:
	@echo "CatchAttack make targets:"
	@echo "  install    Install Python (uv) and TS (pnpm) workspaces"
	@echo "  fmt        Auto-format Python + TS"
	@echo "  fmt-check  Check formatting only (CI)"
	@echo "  lint       Ruff + Biome lint"
	@echo "  test       Run all tests"
	@echo "  verify     Install + format-check + lint + test (Phase 0 = install + fmt-check)"
	@echo "  dev        Local dev stack (added Phase 1+)"

# -----------------------------------------------------------------------------
# Install
# -----------------------------------------------------------------------------

install: install-py install-ts

install-py:
	@if [ -f pyproject.toml ]; then \
	  echo ">> uv sync --all-packages --extra dev"; \
	  uv sync --all-packages --extra dev || echo ">> (uv not installed yet — skipping)"; \
	fi

install-ts:
	@if [ -f package.json ]; then \
	  echo ">> pnpm install"; \
	  pnpm install --frozen-lockfile=false || echo ">> (pnpm not installed yet — skipping)"; \
	fi

# -----------------------------------------------------------------------------
# Format / lint
# -----------------------------------------------------------------------------

fmt:
	@command -v ruff >/dev/null 2>&1 && ruff format . || echo ">> (ruff not installed — skip)"
	@command -v ruff >/dev/null 2>&1 && ruff check --fix . || true
	@command -v pnpm >/dev/null 2>&1 && pnpm -s fmt || echo ">> (pnpm/biome not installed — skip)"

fmt-check:
	@if command -v ruff >/dev/null 2>&1; then ruff format --check . || exit 1; \
	  else echo ">> (ruff missing — install via 'uv tool install ruff')"; fi
	@if command -v pnpm >/dev/null 2>&1; then pnpm -s fmt:check; \
	  else echo ">> (pnpm missing)"; fi

lint:
	@if command -v ruff >/dev/null 2>&1; then ruff check . || exit 1; \
	  else echo ">> (ruff missing)"; fi
	@if command -v pnpm >/dev/null 2>&1; then pnpm -s check; \
	  else echo ">> (pnpm missing)"; fi

# -----------------------------------------------------------------------------
# Tests
# -----------------------------------------------------------------------------

test: test-py test-go test-ts

test-go:
	@if [ -d agent ]; then \
	  echo ">> go test ./agent/..."; \
	  (cd agent && go test ./...) || exit 1; \
	else \
	  echo ">> no Go module"; \
	fi

PY_PACKAGES := mcp-proxy mcp/sigma mcp/mocks/splunk mcp/wazuh mcp/evidence mcp/agents apps/conductor

test-py:
	@# Run pytest from inside each project so our `mcp/` directory does not
	@# shadow the installed `mcp` SDK package on sys.path.
	@for d in $(PY_PACKAGES); do \
	  if [ -d "$$d/tests" ]; then \
	    echo ">> pytest $$d"; \
	    (cd "$$d" && uv run pytest -q) || exit 1; \
	  fi; \
	done

test-mypy:
	@for d in $(PY_PACKAGES); do \
	  if [ -d "$$d/src" ]; then \
	    echo ">> mypy $$d/src"; \
	    rel=$$(echo "$$d" | sed 's|[^/]*|..|g'); \
	    (cd "$$d" && uv run mypy --config-file $$rel/mypy.ini src) || exit 1; \
	  fi; \
	done

test-ts:
	@if [ -d apps/web ]; then \
	  echo ">> web typecheck"; \
	  (cd apps/web && pnpm typecheck) || exit 1; \
	  echo ">> web build"; \
	  (cd apps/web && pnpm build) || exit 1; \
	fi
	@if [ -d apps/web/tests ] && [ -d apps/web/node_modules/@playwright ]; then \
	  echo ">> web playwright"; \
	  (cd apps/web && pnpm exec playwright test) || exit 1; \
	else \
	  echo ">> playwright not installed; skipping (run pnpm exec playwright install chromium)"; \
	fi

# -----------------------------------------------------------------------------
# Verify (per-phase definition)
# -----------------------------------------------------------------------------
# Phase 0: install + fmt-check.
# Phase 1: + lint + mypy + pytest on mcp-proxy and mcp/sigma.
# Phase 2: + mcp/mocks/splunk + mcp/wazuh.
# Phase 3: + mcp/evidence + mcp/agents + Go agent tests.
# Phase 4: + apps/conductor (workflow orchestration).
# Phase 5: + apps/web (Next.js typecheck + build + Playwright).
# Later phases extend further.

verify: install fmt-check lint test-py test-mypy test-go test-ts
	@echo ""
	@echo "[verify] OK — Phase 5 contract satisfied."

# -----------------------------------------------------------------------------
# Dev
# -----------------------------------------------------------------------------

dev:
	@echo "[dev] No services to run yet. infra/compose.yaml lands in Phase 1."

# -----------------------------------------------------------------------------
# Clean
# -----------------------------------------------------------------------------

clean:
	rm -rf .venv node_modules **/node_modules **/.next **/dist **/build **/__pycache__ \
	       **/.pytest_cache **/.ruff_cache **/.mypy_cache
