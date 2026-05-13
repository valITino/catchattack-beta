"""MCP router — fans out namespaced tool calls to upstream MCP servers.

Phase 1 wires:
- A FastMCP server (`router_server`) that mounts each configured upstream
  under its namespace (e.g. tools from the `sigma` upstream become
  `sigma_<tool>` after fastmcp's prefix mapping).
- A `PolicyMiddleware` that consults the PolicyEngine before forwarding any
  tool call, denying with a structured error if policy would be violated,
  and appending an audit record either way.

Upstream transports supported in Phase 1:
- `stdio` — spawn a subprocess running another MCP server (e.g. sigma-mcp).
- `http`  — connect to a running MCP server over streamable-http.
- `stub`  — register no upstream (placeholder for phases that don't yet run).
"""

from __future__ import annotations

import time
from typing import Any

from fastmcp import FastMCP
from fastmcp.client.transports import StdioTransport, StreamableHttpTransport
from fastmcp.server.middleware import CallNext, Middleware, MiddlewareContext

from .audit import AuditLog
from .config import ProxyConfig, Upstream
from .policy import PolicyEngine


class PolicyMiddleware(Middleware):
    """Apply the PolicyEngine to every inbound tool call.

    Reads the approval token from the MCP request meta (operators set it via
    their host-side configuration) and turns policy denials into structured
    tool errors rather than transport exceptions.

    FastMCP namespaces mounted tools with `<namespace>_<tool>` (underscore).
    Our policy config uses `<namespace>.<tool>` (dotted) because that matches
    the BUILD_BRIEF.md addendum's naming convention. The middleware
    translates underscored → dotted before evaluating policy and recording
    audit entries, using `namespaces` to disambiguate which prefix is which.
    """

    def __init__(
        self,
        engine: PolicyEngine,
        audit: AuditLog,
        namespaces: set[str],
    ) -> None:
        super().__init__()
        self._engine = engine
        self._audit = audit
        # Longest first so 'sentinel_triage' wins over 'sentinel'.
        self._namespaces = sorted(namespaces, key=len, reverse=True)

    def _normalise(self, raw_tool_name: str) -> str:
        for ns in self._namespaces:
            prefix = f"{ns}_"
            if raw_tool_name.startswith(prefix):
                return f"{ns}.{raw_tool_name[len(prefix) :]}"
        return raw_tool_name

    async def on_call_tool(
        self,
        context: MiddlewareContext[Any],
        call_next: CallNext[Any, Any],
    ) -> Any:
        message = context.message
        raw_name = getattr(message, "name", "<unknown>")
        tool_name = self._normalise(raw_name)
        params = dict(getattr(message, "arguments", {}) or {})

        approval = self._extract_approval(message)
        decision = self._engine.evaluate(tool=tool_name, params=params, approval_header=approval)

        start = time.perf_counter()
        if not decision.allowed:
            self._audit.record(
                caller=self._caller_id(context),
                tool=tool_name,
                params=params,
                result={"denied": decision.reason},
                latency_ms=int((time.perf_counter() - start) * 1000),
                dry_run=bool(params.get("dry_run", False)),
                approval_token_id="present" if approval else None,
                decision=decision.reason,
            )
            raise PermissionError(f"proxy_denied: {decision.reason}")

        # If the policy is enforcing dry-run, ensure params reflect it before
        # the call is forwarded. Upstream servers that ignore the flag remain
        # safe because the proxy already checked the target allowlist.
        if decision.dry_run_enforced and "dry_run" not in params:
            params["dry_run"] = True
            message.arguments = params

        try:
            result = await call_next(context)
        finally:
            self._audit.record(
                caller=self._caller_id(context),
                tool=tool_name,
                params=params,
                result={"forwarded": True},
                latency_ms=int((time.perf_counter() - start) * 1000),
                dry_run=bool(params.get("dry_run", False)) or decision.dry_run_enforced,
                approval_token_id="present" if approval else None,
                decision=decision.reason,
            )
        return result

    @staticmethod
    def _extract_approval(message: Any) -> str | None:
        meta = getattr(message, "meta", None) or {}
        if isinstance(meta, dict):
            value = meta.get("approval_token")
            if isinstance(value, str):
                return value
        return None

    @staticmethod
    def _caller_id(context: MiddlewareContext[Any]) -> str:
        src = getattr(context, "source", None)
        if src is not None:
            return str(src)
        return "unknown"


def _make_transport(upstream: Upstream) -> StdioTransport | StreamableHttpTransport | None:
    """Build a fastmcp client transport for the given upstream config.

    Returns None for `stub` mode so the router can simply skip registration.
    """
    mode = upstream.mode
    if mode == "stub":
        return None
    if mode in ("stdio",):
        if not upstream.real_cmd:
            raise ValueError(f"upstream {upstream!r} in stdio mode requires real_cmd")
        parts = upstream.real_cmd.split()
        return StdioTransport(command=parts[0], args=parts[1:])
    if mode in ("http", "real"):
        url = upstream.real_url
        if not url:
            raise ValueError(f"upstream {upstream!r} in http/real mode requires real_url")
        return StreamableHttpTransport(url=url)
    if mode == "mock":
        url = upstream.mock_url
        if not url:
            raise ValueError(f"upstream {upstream!r} in mock mode requires mock_url")
        return StreamableHttpTransport(url=url)
    raise ValueError(f"unknown upstream mode: {mode!r}")


def build_router(
    config: ProxyConfig,
    engine: PolicyEngine,
    audit: AuditLog,
) -> FastMCP:
    """Build the FastMCP router with all non-stub upstreams mounted."""
    router: FastMCP = FastMCP(
        name="catchattack-proxy",
        instructions=(
            "Namespaced router fronting the CatchAttack MCP fleet. Every tool "
            "call is policy-checked (dry-run, target allowlist, approval) and "
            "audited before being forwarded to the upstream server."
        ),
    )
    router.add_middleware(PolicyMiddleware(engine, audit, namespaces=set(config.upstreams.keys())))

    for namespace, upstream in config.upstreams.items():
        transport = _make_transport(upstream)
        if transport is None:
            continue
        upstream_proxy = FastMCP.as_proxy(transport, name=f"catchattack-proxy:{namespace}")
        # FastMCP joins names with `_`: tool `lint_sigma` mounted under
        # namespace `sigma` becomes `sigma_lint_sigma`. The policy middleware
        # translates back to the dotted form on inspection.
        router.mount(upstream_proxy, namespace=namespace)
    return router
