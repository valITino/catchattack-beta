import requests
import pytest

BASE = "http://localhost:8000/api/v1"

def _token():
    try:
        r = requests.post(
            f"{BASE}/auth/token",
            data={"username": "admin", "password": "adminpass"},
            timeout=2,
        )
    except requests.exceptions.ConnectionError:
        pytest.skip("backend API not reachable on localhost:8000")
    r.raise_for_status()
    return r.json()["access_token"]


def test_rule_health_endpoint():
    tok = _token()
    hdr = {"Authorization": f"Bearer {tok}"}

    sigma = """title: Test Rule\nlogsource: {product: windows}\ndetection:\n  sel:\n    CommandLine|contains: 'cmd.exe'\n  condition: sel\nlevel: low\n"""
    payload = {
        "name": "test-rule-health",
        "description": "desc",
        "attack_techniques": ["T1059"],
        "sigma_yaml": sigma,
        "status": "draft",
    }
    r = requests.post(f"{BASE}/rules", headers=hdr, json=payload)
    r.raise_for_status()
    rid = r.json()["id"]

    r = requests.get(f"{BASE}/rules/{rid}/health", headers=hdr)
    r.raise_for_status()
    data = r.json()
    assert data["rule_id"] == rid
    assert "confidence" in data

    requests.delete(f"{BASE}/rules/{rid}", headers=hdr)
