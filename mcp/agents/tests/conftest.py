from __future__ import annotations

import pytest
from agents_mcp.server import build_server
from agents_mcp.transport import InMemoryAgentTransport


@pytest.fixture
def transport() -> InMemoryAgentTransport:
    return InMemoryAgentTransport.with_seed()


@pytest.fixture
def server(transport: InMemoryAgentTransport) -> object:
    return build_server(transport)
