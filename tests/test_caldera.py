import sys
from pathlib import Path
import requests_mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from backend.services import caldera


def test_disabled_when_env_missing(monkeypatch):
    monkeypatch.delenv("CALDERA_URL", raising=False)
    monkeypatch.delenv("CALDERA_USER", raising=False)
    monkeypatch.delenv("CALDERA_PASS", raising=False)
    result = caldera.get_abilities("T0001")
    assert result == {"status": "disabled"}


def test_get_abilities(monkeypatch):
    monkeypatch.setenv("CALDERA_URL", "http://caldera")
    monkeypatch.setenv("CALDERA_USER", "u")
    monkeypatch.setenv("CALDERA_PASS", "p")
    with requests_mock.Mocker() as m:
        m.get(
            "http://caldera/api/v2/abilities?technique_id=T0001",
            json=[{"name": "ab"}],
        )
        result = caldera.get_abilities("T0001")
    assert result == [{"name": "ab"}]
