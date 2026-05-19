from __future__ import annotations

import pytest
from agents_mcp.transport import GRPCAgentTransport, InMemoryAgentTransport


def test_with_seed_provides_two_lab_agents(transport: InMemoryAgentTransport) -> None:
    items = transport.list_agents()
    ids = {a.agent_id for a in items}
    assert ids == {"lab-linux-01", "lab-win-01"}
    assert all(a.status == "connected" for a in items)


def test_get_inventory_for_known_agent(transport: InMemoryAgentTransport) -> None:
    inv = transport.get_inventory("lab-win-01")
    assert inv.os == "windows"
    assert "WinDefend" in inv.edr_detected


def test_get_inventory_unknown_agent_raises(transport: InMemoryAgentTransport) -> None:
    with pytest.raises(KeyError):
        transport.get_inventory("not-a-real-agent")


def test_run_atomic_returns_receipt_with_capture_id(
    transport: InMemoryAgentTransport,
) -> None:
    receipt = transport.run_atomic("lab-linux-01", "T1059.004", 1, dry_run=True)
    assert receipt.agent_id == "lab-linux-01"
    assert receipt.dry_run is True
    assert receipt.run_id != ""
    assert receipt.capture_id != ""
    assert receipt.capture_id in transport.captures


def test_start_then_stop_capture(transport: InMemoryAgentTransport) -> None:
    handle = transport.start_capture("lab-linux-01", "fixed-id")
    assert handle.capture_id == "fixed-id"
    summary = transport.stop_capture("fixed-id")
    assert summary.capture_id == "fixed-id"
    assert summary.ended_at >= summary.started_at


def test_stop_unknown_capture_raises(transport: InMemoryAgentTransport) -> None:
    with pytest.raises(KeyError):
        transport.stop_capture("nope")


def test_grpc_transport_is_not_yet_implemented() -> None:
    t = GRPCAgentTransport(bind_addr="127.0.0.1:50051")
    with pytest.raises(NotImplementedError):
        t.list_agents()
