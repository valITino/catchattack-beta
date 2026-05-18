"""FastMCP mock for MITRE CALDERA.

Mirrors the surface of the CALDERA MCP plugin (github.com/mitre/mcp)
running inside Caldera 5.x: ability catalogue, adversary operations, and
the operation planner. `create_operation` and `run_ability` execute
adversary emulation, so they default to dry_run=true and the proxy
enforces approval-token policy.

References:
- CALDERA REST API (v2, port 8888):
  https://caldera.readthedocs.io/en/latest/The-REST-API.html

Run:
    caldera-mock                          # stdio
    caldera-mock --transport http --port 9110
"""

from __future__ import annotations

import argparse
import uuid
from typing import Any

from fastmcp import FastMCP
from pydantic import BaseModel, ConfigDict, Field

from . import __version__


class Ability(BaseModel):
    model_config = ConfigDict(extra="forbid")

    ability_id: str
    name: str
    tactic: str
    technique_id: str
    technique_name: str
    platforms: list[str] = Field(default_factory=list)


class Operation(BaseModel):
    model_config = ConfigDict(extra="forbid")

    operation_id: str
    name: str
    adversary: str
    state: str = Field(description="running|paused|finished|planned")
    abilities_run: int


class CreateOperationResult(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str
    dry_run: bool
    created: bool
    operation_id: str | None
    rendered_plan: dict[str, object]


class RunAbilityResult(BaseModel):
    model_config = ConfigDict(extra="forbid")

    ability_id: str
    dry_run: bool
    executed: bool
    link_id: str | None
    technique_id: str


_ABILITIES: list[Ability] = [
    Ability(
        ability_id="bd527b63-9f9e-46e0-9816-b8434d2b8989",
        name="WMI Process Creation",
        tactic="execution",
        technique_id="T1047",
        technique_name="Windows Management Instrumentation",
        platforms=["windows"],
    ),
    Ability(
        ability_id="c1cd6388-3ced-48c7-a511-0434c6ba8f48",
        name="PowerShell Encoded Command",
        tactic="execution",
        technique_id="T1059.001",
        technique_name="PowerShell",
        platforms=["windows"],
    ),
    Ability(
        ability_id="43b3754c-def4-4699-a673-1d85648fda6a",
        name="Find files",
        tactic="collection",
        technique_id="T1005",
        technique_name="Data from Local System",
        platforms=["windows", "linux", "darwin"],
    ),
    Ability(
        ability_id="90c2efaa-8205-480d-8bb6-61d90dbaf81b",
        name="Discover local network configuration",
        tactic="discovery",
        technique_id="T1016",
        technique_name="System Network Configuration Discovery",
        platforms=["windows", "linux", "darwin"],
    ),
    Ability(
        ability_id="4e97e699-93d7-4040-b5a3-2e906a58199e",
        name="Curl download payload",
        tactic="command-and-control",
        technique_id="T1105",
        technique_name="Ingress Tool Transfer",
        platforms=["linux", "darwin"],
    ),
]


def build_server() -> FastMCP:
    mcp: FastMCP = FastMCP(
        name="catchattack-caldera-mock",
        instructions=(
            "MOCK MITRE CALDERA MCP. Synthetic data. create_operation and "
            "run_ability execute adversary emulation and default to "
            "dry_run=true; the proxy enforces approval-token policy."
        ),
    )
    # Grows only on real (dry_run=false) create_operation calls; bounded in
    # practice by the approval-gated demo lifetime of the mock process.
    operations: dict[str, Operation] = {}

    @mcp.tool(
        name="list_abilities",
        description=(
            "List CALDERA abilities, optionally filtered by tactic or ATT&CK technique id."
        ),
    )
    def list_abilities_tool(
        tactic: str | None = None, technique_id: str | None = None
    ) -> dict[str, Any]:
        out = _ABILITIES
        if tactic:
            out = [a for a in out if a.tactic == tactic]
        if technique_id:
            out = [a for a in out if a.technique_id == technique_id]
        return {"total": len(out), "items": [a.model_dump(mode="json") for a in out]}

    @mcp.tool(name="list_operations", description="List adversary operations.")
    def list_operations_tool() -> dict[str, Any]:
        return {
            "total": len(operations),
            "items": [o.model_dump(mode="json") for o in operations.values()],
        }

    @mcp.tool(
        name="create_operation",
        description=(
            "Create a CALDERA adversary operation. dry_run=true returns the "
            "rendered operation plan without scheduling it."
        ),
    )
    def create_operation_tool(
        name: str,
        adversary: str,
        ability_ids: list[str] | None = None,
        dry_run: bool = True,
    ) -> dict[str, Any]:
        plan: dict[str, object] = {
            "name": name,
            "adversary": adversary,
            "abilities": ability_ids or [a.ability_id for a in _ABILITIES[:3]],
            "planner": "atomic",
            "auto_close": True,
        }
        op_id: str | None = None
        if not dry_run:
            op_id = str(uuid.uuid4())
            operations[op_id] = Operation(
                operation_id=op_id,
                name=name,
                adversary=adversary,
                state="running",
                abilities_run=0,
            )
        return CreateOperationResult(
            name=name,
            dry_run=dry_run,
            created=not dry_run,
            operation_id=op_id,
            rendered_plan=plan,
        ).model_dump(mode="json")

    @mcp.tool(
        name="run_ability",
        description=(
            "Run a single CALDERA ability on the operation's agents. "
            "dry_run=true previews the link without executing."
        ),
    )
    def run_ability_tool(ability_id: str, dry_run: bool = True) -> dict[str, Any]:
        ability = next((a for a in _ABILITIES if a.ability_id == ability_id), None)
        if ability is None:
            return {"error": "unknown_ability", "detail": ability_id}
        return RunAbilityResult(
            ability_id=ability_id,
            dry_run=dry_run,
            executed=not dry_run,
            link_id=None if dry_run else str(uuid.uuid4()),
            technique_id=ability.technique_id,
        ).model_dump(mode="json")

    return mcp


def main() -> None:
    parser = argparse.ArgumentParser(prog="caldera-mock")
    parser.add_argument("--transport", choices=("stdio", "http"), default="stdio")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=9110)
    parser.add_argument("--version", action="version", version=__version__)
    args = parser.parse_args()
    server = build_server()
    if args.transport == "stdio":
        server.run(transport="stdio")
    else:
        server.run(transport="http", host=args.host, port=args.port)


if __name__ == "__main__":
    main()
