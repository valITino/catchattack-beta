from __future__ import annotations

import pytest
from stratus_mcp.runner import InMemoryStratusRunner
from stratus_mcp.server import build_server


@pytest.fixture
def runner() -> InMemoryStratusRunner:
    return InMemoryStratusRunner.seeded()


@pytest.fixture
def server(runner: InMemoryStratusRunner) -> object:
    return build_server(runner)
