"""MCP client wrapper.

Thin async facade over `fastmcp.Client` that:
- Translates the brief's dotted tool naming (`splunk.deploy_rule`) into the
  underscored form the proxy actually exposes (`splunk_deploy_rule`).
- Normalises tool results into plain dicts so workflow code is not coupled
  to fastmcp's response object shapes.
- Provides a Protocol for tests to inject an in-memory fake.

Workflows depend on `MCPClient` only.
"""

from __future__ import annotations

import json
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Any, Protocol

from fastmcp import Client


class MCPClient(Protocol):
    """Surface used by the Conductor's workflows."""

    async def call(self, dotted_tool: str, params: dict[str, Any]) -> dict[str, Any]: ...


def _to_underscore(dotted: str) -> str:
    """`splunk.deploy_rule` → `splunk_deploy_rule`. fastmcp namespaces with `_`."""
    return dotted.replace(".", "_", 1) if "." in dotted else dotted


def _payload(result: object) -> dict[str, Any]:
    structured = getattr(result, "structured_content", None)
    if structured:
        return structured  # type: ignore[no-any-return]
    data = getattr(result, "data", None)
    if data is not None:
        if hasattr(data, "model_dump"):
            return data.model_dump(mode="json")  # type: ignore[no-any-return]
        if isinstance(data, dict):
            return data
    content = getattr(result, "content", None)
    if content:
        text = getattr(content[0], "text", None)
        if text:
            return json.loads(text)  # type: ignore[no-any-return]
    raise RuntimeError(f"unable to extract payload from MCP result: {result!r}")


class FastMCPClient:
    """Production MCP client. Backed by `fastmcp.Client`.

    The transport target is anything `fastmcp.Client(...)` accepts: a URL for
    the proxy's `/mcp` endpoint, a local FastMCP instance (for in-process
    tests), or an `MCPConfig` dict.
    """

    def __init__(self, transport: Any) -> None:
        self._transport = transport

    @asynccontextmanager
    async def session(self) -> AsyncIterator[None]:
        async with Client(self._transport) as client:
            self._client = client
            try:
                yield
            finally:
                self._client = None

    async def call(self, dotted_tool: str, params: dict[str, Any]) -> dict[str, Any]:
        client = getattr(self, "_client", None)
        if client is None:
            # Allow one-shot use without an outer session().
            async with Client(self._transport) as one_off:
                result = await one_off.call_tool(_to_underscore(dotted_tool), params)
                return _payload(result)
        result = await client.call_tool(_to_underscore(dotted_tool), params)
        return _payload(result)


class StaticMCPClient:
    """Deterministic test client. Maps `(dotted_tool, params_subset)` → result.

    Workflows in tests register the calls they expect with `respond_to`. Any
    unregistered call raises so tests fail loudly.
    """

    def __init__(self) -> None:
        self._handlers: list[tuple[str, dict[str, Any], dict[str, Any] | Exception]] = []
        self._calls: list[tuple[str, dict[str, Any]]] = []

    def respond_to(
        self,
        dotted_tool: str,
        params_subset: dict[str, Any] | None = None,
        *,
        result: dict[str, Any] | None = None,
        error: Exception | None = None,
    ) -> None:
        if result is None and error is None:
            raise ValueError("respond_to requires either result or error")
        self._handlers.append(
            (
                dotted_tool,
                params_subset or {},
                error if error is not None else result or {},
            )
        )

    async def call(self, dotted_tool: str, params: dict[str, Any]) -> dict[str, Any]:
        self._calls.append((dotted_tool, params))
        for tool, subset, response in self._handlers:
            if tool != dotted_tool:
                continue
            if all(params.get(k) == v for k, v in subset.items()):
                if isinstance(response, Exception):
                    raise response
                return response
        raise AssertionError(
            f"no handler for {dotted_tool}({params}); register one with respond_to()"
        )

    @property
    def calls(self) -> list[tuple[str, dict[str, Any]]]:
        return list(self._calls)
