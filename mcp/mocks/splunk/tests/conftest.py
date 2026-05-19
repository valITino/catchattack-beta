from __future__ import annotations

import pytest
from splunk_mock.server import build_server
from splunk_mock.store import SplunkStore

TEST_SEED = 42


@pytest.fixture
def store() -> SplunkStore:
    return SplunkStore(seed=TEST_SEED, history_days=3)


@pytest.fixture
def server() -> object:
    return build_server(seed=TEST_SEED, history_days=3)
