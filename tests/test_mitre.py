import sys
from pathlib import Path
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from backend.services import mitre

class DummyCollectionSource:
    def __init__(self, collection):
        self.collection = collection

    def query(self, filt):
        return [{"type": "attack-pattern", "id": f"T{i:04}"} for i in range(1050)]


def test_taxii_success(monkeypatch):
    def fake_get_attack_collection():
        return "dummy"

    monkeypatch.setattr(mitre, "get_attack_collection", fake_get_attack_collection)
    monkeypatch.setattr(mitre, "TAXIICollectionSource", lambda col: DummyCollectionSource(col))

    mitre.CACHE = []
    result = mitre.fetch_techniques()
    assert len(result) >= 1000


def test_fallback_success(monkeypatch):
    def raise_error(*args, **kwargs):
        raise RuntimeError("taxii down")

    monkeypatch.setattr(mitre, "get_attack_collection", raise_error)
    monkeypatch.setattr(mitre, "TAXIICollectionSource", lambda col: DummyCollectionSource(col))

    sample = {
        "objects": [
            {"type": "attack-pattern", "id": f"X{i}"} for i in range(5)
        ]
    }

    class Resp:
        def raise_for_status(self):
            pass

        def json(self):
            return sample

    monkeypatch.setattr(mitre.requests, "get", lambda url, timeout=30: Resp())

    mitre.CACHE = []
    result = mitre.fetch_techniques()
    assert len(result) == 5
