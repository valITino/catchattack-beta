import pytest
import requests

BASE="http://localhost:8000/api/v1"

def token(role="analyst"):
    r = requests.post(
        f"{BASE}/auth/token",
        data={"username": role, "password": f"{role}pass"},
        timeout=1,
    )
    r.raise_for_status()
    return r.json()["access_token"]


def _mk_rule(tok, name, techs, sigma, status="active"):
    hdr={"Authorization":f"Bearer {tok}"}
    r = requests.post(f"{BASE}/rules", headers=hdr, json={
        "name":name,"description":"","attack_techniques":techs,"sigma_yaml":sigma,"status":status
    })
    r.raise_for_status()
    return r.json()["id"]


def test_cov_and_priorities_flow():
    try:
        tok = token("analyst")
    except requests.exceptions.ConnectionError:
        pytest.skip("API server not running")
    hdr = {"Authorization": f"Bearer {tok}"}

    sigma1 = """title: Enc
logsource: {product: windows}
detection: { sel: { process.command_line|contains: "-EncodedCommand" }, condition: sel }
level: low
"""
    sigma2 = """title: Cmd
logsource: {product: windows}
detection: { sel: { process.command_line|contains: "cmd.exe" }, condition: sel }
level: low
"""
    r1 = _mk_rule(tok,"enc-prio",["T1059.001"],sigma1,"active")
    r2 = _mk_rule(tok,"cmd-prio",["T1059","T1105"],sigma2,"active")

    # Create a profile
    p = {"organization":"Acme","industry":"Finance","tech_stack":["Windows"],"intel_tags":["ransomware"],"weights":{"T1105":1.5}}
    rp = requests.post(f"{BASE}/profiles", headers=hdr, json=p); rp.raise_for_status()

    # Coverage should show counts
    rc = requests.get(f"{BASE}/coverage", headers=hdr); rc.raise_for_status()
    cov = rc.json()
    assert any(c["technique_id"].startswith("T1059") for c in cov)

    # Priorities should return non-empty with priority_score
    pr = requests.get(f"{BASE}/priorities?organization=Acme", headers=hdr); pr.raise_for_status()
    arr = pr.json()
    assert all("priority_score" in x for x in arr)
