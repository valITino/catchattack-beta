import requests, json, time

BASE="http://localhost:8000/api/v1"

def _token():
    r = requests.post(f"{BASE}/auth/token", data={"username":"admin","password":"adminpass"})
    r.raise_for_status()
    return r.json()["access_token"]

def test_rules_crud_lint_compile():
    tok = _token()
    hdr = {"Authorization": f"Bearer {tok}"}

    sigma = """title: Test Rule
logsource: {product: windows}
detection:
  sel:
    CommandLine|contains: "cmd.exe"
  condition: sel
level: low
"""
    payload = {"name":"test-rule-1","description":"desc","attack_techniques":["T1059"],"sigma_yaml":sigma,"status":"draft"}
    r = requests.post(f"{BASE}/rules", headers=hdr, json=payload); r.raise_for_status()
    rid = r.json()["id"]

    r = requests.get(f"{BASE}/rules/{rid}", headers=hdr); r.raise_for_status()
    assert r.json()["name"] == "test-rule-1"

    r = requests.post(f"{BASE}/rules/{rid}/lint", headers=hdr); r.raise_for_status()
    assert r.json()["ok"] is True

    r = requests.post(f"{BASE}/rules/{rid}/compile?target=elastic", headers=hdr); r.raise_for_status()
    assert "queries" in r.json()

    payload["description"]="updated"
    r = requests.put(f"{BASE}/rules/{rid}", headers=hdr, json=payload); r.raise_for_status()

    # viewer cannot delete
    rv = requests.post(f"{BASE}/auth/token", data={"username":"viewer","password":"viewerpass"}); rv.raise_for_status()
    vh = {"Authorization": f"Bearer {rv.json()['access_token']}"}
    r = requests.delete(f"{BASE}/rules/{rid}", headers=vh)
    assert r.status_code == 403

    # admin can delete
    r = requests.delete(f"{BASE}/rules/{rid}", headers=hdr)
    assert r.status_code == 204
