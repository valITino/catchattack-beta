# packages/schemas

JSON Schema files (draft 2020-12). Source of truth for cross-language data
contracts.

- `capture_bundle.schema.json` — Capture Bundle manifest (addendum §E.1).

MCP tool input schemas are **not** stored here — each MCP server defines them
inline as pydantic v2 models in its own `models.py`.

A code-generation step (pydantic models for Python, `.d.ts` for `apps/web/`)
is planned but not yet wired; for now the schema files are consumed by hand.
