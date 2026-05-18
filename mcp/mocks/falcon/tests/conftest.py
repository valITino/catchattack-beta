from __future__ import annotations

import pytest
from falcon_mock.server import build_server
from falcon_mock.store import FalconStore

TEST_SEED = 42


@pytest.fixture
def store() -> FalconStore:
    return FalconStore(seed=TEST_SEED)


@pytest.fixture
def server() -> object:
    return build_server(seed=TEST_SEED)
