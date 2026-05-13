# packages/schemas

JSON Schema files (draft 2020-12). Source of truth for cross-language data
contracts.

- `capture_bundle.schema.json` — Capture Bundle manifest (addendum §E.1). Added in Phase 3.
- MCP tool input schemas are co-located with each MCP server under `mcp/<name>/schemas/`.

Build step (Phase 0 placeholder; wired up in Phase 1):
- Python: `datamodel-code-generator` emits pydantic v2 models.
- TS: `json-schema-to-typescript` emits `.d.ts` consumed by `apps/web/`.
