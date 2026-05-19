"""Tests for the live endpoints: LiveKit token + marker WebSocket."""

from __future__ import annotations

from conductor.api import create_app
from conductor.clients.llm import StaticLLM
from conductor.clients.mcp import StaticMCPClient
from conductor.clients.pr import LocalBranchPROpener
from conductor.livekit import MarkerHub
from conductor.runs import RunRegistry
from conductor.workflows import WorkflowDeps
from fastapi.testclient import TestClient


def _deps(tmp_path, *, with_hub: bool = True) -> WorkflowDeps:  # type: ignore[no-untyped-def]
    repo = tmp_path / "repo"
    repo.mkdir(exist_ok=True)
    return WorkflowDeps(
        mcp=StaticMCPClient(),
        llm=StaticLLM(),
        pr=LocalBranchPROpener(repo=repo),
        system_prompt="x",
        marker_hub=MarkerHub() if with_hub else None,
    )


def test_live_token_503_when_livekit_unconfigured(tmp_path, monkeypatch) -> None:  # type: ignore[no-untyped-def]
    for var in ("LIVEKIT_URL", "LIVEKIT_API_KEY", "LIVEKIT_API_SECRET"):
        monkeypatch.delenv(var, raising=False)
    registry = RunRegistry()
    run = registry.create("closed_loop_rule_synthesis", {})
    app = create_app(registry, _deps(tmp_path))
    with TestClient(app) as client:
        r = client.get(f"/live/{run.id}/token")
        assert r.status_code == 503


def test_live_token_404_when_run_unknown(tmp_path) -> None:  # type: ignore[no-untyped-def]
    app = create_app(RunRegistry(), _deps(tmp_path))
    with TestClient(app) as client:
        r = client.get("/live/nonexistent/token")
        assert r.status_code == 404


def test_live_token_minted_when_configured(tmp_path, monkeypatch) -> None:  # type: ignore[no-untyped-def]
    monkeypatch.setenv("LIVEKIT_URL", "ws://livekit.test:7880")
    monkeypatch.setenv("LIVEKIT_API_KEY", "devkey")
    monkeypatch.setenv("LIVEKIT_API_SECRET", "devsecretdevsecretdevsecret012345")
    registry = RunRegistry()
    run = registry.create("closed_loop_rule_synthesis", {})
    app = create_app(registry, _deps(tmp_path))
    with TestClient(app) as client:
        r = client.get(f"/live/{run.id}/token", params={"identity": "viewer-bob"})
        assert r.status_code == 200
        body = r.json()
        assert body["room"] == f"run-{run.id}"
        assert body["url"] == "ws://livekit.test:7880"
        assert body["token"].count(".") == 2  # header.payload.signature


def test_marker_websocket_streams_then_closes(tmp_path) -> None:  # type: ignore[no-untyped-def]
    deps = _deps(tmp_path)
    app = create_app(RunRegistry(), deps)
    with TestClient(app) as client, client.websocket_connect("/live/run-42/markers") as ws:
        # Publish a marker after the socket is connected.
        deps.marker_hub.publish(  # type: ignore[union-attr]
            "run-42",
            {"t_ms": 0, "kind": "detection_hit", "label": "fired", "color": "blue"},
        )
        msg = ws.receive_json()
        assert msg["type"] == "marker"
        assert msg["marker"]["label"] == "fired"

        deps.marker_hub.close("run-42")  # type: ignore[union-attr]
        done = ws.receive_json()
        assert done["type"] == "done"


def test_marker_websocket_errors_without_hub(tmp_path) -> None:  # type: ignore[no-untyped-def]
    app = create_app(RunRegistry(), _deps(tmp_path, with_hub=False))
    with TestClient(app) as client, client.websocket_connect("/live/run-1/markers") as ws:
        msg = ws.receive_json()
        assert msg["type"] == "error"
