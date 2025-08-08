import requests, json, os, sys
API=os.getenv("API","http://localhost:8000/api/v1")

def token(u="analyst",p=None):
    p=p or f"{u}pass"
    r=requests.post(f"{API}/auth/token", data={"username":u,"password":p}); r.raise_for_status()
    return r.json()["access_token"]

def create_rule(tok, name, techs, yml, status="active"):
    r=requests.post(f"{API}/rules", headers={"Authorization":f"Bearer {tok}"}, json={
        "name":name,"description":"","attack_techniques":techs,"sigma_yaml":yml,"status":status
    }); r.raise_for_status(); return r.json()["id"]

def main():
    atok=token("analyst")
    ah={"Authorization":f"Bearer {atok}"}
    # seed rules
    seeds=["pow-enc.yaml","cmd-exec.yaml","reg-runkeys.yaml"]
    ids=[]
    for s in seeds:
        y=open(f"ops/seeds/rules/{s}","r",encoding="utf-8").read()
        techs={"pow-enc.yaml":["T1059.001"],"cmd-exec.yaml":["T1059"],"reg-runkeys.yaml":["T1547.001"]}[s]
        rid=create_rule(atok, s.replace(".yaml",""), techs, y, "active")
        ids.append(rid)

    # profile
    requests.post(f"{API}/profiles", headers=ah, json={
        "organization":"AcmeBank","industry":"Finance","tech_stack":["Windows","Elastic"],"intel_tags":["ransomware"],"weights":{"T1059":1.8}
    }).raise_for_status()

    # run
    r=requests.post(f"{API}/runs", headers=ah, files={"name":(None,"demo"),"source":(None,"local")}); r.raise_for_status()
    rid=r.json()["id"]
    requests.post(f"{API}/runs/{rid}/start", headers=ah).raise_for_status()
    with open("ops/seeds/telemetry/windows.ndjson","rb") as f:
        requests.post(f"{API}/runs/{rid}/ingest?auto_index=true", headers=ah, files={"file":("windows.ndjson", f, "application/x-ndjson")}).raise_for_status()
    ev=requests.post(f"{API}/runs/{rid}/evaluate?engine=local", headers=ah); ev.raise_for_status()
    print("EVAL:", ev.json())

    # deploy to elastic as admin
    admtok=token("admin"); adh={"Authorization":f"Bearer {admtok}","Content-Type":"application/json"}
    payload={"rules":[{"rule_id":r} for r in ids]}
    dj=requests.post(f"{API}/deploy/elastic", headers=adh, json=payload); dj.raise_for_status()
    print("DEPLOY JOB:", dj.json())

    # show coverage/priorities
    cov=requests.get(f"{API}/coverage", headers=ah).json()
    pri=requests.get(f"{API}/priorities?organization=AcmeBank", headers=ah).json()
    print("COVERAGE:", cov); print("PRIORITIES:", pri[:3])

if __name__=="__main__":
    main()
