from pathlib import Path
import sys
import pytest

pytest.importorskip("httpx")
pytest.importorskip("pydantic_settings")

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from fastapi import FastAPI
from fastapi.testclient import TestClient

app = FastAPI()


@app.get("/api/v1/healthz")
def healthz():
    return {"status": "ok"}


@app.get("/api/v1/readyz")
def readyz():
    return {"ready": True}


def test_healthz():
    with TestClient(app) as client:
        r = client.get("/api/v1/healthz")
        assert r.status_code == 200
        assert r.json().get("status") == "ok"


def test_readyz():
    with TestClient(app) as client:
        r = client.get("/api/v1/readyz")
        assert r.status_code == 200
        assert r.json().get("ready") is True
