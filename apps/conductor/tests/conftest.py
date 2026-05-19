from __future__ import annotations

from pathlib import Path

import pytest
from conductor.clients.llm import StaticLLM
from conductor.clients.mcp import StaticMCPClient
from conductor.clients.pr import LocalBranchPROpener
from conductor.workflows import WorkflowDeps


@pytest.fixture
def static_mcp() -> StaticMCPClient:
    return StaticMCPClient()


@pytest.fixture
def static_llm() -> StaticLLM:
    return StaticLLM()


@pytest.fixture
def deps(tmp_path: Path, static_mcp: StaticMCPClient, static_llm: StaticLLM) -> WorkflowDeps:
    repo = tmp_path / "repo"
    repo.mkdir()
    return WorkflowDeps(
        mcp=static_mcp,
        llm=static_llm,
        pr=LocalBranchPROpener(repo=repo),
        system_prompt="(test system prompt)",
        fp_threshold_per_day=5,
        dedupe_threshold=0.85,
    )
