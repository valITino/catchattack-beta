"""Tests for the closed_loop_rule_synthesis workflow.

Each test wires the StaticMCPClient with the exact tool responses the
workflow expects to receive at each step. This is loud — that's the point:
it documents the brief's contract one assertion at a time.
"""

from __future__ import annotations

from conductor.clients.mcp import StaticMCPClient
from conductor.runner import execute
from conductor.runs import Run, RunRegistry, RunStatus
from conductor.workflows import WorkflowDeps


def _seed_happy_path(mcp: StaticMCPClient) -> None:
    mcp.respond_to(
        "agents.list_agents",
        result={"items": [{"agent_id": "lab-linux-01"}, {"agent_id": "lab-win-01"}]},
    )
    mcp.respond_to(
        "agents.run_atomic",
        result={
            "run_id": "run-1",
            "capture_id": "cap-first",
            "agent_id": "lab-win-01",
            "technique": "T1059.001",
            "test_number": 1,
            "dry_run": False,
            "started_at": "2026-05-13T12:00:00+00:00",
        },
    )
    mcp.respond_to(
        "evidence.summarize_capture",
        {"capture_id": "cap-first"},
        result={
            "capture_id": "cap-first",
            "technique": "T1059.001",
            "duration_ms": 12000,
            "top_processes": [],
            "suspicious_score": 0.5,
            "notable_marker_count": 6,
        },
    )
    mcp.respond_to(
        "sigma.lint_sigma",
        result={"ok": True, "errors": [], "warnings": [], "info": []},
    )
    mcp.respond_to(
        "sigma.dedupe_against_corpus",
        result={
            "corpus_path": "/x",
            "corpus_size": 1,
            "threshold": 0.85,
            "embedder": "hash-256",
            "max_score": 0.10,
            "is_duplicate": False,
            "matches": [],
        },
    )
    mcp.respond_to(
        "sigma.convert_sigma",
        result={
            "target": "splunk",
            "pipeline": None,
            "queries": ['Image="*\\powershell.exe" CommandLine="*EncodedCommand*"'],
            "pipeline_trace": ["backend=SplunkBackend"],
            "backend": "SplunkBackend",
            "warnings": [],
        },
    )
    mcp.respond_to(
        "splunk.estimate_fp_rate",
        result={
            "spl": "x",
            "lookback_days": 7,
            "total_hits": 9,
            "hits_per_day": [{"date": "2026-05-12", "hits": 1}, {"date": "2026-05-11", "hits": 2}],
            "unique_hosts": 3,
            "p95_hits_per_day": 2,
            "verdict": "low",
        },
    )
    mcp.respond_to(
        "splunk.deploy_rule",
        result={
            "name": "rule",
            "dry_run": True,
            "rendered_stanza": "[rule]\n...",
            "deployed": False,
            "saved_search": None,
        },
    )
    # Second emulation needs a different capture_id; the first respond_to wins
    # for both calls in StaticMCPClient because we only register once. Patch
    # the second response in via params subset.
    mcp.respond_to(
        "splunk.search",
        result={
            "spl": "x",
            "earliest": "x",
            "latest": "y",
            "count": 3,
            "top_hosts": [],
            "top_users": [],
            "top_sources": [],
            "samples": [],
            "truncated": False,
        },
    )


async def test_happy_path_succeeds_and_emits_eleven_steps(
    deps: WorkflowDeps,
    static_mcp: StaticMCPClient,
) -> None:
    _seed_happy_path(static_mcp)
    registry = RunRegistry()
    run = registry.create(
        workflow="closed_loop_rule_synthesis",
        inputs={"agent_id": "lab-win-01", "technique": "T1059.001", "test_number": 1},
    )
    await execute(run, deps)
    assert run.status == RunStatus.SUCCEEDED, run.error
    assert run.result is not None
    assert run.result["validation_hits"] == 3
    assert run.result["pr_backend"] == "local_branch"
    steps_emitted = {e.step for e in run.events if e.step > 0}
    # Each major step >= 1 emitted at least once.
    assert {1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11}.issubset(steps_emitted)


async def test_unknown_agent_aborts_with_named_code(
    deps: WorkflowDeps,
    static_mcp: StaticMCPClient,
) -> None:
    static_mcp.respond_to("agents.list_agents", result={"items": [{"agent_id": "other"}]})
    run = Run(  # build directly to skip RunRegistry boilerplate
        id="r1",
        workflow="closed_loop_rule_synthesis",
        status=RunStatus.QUEUED,
        created_at=__import__("datetime").datetime.now(tz=__import__("datetime").UTC),
        inputs={"agent_id": "lab-win-01", "technique": "T1059.001"},
    )
    await execute(run, deps)
    assert run.status == RunStatus.FAILED
    assert run.error["code"] == "preflight.unknown_agent"  # type: ignore[index]


async def test_empty_evidence_aborts(
    deps: WorkflowDeps,
    static_mcp: StaticMCPClient,
) -> None:
    _seed_happy_path(static_mcp)
    # Replace the summarize result with one that has zero notable markers.
    static_mcp._handlers = [h for h in static_mcp._handlers if h[0] != "evidence.summarize_capture"]
    static_mcp.respond_to(
        "evidence.summarize_capture",
        result={
            "capture_id": "cap-first",
            "duration_ms": 0,
            "top_processes": [],
            "suspicious_score": 0.0,
            "notable_marker_count": 0,
        },
    )
    registry = RunRegistry()
    run = registry.create(
        "closed_loop_rule_synthesis",
        {"agent_id": "lab-win-01", "technique": "T1059.001"},
    )
    await execute(run, deps)
    assert run.status == RunStatus.FAILED
    assert run.error["code"] == "evidence.empty"  # type: ignore[index]


async def test_lint_errors_abort(
    deps: WorkflowDeps,
    static_mcp: StaticMCPClient,
) -> None:
    _seed_happy_path(static_mcp)
    static_mcp._handlers = [h for h in static_mcp._handlers if h[0] != "sigma.lint_sigma"]
    static_mcp.respond_to(
        "sigma.lint_sigma",
        result={
            "ok": False,
            "errors": [{"severity": "error", "code": "schema.bad_level", "message": "x"}],
            "warnings": [],
            "info": [],
        },
    )
    registry = RunRegistry()
    run = registry.create(
        "closed_loop_rule_synthesis", {"agent_id": "lab-win-01", "technique": "T1059.001"}
    )
    await execute(run, deps)
    assert run.status == RunStatus.FAILED
    assert run.error["code"] == "lint.errors"  # type: ignore[index]


async def test_dedupe_near_duplicate_aborts(
    deps: WorkflowDeps,
    static_mcp: StaticMCPClient,
) -> None:
    _seed_happy_path(static_mcp)
    static_mcp._handlers = [
        h for h in static_mcp._handlers if h[0] != "sigma.dedupe_against_corpus"
    ]
    static_mcp.respond_to(
        "sigma.dedupe_against_corpus",
        result={
            "corpus_path": "/x",
            "corpus_size": 1,
            "threshold": 0.85,
            "embedder": "hash",
            "max_score": 0.92,
            "is_duplicate": True,
            "matches": [
                {
                    "rule_id": "x",
                    "rule_path": "y",
                    "title": "near",
                    "ast_overlap": 0.9,
                    "embedding_similarity": 0.7,
                    "score": 0.92,
                }
            ],
        },
    )
    registry = RunRegistry()
    run = registry.create(
        "closed_loop_rule_synthesis", {"agent_id": "lab-win-01", "technique": "T1059.001"}
    )
    await execute(run, deps)
    assert run.status == RunStatus.FAILED
    assert run.error["code"] == "dedupe.near_duplicate"  # type: ignore[index]


async def test_fp_too_high_aborts(
    deps: WorkflowDeps,
    static_mcp: StaticMCPClient,
) -> None:
    _seed_happy_path(static_mcp)
    static_mcp._handlers = [h for h in static_mcp._handlers if h[0] != "splunk.estimate_fp_rate"]
    static_mcp.respond_to(
        "splunk.estimate_fp_rate",
        result={
            "spl": "x",
            "lookback_days": 7,
            "total_hits": 200,
            "hits_per_day": [],
            "unique_hosts": 12,
            "p95_hits_per_day": 80,
            "verdict": "high",
        },
    )
    registry = RunRegistry()
    run = registry.create(
        "closed_loop_rule_synthesis", {"agent_id": "lab-win-01", "technique": "T1059.001"}
    )
    await execute(run, deps)
    assert run.status == RunStatus.FAILED
    assert run.error["code"] == "fp.too_high"  # type: ignore[index]


async def test_validation_no_hits_aborts(
    deps: WorkflowDeps,
    static_mcp: StaticMCPClient,
) -> None:
    _seed_happy_path(static_mcp)
    static_mcp._handlers = [h for h in static_mcp._handlers if h[0] != "splunk.search"]
    static_mcp.respond_to(
        "splunk.search",
        result={
            "spl": "x",
            "earliest": "a",
            "latest": "b",
            "count": 0,
            "top_hosts": [],
            "top_users": [],
            "top_sources": [],
            "samples": [],
            "truncated": False,
        },
    )
    registry = RunRegistry()
    run = registry.create(
        "closed_loop_rule_synthesis", {"agent_id": "lab-win-01", "technique": "T1059.001"}
    )
    await execute(run, deps)
    assert run.status == RunStatus.FAILED
    assert run.error["code"] == "validation.no_hits"  # type: ignore[index]
