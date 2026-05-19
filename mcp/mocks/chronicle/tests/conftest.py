from __future__ import annotations

import pytest
from chronicle_mock.server import build_server


@pytest.fixture
def server() -> object:
    return build_server(seed=42)
