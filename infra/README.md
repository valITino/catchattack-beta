# infra/

Local-dev infrastructure.

- `compose.yaml` — the local dev stack. Services:
  - `wazuh-indexer` — OpenSearch-compatible alert store (`:9200`)
  - `wazuh-manager` — Wazuh manager REST API (`:55000`)
  - `mcp-proxy` — the trust-boundary proxy, built from `Dockerfile.proxy` (`:7100`)
  - `minio` — S3-compatible object storage for capture bundles (`:9000`, console `:9001`)
  - `livekit` — LiveKit SFU for live emulation streaming (`:7880`)
  - `livekit-egress` — records the LiveKit room to HLS in MinIO
  - `splunk` — optional; behind the `splunk` compose profile (accepts the EULA)
- `Dockerfile.proxy` — container image for the MCP proxy.
- `livekit.yaml` — LiveKit SFU dev configuration.
- `egress.yaml` — LiveKit Egress (HLS recording) configuration.

## Quick start

```bash
make dev                              # docker compose -f infra/compose.yaml up
# include the optional Splunk service:
docker compose -f infra/compose.yaml --profile splunk up
```

Notes:
- Wazuh certs are self-signed in dev; the in-house Wazuh MCP sets `verify_tls=false`.
- Dev credentials are sourced from `.env` (see `.env.example`); compose
  falls back to baked-in defaults when a variable is unset.
