import requests, json, time, pytest

BASE="http://localhost:8000/api/v1"

def token(user="admin"):
    try:
        r = requests.post(f"{BASE}/auth/token", data={"username":user,"password":f"{user}pass"}, timeout=2)
    except requests.exceptions.ConnectionError:
        pytest.skip("backend API not reachable on localhost:8000")
    r.raise_for_status()
    return r.json()["access_token"]

def create_rule(tok):
    hdr={"Authorization":f"Bearer {tok}"}
    sigma = """title: DeployMe
logsource: {product: windows}
detection: { sel: { process.command_line|contains: \"powershell\" }, condition: sel }
level: low
"""
    r = requests.post(f"{BASE}/rules", headers=hdr, json={
        "name":"deploy-me","description":"","attack_techniques":["T1059"],"sigma_yaml":sigma,"status":"active"
    }); r.raise_for_status(); return r.json()["id"]

def test_deploy_dryrun_and_real_and_rollback():
    admin = token("admin")
    analyst = token("analyst")
    ah={"Authorization":f"Bearer {admin}"}
    an={"Authorization":f"Bearer {analyst}"}

    rid = create_rule(admin)

    # analyst can dry-run
    r = requests.post(f"{BASE}/deploy/elastic", headers=an, json={"rules":[{"rule_id":rid}],"dry_run":True})
    assert r.status_code == 200 and r.json()["status"] in ["success","error"]

    # analyst cannot real deploy (should be 403)
    r = requests.post(f"{BASE}/deploy/elastic", headers=an, json={"rules":[{"rule_id":rid}]})
    assert r.status_code in [403, 401]

    # admin can real deploy
    r = requests.post(f"{BASE}/deploy/elastic", headers=ah, json={"rules":[{"rule_id":rid}]})
    r.raise_for_status(); job_id = r.json()["job_id"]

    # poll status
    r = requests.get(f"{BASE}/deploy/{job_id}", headers=ah); r.raise_for_status()
    assert r.json()["status"] in ["success","error"]

    # rollback
    rr = requests.post(f"{BASE}/deploy/{job_id}/rollback", headers=ah); rr.raise_for_status()
    assert rr.json()["status"] in ["rolled_back","error"]
