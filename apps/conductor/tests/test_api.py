"""Smoke tests for the FastAPI surface."""

from __future__ import annotations

import asyncio

from conductor.api import create_app
from conductor.clients.llm import StaticLLM
from conductor.clients.mcp import StaticMCPClient
from conductor.clients.pr import LocalBranchPROpener
from conductor.runs import RunRegistry
from conductor.workflows import WorkflowDeps
from fastapi.testclient import TestClient


def _deps(tmp_path) -> WorkflowDeps:  # type: ignore[no-untyped-def]
    repo = tmp_path / "repo"
    repo.mkdir()
    return WorkflowDeps(
        mcp=StaticMCPClient(),
        llm=StaticLLM(),
        pr=LocalBranchPROpener(repo=repo),
        system_prompt="x",
    )


def test_health_lists_registered_workflows(tmp_path) -> None:  # type: ignore[no-untyped-def]
    app = create_app(RunRegistry(), _deps(tmp_path))
    with TestClient(app) as client:
        r = client.get("/health")
        assert r.status_code == 200
        body = r.json()
        assert "closed_loop_rule_synthesis" in body["workflows"]


def test_start_unknown_workflow_404(tmp_path) -> None:  # type: ignore[no-untyped-def]
    app = create_app(RunRegistry(), _deps(tmp_path))
    with TestClient(app) as client:
        r = client.post("/workflows/no-such/run", json={"inputs": {}})
        assert r.status_code == 404


def test_start_then_fetch_run(tmp_path) -> None:  # type: ignore[no-untyped-def]
    # No MCP handlers registered → run will fail at the first call. We just
    # want to confirm the queue + GET round-trip works.
    deps = _deps(tmp_path)
    registry = RunRegistry()
    app = create_app(registry, deps)
    with TestClient(app) as client:
        r = client.post(
            "/workflows/closed_loop_rule_synthesis/run",
            json={"inputs": {"agent_id": "lab-win-01", "technique": "T1059.001"}},
        )
        assert r.status_code == 202
        run_id = r.json()["run_id"]

        # Give the background task a chance to fail.
        async def wait() -> None:
            for _ in range(50):
                run = registry.get(run_id)
                if run and run.status.value in {"failed", "succeeded"}:
                    return
                await asyncio.sleep(0.01)

        asyncio.new_event_loop().run_until_complete(wait())
        r2 = client.get(f"/workflows/runs/{run_id}")
        assert r2.status_code == 200
        assert r2.json()["status"] == "failed"
