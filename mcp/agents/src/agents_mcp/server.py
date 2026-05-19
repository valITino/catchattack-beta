"""FastMCP server: bridge between the proxy and the Go agent fleet.

Tools (per BUILD_BRIEF.md Phase 3):
- list_agents
- get_inventory(agent_id)
- run_atomic(agent_id, technique, test_number, dry_run=true)
- start_capture(agent_id, capture_id)
- stop_capture(capture_id)

All `agent_id`-targeting tools require the id to be in the proxy's
`agents.run_atomic` / `agents.start_capture` allowlist (tagged `lab=true`)
unless the operator supplies an approval token. The proxy enforces this; the
bridge itself does NOT re-check — it would be a layering violation.
"""

from __future__ import annotations

import argparse
import os
import uuid
from typing import Any

from fastmcp import FastMCP

from . import __version__
from .transport import AgentTransport, GRPCAgentTransport, InMemoryAgentTransport


def build_server(transport: AgentTransport) -> FastMCP:
    mcp: FastMCP = FastMCP(
        name="catchattack-agents",
        instructions=(
            "Bridge to the Go endpoint-agent fleet. Read-only tools are free; "
            "run_atomic / start_capture / stop_capture default to dry_run=true "
            "and require an approval token via the proxy for real execution."
        ),
    )

    @mcp.tool(
        name="list_agents",
        description="List connected agents with status, hostname, OS, and tags.",
    )
    def list_agents_tool() -> dict[str, Any]:
        items = [a.model_dump(mode="json") for a in transport.list_agents()]
        return {"items": items}

    @mcp.tool(
        name="get_inventory",
        description="Return the agent's last collected inventory snapshot.",
    )
    def get_inventory_tool(agent_id: str) -> dict[str, Any]:
        try:
            return transport.get_inventory(agent_id).model_dump(mode="json")
        except KeyError as exc:
            return {"error": "unknown_agent", "detail": str(exc)}

    @mcp.tool(
        name="run_atomic",
        description=(
            "Execute an Atomic Red Team test on the agent. dry_run=true returns "
            "the receipt without actually executing the test."
        ),
    )
    def run_atomic_tool(
        agent_id: str,
        technique: str,
        test_number: int,
        dry_run: bool = True,
    ) -> dict[str, Any]:
        try:
            return transport.run_atomic(
                agent_id, technique, test_number, dry_run=dry_run
            ).model_dump(mode="json")
        except KeyError as exc:
            return {"error": "unknown_agent", "detail": str(exc)}

    @mcp.tool(
        name="start_capture",
        description=(
            "Start a capture session on the agent. Returns the CaptureHandle "
            "with a server-issued capture_id (UUIDv4 for Phase 3)."
        ),
    )
    def start_capture_tool(
        agent_id: str,
        capture_id: str | None = None,
    ) -> dict[str, Any]:
        cap_id = capture_id or str(uuid.uuid4())
        try:
            return transport.start_capture(agent_id, cap_id).model_dump(mode="json")
        except KeyError as exc:
            return {"error": "unknown_agent", "detail": str(exc)}

    @mcp.tool(
        name="stop_capture",
        description=(
            "Stop a running capture and return the bundle summary. The full "
            "CaptureBundle manifest lives in mcp/evidence."
        ),
    )
    def stop_capture_tool(capture_id: str) -> dict[str, Any]:
        try:
            return transport.stop_capture(capture_id).model_dump(mode="json")
        except KeyError as exc:
            return {"error": "unknown_capture", "detail": str(exc)}

    return mcp


def main() -> None:
    parser = argparse.ArgumentParser(prog="agents-mcp")
    parser.add_argument("--transport", choices=("stdio", "http"), default="stdio")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=9103)
    parser.add_argument(
        "--mode",
        choices=("memory", "grpc"),
        default=os.environ.get("AGENTS_TRANSPORT", "memory"),
        help="memory (Phase 3 default) | grpc (Phase 4+).",
    )
    parser.add_argument(
        "--grpc-bind",
        default=os.environ.get("AGENTS_GRPC_BIND", "127.0.0.1:50051"),
        help="gRPC bind address when --mode=grpc.",
    )
    parser.add_argument("--version", action="version", version=__version__)
    args = parser.parse_args()

    transport: AgentTransport
    if args.mode == "grpc":
        transport = GRPCAgentTransport(bind_addr=args.grpc_bind)
    else:
        transport = InMemoryAgentTransport.with_seed()

    server = build_server(transport)
    if args.transport == "stdio":
        server.run(transport="stdio")
    else:
        server.run(transport="http", host=args.host, port=args.port)


if __name__ == "__main__":
    main()
