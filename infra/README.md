# infra/

Local-dev and production infrastructure.

- `compose.yaml` — Local-dev stack (Postgres 16, Redis 7, MinIO, MCP proxy,
  Wazuh/Splunk for Phase 2, LiveKit for Phase 6). Wired up incrementally
  across phases.
- `terraform/` — Production infra (later phases).

Local-dev quick-start (Phase 0): nothing runs yet; `make dev` will become
`docker compose -f infra/compose.yaml up` once Phase 1 lands.
