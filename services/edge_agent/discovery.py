import json
import os
import platform
import socket
import shutil
import subprocess
import time
from typing import Any

import psutil
import requests

from .models import AssetEvent


def collect_from_edr() -> dict | None:
    url = os.getenv("EDR_API_URL")
    if not url:
        return None
    headers: dict[str, str] = {}
    token = os.getenv("EDR_API_TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"
    try:
        resp = requests.get(url, headers=headers, timeout=5)
        if resp.status_code != 200:
            return None
        data = resp.json()
    except Exception:
        return None
    return {
        "asset": data.get("asset"),
        "vulnerabilities": data.get("vulnerabilities", []),
        "health": data.get("health"),
    }


def collect_from_scanner() -> dict | None:
    url = os.getenv("NESSUS_API_URL")
    if not url:
        return None
    headers: dict[str, str] = {}
    token = os.getenv("NESSUS_API_TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"
    try:
        resp = requests.get(url, headers=headers, timeout=5)
        if resp.status_code != 200:
            return None
        data = resp.json()
    except Exception:
        return None
    return {
        "asset": data.get("asset"),
        "vulnerabilities": data.get("vulnerabilities", []),
        "health": data.get("health"),
    }


def collect_self_managed() -> dict:
    hostname = socket.gethostname()
    try:
        ip = socket.gethostbyname(hostname)
    except Exception:
        ip = ""
    os_name = platform.platform()
    cpu = psutil.cpu_percent()
    mem = psutil.virtual_memory().percent
    disk = psutil.disk_usage("/").percent
    vulns: list[dict[str, Any]] = []
    if shutil.which("osqueryi") is not None:
        try:
            proc = subprocess.run(
                ["osqueryi", "--json", "SELECT name, version FROM os_version"],
                capture_output=True,
                text=True,
                check=False,
            )
            if proc.stdout:
                rows = json.loads(proc.stdout)
                vulns = [{"id": row.get("name", ""), "cvss": 0.0} for row in rows]
        except Exception:
            vulns = []
    return {
        "asset": {"hostname": hostname, "ip": ip, "os": os_name},
        "vulnerabilities": vulns,
        "health": {"cpu": cpu, "mem": mem, "disk": disk},
    }


def collect_asset_event(tenant_id: str) -> AssetEvent:
    data = collect_from_edr()
    if data is None:
        data = collect_from_scanner()
    if data is None:
        data = collect_self_managed()
    event_dict: dict[str, Any] = {
        "tenant_id": tenant_id,
        "timestamp": int(time.time() * 1000),
        **data,
    }
    return AssetEvent(**event_dict)
