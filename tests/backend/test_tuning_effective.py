import requests
import pytest

BASE = "http://localhost:8000/api/v1"


def token(role: str = "analyst") -> str:
    try:
        r = requests.post(
            f"{BASE}/auth/token",
            data={"username": role, "password": f"{role}pass"},
            timeout=2,
        )
    except requests.exceptions.ConnectionError:
        pytest.skip("backend API not reachable on localhost:8000")
    r.raise_for_status()
    return r.json()["access_token"]


def test_tuning_overlay_and_effective_compile():
    tok = token("analyst")
    hdr = {"Authorization": f"Bearer {tok}"}
    sigma = """title: Encoded PS
logsource: {product: windows}
detection:
  sel:
    process.command_line|contains: "-EncodedCommand"
  condition: sel
level: medium
"""
    # create rule
    r = requests.post(
        f"{BASE}/rules",
        headers=hdr,
        json={
            "name": "tune-me",
            "description": "base",
            "attack_techniques": ["T1059.001"],
            "sigma_yaml": sigma,
            "status": "active",
        },
    ); r.raise_for_status()
    rid = r.json()["id"]

    # add overlay to add fp and adjust condition
    ov = {
        "owner": "qa",
        "notes": "exclude scanners",
        "overlays": [
            {"op": "add", "path": "/detection/fp/host.name|endswith", "value": ".scanner.local"},
            {"op": "add", "path": "/detection/condition", "value": "sel and not fp"},
        ],
    }
    q = requests.post(f"{BASE}/rules/{rid}/tuning", headers=hdr, json=ov); q.raise_for_status()
    cid = q.json()["id"]

    # compile effective for elastic (all overlays)
    ce = requests.post(f"{BASE}/rules/{rid}/effective?target=elastic", headers=hdr); ce.raise_for_status()
    jj = ce.json()
    assert jj["ok"] is True
    assert "queries" in jj and len(jj["queries"]) >= 1
    assert "effective_yaml" in jj and "sel and not fp" in jj["effective_yaml"]

    # compile effective for sentinel using single customization
    ce2 = requests.post(
        f"{BASE}/rules/{rid}/effective?target=sentinel&customization_scope=single&customization_id={cid}",
        headers=hdr,
    )
    # endpoint ignores customization_scope but uses customization_id; just check it works:
    assert ce2.status_code == 200

