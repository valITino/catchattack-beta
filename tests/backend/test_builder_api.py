from pathlib import Path
import sys
import yaml

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from fastapi import FastAPI
from fastapi.testclient import TestClient

from backend.app.api.v1.builder import router as builder_router
from backend.app.core.security import create_access_token

app = FastAPI()
app.include_router(builder_router, prefix="/api/v1")


def auth_header(role: str = "analyst") -> dict:
    tok = create_access_token(username=role, role=role)
    return {"Authorization": f"Bearer {tok}"}


def test_operator_catalog():
    with TestClient(app) as client:
        hdr = auth_header("viewer")
        r = client.get("/api/v1/builder/operators", headers=hdr)
        assert r.status_code == 200
        ops = r.json()
        assert any(o["op"] == "equals" for o in ops)
        assert any(o["op"] == "contains" for o in ops)


def test_compile_rule_draft_any():
    payload = {
        "title": "Test Rule",
        "description": "desc",
        "logsource": {"product": "windows"},
        "predicates": [
            {"field": "proc.name", "op": "equals", "value": "cmd.exe"},
            {"field": "proc.cmd", "op": "contains", "value": "/c"},
        ],
        "combine": "any",
    }
    with TestClient(app) as client:
        hdr = auth_header("analyst")
        r = client.post("/api/v1/builder/compile", headers=hdr, json=payload)
        assert r.status_code == 200
        sigma = r.json()["sigma_yaml"]
    data = yaml.safe_load(sigma)
    assert data["title"] == "Test Rule"
    assert data["detection"]["condition"] == "sel0 or sel1"


def test_compile_rule_draft_all():
    payload = {
        "title": "All Rule",
        "logsource": {"service": "proc"},
        "predicates": [
            {"field": "a", "op": "equals", "value": 1},
            {"field": "b", "op": "gt", "value": 2},
        ],
        "combine": "all",
    }
    with TestClient(app) as client:
        hdr = auth_header("analyst")
        r = client.post("/api/v1/builder/compile", headers=hdr, json=payload)
        assert r.status_code == 200
        sigma = r.json()["sigma_yaml"]
    data = yaml.safe_load(sigma)
    sel = data["detection"]["sel"]
    assert sel["a|equals"] == 1
    assert sel["b|gt"] == 2
    assert data["detection"]["condition"] == "sel"


def test_preview_rule_inline_events():
    rule = {
        "title": "Preview Rule",
        "logsource": {"product": "linux"},
        "predicates": [
            {"field": "proc.name", "op": "equals", "value": "cmd.exe"},
            {"field": "proc.cmd", "op": "contains", "value": "/c"},
        ],
        "combine": "all",
    }
    events = [
        {"proc": {"name": "cmd.exe", "cmd": "do /c thing"}},
        {"proc": {"name": "bash", "cmd": "-x"}},
    ]
    with TestClient(app) as client:
        hdr = auth_header("analyst")
        r = client.post(
            "/api/v1/builder/preview",
            headers=hdr,
            json={"draft": rule, "inline_events": events},
        )
        assert r.status_code == 200
        body = r.json()
        assert body["hits"] == 1
        assert len(body["samples"]) == 1
        assert "sigma_yaml" in body


def test_builder_schema():
    dataset_path = (
        Path(__file__).resolve().parents[2] / "ops/seeds/telemetry/windows.ndjson"
    )
    uri = f"file://{dataset_path}"
    with TestClient(app) as client:
        hdr = auth_header("viewer")
        r = client.post(
            "/api/v1/builder/schema", headers=hdr, json={"dataset_uri": uri}
        )
        assert r.status_code == 200
        body = r.json()
        assert body["dataset"] == str(dataset_path)
        fields = {f["field"]: f for f in body["fields"]}
        assert "@timestamp" in fields
        ts_field = fields["@timestamp"]
        assert "date" in ts_field["types"]
        assert "equals" in ts_field["suggested_ops"]
