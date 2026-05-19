"""FastMCP server for Stratus Red Team — cloud TTP emulation.

Tools:
- list_techniques(platform?)            — read-only
- get_status(technique_id)              — read-only
- detonate(technique_id, dry_run=true)  — destructive
- revert(technique_id, dry_run=true)    — destructive
- cleanup(technique_id, dry_run=true)   — destructive

`detonate`, `revert`, and `cleanup` mutate live cloud infrastructure, so
they default to dry_run=true. The MCP proxy layers approval-token
enforcement on top — a real detonation needs dry_run=false AND the
operator's approval token.
"""

from __future__ import annotations

import argparse
import os
from typing import Any

from fastmcp import FastMCP

from . import __version__
from .models import CleanupResult, DetonateResult, RevertResult, StatusReport
from .runner import (
    CLIStratusRunner,
    InMemoryStratusRunner,
    StratusRunner,
    UnknownTechniqueError,
)


def build_server(runner: StratusRunner) -> FastMCP:
    mcp: FastMCP = FastMCP(
        name="catchattack-stratus",
        instructions=(
            "Stratus Red Team — cloud attack-technique emulation for AWS, "
            "Azure, GCP, and Kubernetes. detonate/revert/cleanup mutate live "
            "cloud infrastructure and default to dry_run=true; the proxy "
            "enforces approval-token policy for real execution."
        ),
    )

    @mcp.tool(
        name="list_techniques",
        description=(
            "List Stratus Red Team techniques, optionally filtered by cloud "
            "platform (aws|azure|gcp|kubernetes|entra-id|eks). Includes each "
            "technique's ATT&CK mapping and lifecycle state."
        ),
    )
    def list_techniques_tool(platform: str | None = None) -> dict[str, Any]:
        items = runner.list_techniques(platform)
        return {
            "items": [t.model_dump(mode="json") for t in items],
            "total": len(items),
        }

    @mcp.tool(
        name="get_status",
        description=(
            "Return a technique's lifecycle state: COLD (no infra), WARM "
            "(infra provisioned), or DETONATED (attack executed)."
        ),
    )
    def get_status_tool(technique_id: str) -> dict[str, Any]:
        try:
            state = runner.status(technique_id)
        except UnknownTechniqueError as exc:
            return {"error": "unknown_technique", "detail": str(exc)}
        return StatusReport(technique_id=technique_id, state=state).model_dump(mode="json")

    @mcp.tool(
        name="detonate",
        description=(
            "Detonate a Stratus technique against live cloud infra. "
            "dry_run=true returns the plan without provisioning or "
            "executing anything. Real detonation requires dry_run=false."
        ),
    )
    def detonate_tool(technique_id: str, dry_run: bool = True) -> dict[str, Any]:
        try:
            current = runner.status(technique_id)
        except UnknownTechniqueError as exc:
            return {"error": "unknown_technique", "detail": str(exc)}
        if dry_run:
            return DetonateResult(
                technique_id=technique_id,
                dry_run=True,
                detonated=False,
                state=current,
                output=f"[dry-run] would detonate {technique_id}",
            ).model_dump(mode="json")
        state, output = runner.detonate(technique_id)
        return DetonateResult(
            technique_id=technique_id,
            dry_run=False,
            detonated=True,
            state=state,
            output=output,
        ).model_dump(mode="json")

    @mcp.tool(
        name="revert",
        description=(
            "Revert a detonated technique — undoes the attack but keeps the "
            "infrastructure WARM for re-detonation. dry_run=true previews."
        ),
    )
    def revert_tool(technique_id: str, dry_run: bool = True) -> dict[str, Any]:
        try:
            current = runner.status(technique_id)
        except UnknownTechniqueError as exc:
            return {"error": "unknown_technique", "detail": str(exc)}
        if dry_run:
            return RevertResult(
                technique_id=technique_id,
                reverted=False,
                state=current,
                output=f"[dry-run] would revert {technique_id}",
            ).model_dump(mode="json")
        state, output = runner.revert(technique_id)
        return RevertResult(
            technique_id=technique_id,
            reverted=True,
            state=state,
            output=output,
        ).model_dump(mode="json")

    @mcp.tool(
        name="cleanup",
        description=(
            "Destroy a technique's provisioned cloud infrastructure "
            "(WARM/DETONATED → COLD). dry_run=true previews."
        ),
    )
    def cleanup_tool(technique_id: str, dry_run: bool = True) -> dict[str, Any]:
        try:
            current = runner.status(technique_id)
        except UnknownTechniqueError as exc:
            return {"error": "unknown_technique", "detail": str(exc)}
        if dry_run:
            return CleanupResult(
                technique_id=technique_id,
                cleaned=False,
                state=current,
                output=f"[dry-run] would destroy infrastructure for {technique_id}",
            ).model_dump(mode="json")
        state, output = runner.cleanup(technique_id)
        return CleanupResult(
            technique_id=technique_id,
            cleaned=True,
            state=state,
            output=output,
        ).model_dump(mode="json")

    return mcp


def main() -> None:
    parser = argparse.ArgumentParser(prog="stratus-mcp")
    parser.add_argument("--transport", choices=("stdio", "http"), default="stdio")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=9105)
    parser.add_argument(
        "--mode",
        choices=("memory", "cli"),
        default=os.environ.get("STRATUS_MODE", "memory"),
        help="memory (offline, default) | cli (shells out to the stratus binary).",
    )
    parser.add_argument("--version", action="version", version=__version__)
    args = parser.parse_args()

    runner: StratusRunner = (
        CLIStratusRunner() if args.mode == "cli" else InMemoryStratusRunner.seeded()
    )
    server = build_server(runner)
    if args.transport == "stdio":
        server.run(transport="stdio")
    else:
        server.run(transport="http", host=args.host, port=args.port)


if __name__ == "__main__":
    main()
