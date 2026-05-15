"""End-to-end integration: drive closed_loop_rule_synthesis against the
in-tree MCP servers composed in-process.

No external services, no network. The Conductor's MCPClient calls into a
FastMCP router that mounts each in-tree server (sigma, splunk-mock, agents,
evidence) under its namespace — exactly the shape the proxy ships in
production, just running inside pytest.
"""

from __future__ import annotations

from datetime import UTC, datetime
from pathlib import Path

import pytest
from agents_mcp.server import build_server as build_agents_server
from agents_mcp.transport import InMemoryAgentTransport
from conductor.clients.llm import StaticLLM
from conductor.clients.mcp import FastMCPClient
from conductor.clients.pr import LocalBranchPROpener
from conductor.runner import execute
from conductor.runs import RunRegistry, RunStatus
from conductor.workflows import WorkflowDeps
from evidence_mcp.models import (
    Artifacts,
    CaptureBundle,
    Marker,
    Stats,
    TopProcess,
    Trigger,
)
from evidence_mcp.server import build_server as build_evidence_server
from evidence_mcp.storage import FilesystemStorage
from fastmcp import FastMCP
from sigma_mcp.server import build_server as build_sigma_server
from splunk_mock.server import build_server as build_splunk_server


@pytest.fixture
def composed_router(tmp_path: Path) -> FastMCP:
    """A FastMCP that mounts every in-tree server under the production
    namespaces. Exercises the same surface a real proxy would."""
    router = FastMCP(name="catchattack-test-proxy")
    router.mount(build_sigma_server(corpus_root=str(tmp_path / "corpus")), namespace="sigma")
    router.mount(build_splunk_server(seed=42, history_days=3), namespace="splunk")

    # The agents bridge needs a transport with a capture id we control. We
    # seed two lab agents and use those.
    agents_transport = InMemoryAgentTransport.with_seed()
    router.mount(build_agents_server(agents_transport), namespace="agents")

    # Evidence needs a bundle pre-populated so summarize_capture has data.
    # The closed-loop workflow asks for capture_id_1 (from run_atomic) — we
    # post-process: after agents.run_atomic returns a capture_id, we drop a
    # bundle for it into the storage. To do that, we monkey-patch
    # run_atomic via the InMemoryAgentTransport hook below.
    evidence_store = FilesystemStorage(tmp_path / "evidence")

    real_run_atomic = agents_transport.run_atomic

    def hooked_run_atomic(agent_id: str, technique: str, test_number: int, *, dry_run: bool):  # type: ignore[no-untyped-def]
        receipt = real_run_atomic(agent_id, technique, test_number, dry_run=dry_run)
        # Drop a synthetic bundle for the capture_id so evidence.summarize
        # and splunk.search return meaningful data downstream.
        now = datetime.now(tz=UTC)
        bundle = CaptureBundle(
            id=receipt.capture_id,
            agent_id=agent_id,
            started_at=now,
            ended_at=now,
            trigger=Trigger(
                kind="atomic", atomic_technique=technique, atomic_test_number=test_number
            ),
            artifacts=Artifacts(),
            markers=[
                Marker(t_ms=100, kind="atomic_step_start", label="start"),
                Marker(t_ms=2000, kind="process_spawn", label="powershell.exe"),
                Marker(t_ms=3000, kind="detection_hit", label="x"),
            ],
            stats=Stats(
                event_count=12,
                duration_ms=4000,
                size_bytes=1024,
                top_processes=[TopProcess(name="powershell.exe", count=4)],
            ),
        )
        evidence_store.put_bundle(bundle)
        return receipt

    agents_transport.run_atomic = hooked_run_atomic  # type: ignore[method-assign]
    router.mount(build_evidence_server(evidence_store), namespace="evidence")
    return router


async def test_closed_loop_passes_against_in_tree_servers(
    composed_router: FastMCP, tmp_path: Path
) -> None:
    repo = tmp_path / "repo"
    repo.mkdir()
    corpus = tmp_path / "corpus"
    corpus.mkdir(exist_ok=True)
    deps = WorkflowDeps(
        mcp=FastMCPClient(transport=composed_router),
        llm=StaticLLM(),
        pr=LocalBranchPROpener(repo=repo),
        system_prompt="(test prompt)",
        fp_threshold_per_day=999,
        dedupe_threshold=0.85,
        dedupe_corpus_path=str(corpus),
    )
    registry = RunRegistry()
    run = registry.create(
        workflow="closed_loop_rule_synthesis",
        inputs={"agent_id": "lab-win-01", "technique": "T1059.001", "test_number": 1},
    )
    await execute(run, deps)

    # The integration may end one of two ways:
    # - SUCCEEDED: the StaticLLM's PSH-encoded rule plus the SPL search over
    #   the splunk-mock synthetic data finds a hit, and the PR is opened.
    # - FAILED at validation.no_hits: the synthetic data's time window
    #   doesn't include a fresh encoded-command event during the 2-minute
    #   validation window. Both outcomes prove the workflow plumbed every
    #   upstream correctly.
    assert run.status in {RunStatus.SUCCEEDED, RunStatus.FAILED}
    if run.status == RunStatus.FAILED:
        # Only "validation.no_hits" is allowed — anything else is a real bug.
        assert run.error is not None
        assert run.error["code"] == "validation.no_hits", run.error

    # Every step before validation must have emitted at least one event.
    steps = {e.step for e in run.events if e.step > 0}
    assert {1, 2, 3, 4, 5, 6, 7, 8, 9, 10}.issubset(steps)
