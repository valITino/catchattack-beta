import os
import requests
import logging
from typing import List, Dict, Any

TIMEOUT = 10


def _enabled() -> bool:
    return all(
        [os.getenv("CALDERA_URL"), os.getenv("CALDERA_USER"), os.getenv("CALDERA_PASS")]
    )


def _request(path: str) -> Any:
    base = os.getenv("CALDERA_URL", "")
    user = os.getenv("CALDERA_USER", "")
    pwd = os.getenv("CALDERA_PASS", "")
    resp = requests.get(f"{base}{path}", auth=(user, pwd), timeout=TIMEOUT)
    resp.raise_for_status()
    return resp.json()


def get_abilities(tech_id: str) -> Any:
    if not _enabled():
        return {"status": "disabled"}
    try:
        data = _request(f"/api/v2/abilities?technique_id={tech_id}")
        return data
    except Exception as exc:  # noqa: BLE001
        logging.exception("CALDERA abilities error: %s", exc)
        return []
