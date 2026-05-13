# mcp-proxy/

The mandatory MCP trust boundary (addendum §A.3).

The Conductor and the web UI **never** speak to vendor MCP servers directly.
Every tool call goes through this proxy, which enforces:

1. **Namespacing.** Upstream tools are exposed as `<vendor>.<tool>`
   (e.g. `splunk.run_search`, `falcon.search_detections`,
   `sentinel.triage.list_incidents`).
2. **Dry-run enforcement.** Tools matching the configured
   `destructive_tools` allowlist require `dry_run=true` **unless** the request
   carries a valid `X-CatchAttack-Approval-Token`.
3. **Target allowlist.** For destructive tools, the target identifier
   (`agent_id`, `index`, `host_id`, …) must be in a `lab=true` allowlist
   unless an approval token is supplied.
4. **Audit log.** Every call written as a JSONL line:
   `{ts, caller, tool, params_redacted, result_hash, latency_ms, dry_run, approval_token_id}`.
5. **Rate limit + circuit breaker** per upstream.
6. **Tenant scoping** (forward-looking — single-tenant default in Phase 0).

## Status

Phase 0: skeleton with namespacing + audit log + dry-run + approval-token
checks. Routes to no upstreams yet.

Phase 1: routes to `sigma` (in-house). Conductor and Claude Desktop both speak
to the proxy.

Phases 2+: each new vendor MCP added by registering it in `upstreams.yaml`.

## Approval-token flow

| Mode | Source of token |
|---|---|
| Phase 0–4 (env stub) | `CATCHATTACK_APPROVAL_TOKEN` env var. Operator pastes it into the calling host's request header to authorise a non-dry-run call. |
| Phase 5+ (UI button) | Web UI issues short-lived signed tokens via the PR-queue "Approve" button. |

Tokens are opaque to the LLM; only the human-controlled caller supplies them.

## Auth mode

The proxy itself runs unauthenticated on `localhost` in dev. Production
deployment fronts it with the web app's auth layer (Auth.js OIDC).
`AUTH_MODE` env var controls behaviour:

- `dev` (default): no auth, single dev tenant, dev operator identity.
- `github`: GitHub OIDC required (production).
- `email`: magic-link email (off by default; requires SMTP).

## Run

```
cd mcp-proxy
uv sync
uv run uvicorn mcp_proxy.app:app --port 7100
```

(Full implementation lands in Phase 1; Phase 0 ships the config loader,
audit log, and the policy engine with passthrough tests.)
