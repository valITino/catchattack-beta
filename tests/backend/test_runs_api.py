import requests, json, uuid

BASE="http://localhost:8000/api/v1"

def token(role="analyst"):
    r = requests.post(f"{BASE}/auth/token", data={"username":role, "password":f"{role}pass"})
    r.raise_for_status()
    return r.json()["access_token"]

def test_run_flow():
    tok = token("analyst")
    hdr = {"Authorization": f"Bearer {tok}"}

    # create draft rule first (same as in chunk 3), then set status active:
    sigma = """title: Enc
logsource: {product: windows}
detection:
  sel:
    process.command_line|contains: "-EncodedCommand"
  condition: sel
level: low
"""
    r = requests.post(f"{BASE}/rules", headers=hdr, json={"name":"enc-rule","description":"","attack_techniques":["T1059"],"sigma_yaml":sigma,"status":"active"})
    r.raise_for_status()

    r = requests.post(f"{BASE}/runs", headers=hdr, files={"name":(None,"t1"), "source":(None,"local")})
    r.raise_for_status(); rid = r.json()["id"]

    r = requests.post(f"{BASE}/runs/{rid}/start", headers=hdr); r.raise_for_status()

    ndj = '\n'.join([
        json.dumps({"@timestamp":"2025-01-01T00:00:00Z","process":{"command_line":"powershell -EncodedCommand AA=="}}),
        json.dumps({"@timestamp":"2025-01-01T00:00:10Z","process":{"command_line":"cmd.exe /c whoami"}})
    ])
    files = {"file": ("events.ndjson", ndj, "application/x-ndjson")}
    r = requests.post(f"{BASE}/runs/{rid}/ingest", headers=hdr, files=files); r.raise_for_status()

    r = requests.post(f"{BASE}/runs/{rid}/evaluate?engine=local", headers=hdr); r.raise_for_status()
    j = r.json()
    assert j["status"] == "completed"
    assert j["evaluated_rules"] >= 1
    assert any(it["hit_count"] >= 1 for it in j["results"])

    r = requests.get(f"{BASE}/runs/{rid}", headers=hdr); r.raise_for_status()
    assert r.json()["summary"]["rules_evaluated"] >= 1
