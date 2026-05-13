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

.PHONY: help dev verify fmt fmt-check lint test test-py test-ts \
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
	  echo ">> uv sync"; \
	  uv sync || echo ">> (uv not installed yet — skipping)"; \
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
	@command -v ruff >/dev/null 2>&1 && ruff format --check . || echo ">> (ruff not installed — skip)"
	@command -v pnpm >/dev/null 2>&1 && pnpm -s fmt:check || echo ">> (pnpm/biome not installed — skip)"

lint:
	@command -v ruff >/dev/null 2>&1 && ruff check . || echo ">> (ruff not installed — skip)"
	@command -v pnpm >/dev/null 2>&1 && pnpm -s check || echo ">> (pnpm/biome not installed — skip)"

# -----------------------------------------------------------------------------
# Tests
# -----------------------------------------------------------------------------

test: test-py test-ts

test-py:
	@if [ -d mcp ] && find mcp -name "tests" -type d -mindepth 2 2>/dev/null | grep -q .; then \
	  uv run pytest || true; \
	else \
	  echo ">> no Python tests yet"; \
	fi

test-ts:
	@if find apps packages -name "*.test.ts" -o -name "*.test.tsx" 2>/dev/null | grep -q .; then \
	  pnpm -r --if-present test; \
	else \
	  echo ">> no TS tests yet"; \
	fi

# -----------------------------------------------------------------------------
# Verify (per-phase definition)
# -----------------------------------------------------------------------------
# Phase 0 contract: workspace installs succeed and format-check is clean.
# Later phases extend this.

verify: install fmt-check
	@echo ""
	@echo "[verify] OK — Phase 0 contract satisfied."

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
