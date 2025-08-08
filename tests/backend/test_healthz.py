import requests

def test_healthz():
    r = requests.get("http://localhost:8000/api/v1/healthz", timeout=5)
    assert r.status_code == 200
    assert r.json().get("status") == "ok"
