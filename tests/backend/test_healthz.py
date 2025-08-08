from pathlib import Path
import sys
import pytest

pytest.importorskip("httpx")
pytest.importorskip("pydantic_settings")

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from fastapi.testclient import TestClient
from backend.app.main import app


def test_healthz():
    with TestClient(app) as client:
        r = client.get("/api/v1/healthz")
        assert r.status_code == 200
        assert r.json().get("status") == "ok"
