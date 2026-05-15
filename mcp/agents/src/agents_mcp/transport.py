"""Agent-fleet transport abstraction.

Two implementations:

- `GRPCAgentTransport` — talks to live Go agents via the
  `catchattack.agent.v1.AgentBridge` service. Each agent maintains a long-
  lived `Connect` bidi stream; the bridge stores per-agent send queues and
  fans out commands.
- `InMemoryAgentTransport` — used in tests and the Phase 3 demo when no
  live agents are connected. Honours the same API.

Phase 3 ships the in-memory transport in full and the gRPC transport as a
NotYetImplemented skeleton (Phase 4 wires it up).
"""

from __future__ import annotations

import uuid
from collections.abc import Mapping
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any, Protocol

from .models import (
    AgentInfo,
    CaptureBundleSummary,
    CaptureHandle,
    Inventory,
    RunReceipt,
)


class AgentTransport(Protocol):
    """Surface the bridge MCP needs to expose its tools."""

    def list_agents(self) -> list[AgentInfo]: ...

    def get_inventory(self, agent_id: str) -> Inventory: ...

    def run_atomic(
        self, agent_id: str, technique: str, test_number: int, *, dry_run: bool
    ) -> RunReceipt: ...

    def start_capture(self, agent_id: str, capture_id: str) -> CaptureHandle: ...

    def stop_capture(self, capture_id: str) -> CaptureBundleSummary: ...


@dataclass
class _FakeCapture:
    capture_id: str
    agent_id: str
    started_at: datetime
    ended_at: datetime | None = None
    event_count: int = 0


@dataclass
class InMemoryAgentTransport:
    """Test/dev transport with no gRPC.

    Agents are seeded at construction time; commands move state in the
    fixture and return synthetic but realistic receipts.
    """

    agents: dict[str, AgentInfo] = field(default_factory=dict)
    inventories: dict[str, Inventory] = field(default_factory=dict)
    runs: dict[str, RunReceipt] = field(default_factory=dict)
    captures: dict[str, _FakeCapture] = field(default_factory=dict)

    @classmethod
    def with_seed(cls) -> InMemoryAgentTransport:
        """Build a transport pre-seeded with one Linux and one Windows lab agent."""
        now = datetime.now(tz=UTC)
        linux_id = "lab-linux-01"
        win_id = "lab-win-01"
        agents = {
            linux_id: AgentInfo(
                agent_id=linux_id,
                hostname="lab-linux-01",
                os="linux",
                arch="amd64",
                status="connected",
                last_seen=now,
                tags=["lab", "linux"],
            ),
            win_id: AgentInfo(
                agent_id=win_id,
                hostname="lab-win-01",
                os="windows",
                arch="amd64",
                status="connected",
                last_seen=now,
                tags=["lab", "windows"],
            ),
        }
        inventories = {
            linux_id: Inventory(
                agent_id=linux_id,
                hostname="lab-linux-01",
                os="linux",
                os_version="22.04",
                arch="amd64",
                ip_addresses=["10.0.0.11"],
                process_count=128,
                edr_detected=[],
                captured_at=now,
            ),
            win_id: Inventory(
                agent_id=win_id,
                hostname="lab-win-01",
                os="windows",
                os_version="10.0.19045",
                arch="amd64",
                ip_addresses=["10.0.0.12"],
                process_count=212,
                edr_detected=["WinDefend"],
                captured_at=now,
            ),
        }
        return cls(agents=agents, inventories=inventories)

    def list_agents(self) -> list[AgentInfo]:
        return list(self.agents.values())

    def get_inventory(self, agent_id: str) -> Inventory:
        if agent_id not in self.inventories:
            raise KeyError(f"unknown agent: {agent_id}")
        return self.inventories[agent_id]

    def run_atomic(
        self, agent_id: str, technique: str, test_number: int, *, dry_run: bool
    ) -> RunReceipt:
        if agent_id not in self.agents:
            raise KeyError(f"unknown agent: {agent_id}")
        run_id = str(uuid.uuid4())
        capture_id = str(uuid.uuid4())
        receipt = RunReceipt(
            run_id=run_id,
            capture_id=capture_id,
            agent_id=agent_id,
            technique=technique,
            test_number=test_number,
            dry_run=dry_run,
            started_at=datetime.now(tz=UTC),
        )
        self.runs[run_id] = receipt
        # Pretend an associated capture is implicitly started; Phase 4 will
        # split these two as the brief specifies.
        self.captures[capture_id] = _FakeCapture(
            capture_id=capture_id,
            agent_id=agent_id,
            started_at=receipt.started_at,
            event_count=42 if not dry_run else 0,
        )
        return receipt

    def start_capture(self, agent_id: str, capture_id: str) -> CaptureHandle:
        if agent_id not in self.agents:
            raise KeyError(f"unknown agent: {agent_id}")
        started = datetime.now(tz=UTC)
        self.captures[capture_id] = _FakeCapture(
            capture_id=capture_id,
            agent_id=agent_id,
            started_at=started,
        )
        return CaptureHandle(capture_id=capture_id, agent_id=agent_id, started_at=started)

    def stop_capture(self, capture_id: str) -> CaptureBundleSummary:
        if capture_id not in self.captures:
            raise KeyError(f"unknown capture: {capture_id}")
        cap = self.captures[capture_id]
        ended = datetime.now(tz=UTC)
        cap.ended_at = ended
        return CaptureBundleSummary(
            capture_id=cap.capture_id,
            agent_id=cap.agent_id,
            started_at=cap.started_at,
            ended_at=ended,
            event_count=cap.event_count or 0,
        )


@dataclass
class GRPCAgentTransport:
    """Live transport. Phase 3 ships the skeleton; Phase 4 wires the gRPC stub."""

    bind_addr: str

    def list_agents(self) -> list[AgentInfo]:
        raise NotImplementedError("gRPC agent transport lands in Phase 4")

    def get_inventory(self, agent_id: str) -> Inventory:
        raise NotImplementedError("gRPC agent transport lands in Phase 4")

    def run_atomic(
        self, agent_id: str, technique: str, test_number: int, *, dry_run: bool
    ) -> RunReceipt:
        raise NotImplementedError("gRPC agent transport lands in Phase 4")

    def start_capture(self, agent_id: str, capture_id: str) -> CaptureHandle:
        raise NotImplementedError("gRPC agent transport lands in Phase 4")

    def stop_capture(self, capture_id: str) -> CaptureBundleSummary:
        raise NotImplementedError("gRPC agent transport lands in Phase 4")


def _kwargs(d: Mapping[str, Any]) -> dict[str, Any]:
    return dict(d)
