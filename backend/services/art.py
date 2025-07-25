import json
import logging
import time
from pathlib import Path
from typing import List, Dict

import requests
import yaml

BASE_URL = "https://raw.githubusercontent.com/redcanaryco/atomic-red-team/master/atomics"
CACHE_DIR = Path("generated/atomic_tests")
CACHE_DIR.mkdir(parents=True, exist_ok=True)

_CACHE: Dict[str, List[dict]] = {}
_LAST_FETCH: Dict[str, float] = {}
_TTL = 60 * 60 * 24  # 24h


def get_atomic_tests(tech_id: str) -> List[dict]:
    """Return Atomic Red Team tests for a technique.

    Tests are cached on disk for 24 hours.
    """
    now = time.time()
    if tech_id in _CACHE and now - _LAST_FETCH.get(tech_id, 0) < _TTL:
        return _CACHE[tech_id]

    url = f"{BASE_URL}/{tech_id}/{tech_id}.yaml"
    cache_file = CACHE_DIR / f"{tech_id}.json"
    try:
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        data = yaml.safe_load(resp.text) or {}
        tests = data.get("atomic_tests", [])
        _CACHE[tech_id] = tests
        _LAST_FETCH[tech_id] = now
        cache_file.write_text(json.dumps(tests))
        return tests
    except Exception as exc:  # noqa: BLE001
        logging.exception("Atomic fetch failed: %s", exc)
        if cache_file.exists():
            try:
                tests = json.loads(cache_file.read_text())
                _CACHE[tech_id] = tests
                _LAST_FETCH[tech_id] = now
                return tests
            except Exception:  # noqa: BLE001
                logging.exception("Failed to load cached atomic tests")
        return []
