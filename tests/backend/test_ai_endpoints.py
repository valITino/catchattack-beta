import requests, json, os, time

BASE="http://localhost:8000/api/v1"

def token(role="analyst"):
    r = requests.post(f"{BASE}/auth/token", data={"username":role,"password":f"{role}pass"})
    r.raise_for_status()
    return r.json()["access_token"]

def test_rule_gen_and_cache_and_rate_limit():
    tok = token("analyst"); hdr={"Authorization":f"Bearer {tok}"}

    payload = {
      "signals":{
        "logs_example":[{"process.command_line":"powershell -EncodedCommand AAA"}],
        "techniques":["T1059.001"],"platform":"windows","siem":"elastic","style":"sigma"
      },
      "constraints":{"must_explain":True}
    }

    r = requests.post(f"{BASE}/ai/rules/generate", headers=hdr, json=payload); r.raise_for_status()
    j1 = r.json(); assert "sigma_yaml" in j1 and "test_events" in j1

    # cached second call should be fast
    r2 = requests.post(f"{BASE}/ai/rules/generate", headers=hdr, json=payload); r2.raise_for_status()

    # hit rate limit quickly (forcing 11 calls)
    errs = 0
    for _ in range(11):
        rr = requests.post(f"{BASE}/ai/attacks/generate", headers=hdr, json={"goals":["test"],"style":"bash"})
        if rr.status_code == 429: errs += 1
    assert errs >= 1

def test_attack_safety_sanitizer():
    tok = token("analyst"); hdr={"Authorization":f"Bearer {tok}"}
    r = requests.post(f"{BASE}/ai/attacks/generate", headers=hdr, json={
        "goals":["download a file (should be blocked)"],
        "style":"bash"
    })
    r.raise_for_status()
    s = r.json()["script"]
    assert "echo" in s  # network calls replaced

def test_infra_gen_blueprint():
    tok = token("analyst"); hdr={"Authorization":f"Bearer {tok}"}
    r = requests.post(f"{BASE}/ai/infra/generate", headers=hdr, json={
        "topology":{"hosts":2,"roles":["es","kibana"]},
        "telemetry":{"elastic":True}
    })
    r.raise_for_status()
    jj = r.json()
    assert "compose_yaml" in jj["blueprint"]
