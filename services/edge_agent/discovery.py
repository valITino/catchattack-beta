import os
import socket
import platform
import subprocess
import shutil
import time
from typing import Optional, Dict, Any, List

import psutil
import requests

from .models import AssetEvent, Asset, Vuln, Health

def collect_from_edr() -> Optional[Dict[str, Any]]:
    url = os.getenv("EDR_API_URL")
    token = os.getenv("EDR_API_TOKEN", "")
    if not url:
        return None
    try:
        resp = requests.get(url, headers={"Authorization": f"Bearer {token}"} if token else {}, timeout=10)
        if resp.status_code == 200:
            return resp.json()
    except Exception:
        pass
    return None

def collect_from_scanner() -> Optional[Dict[str, Any]]:
    url = os.getenv("NESSUS_API_URL")
    token = os.getenv("NESSUS_API_TOKEN", "")
    if not url:
        return None
    try:
        resp = requests.get(url, headers={"Authorization": f"Bearer {token}"} if token else {}, timeout=10)
        if resp.status_code == 200:
            return resp.json()
    except Exception:
        pass
    return None

def collect_self_managed() -> Dict[str, Any]:
    hostname = socket.gethostname()
    ip = socket.gethostbyname(hostname)
    os_name = platform.platform()
    cpu = psutil.cpu_percent(interval=1)
    mem = psutil.virtual_memory().percent
    disk = psutil.disk_usage("/").percent
    vulns: List[Dict[str, Any]] = []
    if shutil.which("osqueryi"):
        try:
            proc = subprocess.run(
                ["osqueryi", "--json", "SELECT name, version FROM os_version;"],
                capture_output=True,
                text=True,
                timeout=5,
            )
            if proc.returncode == 0:
                import json
                results = json.loads(proc.stdout)
                vulns = [{"id": f"{row['name']}-{row['version']}", "cvss": 0.0} for row in results]
        except Exception:
            pass
    return {
        "asset": {"hostname": hostname, "ip": ip, "os": os_name},
        "vulnerabilities": vulns,
        "health": {"cpu": cpu, "mem": mem, "disk": disk},
    }

def collect_asset_event(tenant_id: str) -> AssetEvent:
    data = collect_from_edr() or collect_from_scanner() or collect_self_managed()
    asset = data.get("asset", {})
    vulns = data.get("vulnerabilities", [])
    health = data.get("health", {})
    return AssetEvent(
        tenant_id=tenant_id,
        timestamp=int(time.time() * 1000),
        asset=Asset(**asset),
        vulnerabilities=[Vuln(**v) for v in vulns],
        health=Health(**health),
    )
