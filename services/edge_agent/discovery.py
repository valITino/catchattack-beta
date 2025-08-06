import json
import os
import platform
import shutil
import socket
import subprocess
import time
from typing import Any, Dict, List, Optional

import psutil
import requests

from .models import AssetEvent


def collect_from_edr() -> Optional[Dict[str, Any]]:
    """Collect asset data from an external EDR/XDR API.

    Reads ``EDR_API_URL`` and ``EDR_API_TOKEN`` from the environment and makes a
    GET request. Returns a dictionary with ``asset``, ``vulnerabilities`` and
    ``health`` keys on success. If configuration is missing or the request fails
    ``None`` is returned.
    """
    url = os.getenv("EDR_API_URL")
    token = os.getenv("EDR_API_TOKEN")
    if not url or not token:
        return None
    try:
        resp = requests.get(url, headers={"Authorization": f"Bearer {token}"}, timeout=5)
        resp.raise_for_status()
        data = resp.json()
    except Exception:
        return None
    # TODO: Parse vendor specific schema
    return {
        "asset": data.get("asset"),
        "vulnerabilities": data.get("vulnerabilities", []),
        "health": data.get("health"),
    }


def collect_from_scanner() -> Optional[Dict[str, Any]]:
    """Collect vulnerability data from a scanner API such as Nessus."""
    url = os.getenv("NESSUS_API_URL")
    token = os.getenv("NESSUS_API_TOKEN")
    if not url or not token:
        return None
    try:
        resp = requests.get(url, headers={"Authorization": f"Bearer {token}"}, timeout=5)
        resp.raise_for_status()
        data = resp.json()
    except Exception:
        return None
    # TODO: Parse vendor specific schema
    return {
        "asset": data.get("asset"),
        "vulnerabilities": data.get("vulnerabilities", []),
        "health": data.get("health"),
    }


def _ip_addresses() -> List[str]:
    addrs: List[str] = []
    for iface in psutil.net_if_addrs().values():
        for addr in iface:
            if addr.family == socket.AF_INET:
                addrs.append(addr.address)
    return addrs


def _installed_packages() -> List[str]:
    system = platform.system().lower()
    commands: List[List[str]] = []
    if system == "linux":
        commands = [["dpkg", "-l"]]
    elif system == "windows":
        commands = [["wmic", "product", "get", "name,version"]]
    elif system == "darwin":
        commands = [["brew", "list"]]
    packages: List[str] = []
    for cmd in commands:
        try:
            proc = subprocess.run(cmd, capture_output=True, text=True, check=False)
            if proc.stdout:
                packages.extend(proc.stdout.splitlines())
        except Exception:
            continue
    return packages


def _open_ports() -> List[str]:
    commands = [["lsof", "-i"], ["netstat", "-an"]]
    ports: List[str] = []
    for cmd in commands:
        try:
            proc = subprocess.run(cmd, capture_output=True, text=True, check=False)
            if proc.stdout:
                ports.extend(proc.stdout.splitlines())
                break
        except Exception:
            continue
    return ports


def collect_self_managed() -> Dict[str, Any]:
    """Perform self-managed host discovery using local tooling."""
    hostname = platform.node()
    ips = _ip_addresses()
    os_name = f"{platform.system()} {platform.version()}"
    cpu = psutil.cpu_percent(interval=0.1)
    mem = psutil.virtual_memory().percent
    disk = psutil.disk_usage("/").percent
    _installed_packages()  # collected but not yet emitted
    _open_ports()  # collected but not yet emitted
    osquery_data = None
    osquery_path = shutil.which("osqueryi")
    if osquery_path:
        try:
            proc = subprocess.run(
                [osquery_path, "--json", "SELECT name, version FROM os_version"],
                capture_output=True,
                text=True,
                check=False,
            )
            if proc.stdout:
                osquery_data = json.loads(proc.stdout)
        except Exception:
            osquery_data = None
    # TODO: incorporate ``osquery_data`` when schema allows
    asset = {"hostname": hostname, "ip": ips[0] if ips else "", "os": os_name}
    return {
        "asset": asset,
        "vulnerabilities": [],
        "health": {"cpu": cpu, "mem": mem, "disk": disk},
    }


def collect_asset_event(tenant_id: str) -> AssetEvent:
    """Attempt external collection, falling back to self-managed discovery."""
    data = collect_from_edr() or collect_from_scanner()
    self_data: Optional[Dict[str, Any]] = None
    if data is None:
        data = collect_self_managed()
    else:
        missing = [k for k in ("asset", "vulnerabilities", "health") if not data.get(k)]
        if missing:
            self_data = collect_self_managed()
            for k in missing:
                data[k] = self_data.get(k)
    event_dict: Dict[str, Any] = {
        "tenant_id": tenant_id,
        "timestamp": int(time.time() * 1000),
        **data,
    }
    return AssetEvent(**event_dict)
