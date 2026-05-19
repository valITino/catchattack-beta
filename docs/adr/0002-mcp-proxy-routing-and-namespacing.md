# ADR-0002: MCP proxy routing, namespacing, and policy enforcement

- **Status:** Accepted (Phase 1)
- **Date:** 2026-05-13
- **Supersedes:** —

## Context

`BUILD_BRIEF_ADDENDUM.md` §A.3 mandates a single trust-boundary proxy in
front of every MCP server CatchAttack speaks to (in-house or vendor). Phase 0
shipped the proxy's policy engine and audit log as standalone components.
Phase 1 needs the actual MCP routing: a way for a Claude Desktop session, the
Conductor, or the web UI to talk to one endpoint and reach any upstream MCP
server through it, with policy enforced uniformly.

The decision space:

1. Write the MCP protocol forwarding from scratch on top of FastAPI.
2. Use the official `mcp` SDK's primitives to forward.
3. Use `fastmcp` v2's built-in mount/proxy facility.

## Decision

**Use `fastmcp.FastMCP.mount(...)` to compose upstream MCP servers under a
namespace prefix, and inject a `PolicyMiddleware` via `FastMCP.add_middleware`
that runs the existing `PolicyEngine` and `AuditLog` on every `tools/call`.**

Concretely:

- `mcp_proxy/router.py` builds a `FastMCP(name="catchattack-proxy")` server.
- For each non-stub upstream in `upstreams.yaml`, we build a fastmcp client
  transport (`StdioTransport` for `mode=stdio`, `StreamableHttpTransport`
  for `mode=http`/`real`/`mock`) and call
  `router.mount(FastMCP.as_proxy(transport), namespace=key)`.
- FastMCP namespaces mounted tools with the underscore convention
  (`sigma_lint_sigma`). The brief and policy config use the dotted form
  (`sigma.lint_sigma`); the middleware normalises one to the other at
  call time so the operator-facing config stays human-readable.
- The router's HTTP app (`router.http_app(path="/", transport="http",
  stateless_http=True)`) is mounted at `/mcp` inside the existing FastAPI
  app. The Phase 0 `/health` and `/policy/preview` HTTP endpoints continue
  to work unchanged.
- The router's lifespan is republished onto the FastAPI app so that
  subprocess upstreams (e.g. sigma-mcp via stdio) start and stop with the
  proxy process.

## Consequences

Positive:
- Zero hand-rolled MCP protocol code. fastmcp handles JSON-RPC parsing,
  capability negotiation, error envelopes, and SSE/stream-able-HTTP
  transports. We own only the policy/audit decisions.
- One process exposes both the FastAPI surface (health, policy preview) and
  the MCP surface (streamable-HTTP at `/mcp/`). One port to firewall, one
  audit log per call.
- Adding a new vendor MCP is a config change: append an entry to
  `upstreams.yaml`. No code changes needed unless the vendor speaks a
  non-supported transport.

Negative:
- Coupling to fastmcp 2.x's mount API. The `prefix=` parameter was deprecated
  in favour of `namespace=` while we were building this; we adopted the new
  API but a future breaking change in fastmcp would force a follow-up.
- The underscore-vs-dot translation in `PolicyMiddleware` is implicit. We
  documented it inline; tests cover both forms.

## Rejected alternatives

- *Hand-rolled forwarder on FastAPI.* Would replicate ~1500 LoC of MCP
  protocol handling that fastmcp already gets right.
- *Run the proxy as a pure FastMCP server with no FastAPI alongside.* We
  want the policy-preview HTTP endpoint for the eventual web UI's "would
  this call be allowed?" pre-check; mixing transports inside one fastmcp
  instance was uglier than mounting fastmcp inside FastAPI.
- *Per-upstream subprocess supervisors.* Adds an init system shape (PID
  files, restart policy) for no Phase 1 win. fastmcp's lifespan is
  sufficient for stdio.
