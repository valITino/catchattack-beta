from typing import List
import time
import json
from pathlib import Path
import logging
import requests

from stix2 import TAXIICollectionSource
from stix2 import Filter
from taxii2client.v20 import Collection, Server

MITRE_TAXII_URL = "https://cti-taxii.mitre.org/taxii/"
ATTACK_COLLECTION_ID = "95ecc380-afe9-11e4-9b6c-751b66dd541e"  # Enterprise ATT&CK
FALLBACK_URL = (
    "https://raw.githubusercontent.com/mitre/cti/master/enterprise-attack/enterprise-attack.json"
)
CACHE_PATH = Path("generated/mitre_cache.json")

# Cache of ATT&CK techniques to reduce network calls
CACHE: List[dict] = []
LAST_FETCH_TIME: float = 0.0


def get_attack_collection() -> Collection:
    server = Server(MITRE_TAXII_URL)
    api_root = server.api_roots[0]
    return api_root.collections[ATTACK_COLLECTION_ID]


def fetch_techniques() -> List[dict]:
    """Fetch the latest ATT&CK techniques.

    Results are cached for 24 hours to avoid unnecessary TAXII requests.
    """
    global CACHE, LAST_FETCH_TIME

    now = time.time()
    if CACHE and now - LAST_FETCH_TIME < 60 * 60 * 24:
        return CACHE

    try:
        collection = get_attack_collection()
        collection_source = TAXIICollectionSource(collection)
        filt = Filter("type", "=", "attack-pattern")
        CACHE = list(collection_source.query([filt]))
        logging.info("Fetched %d techniques from TAXII", len(CACHE))
    except Exception as exc:  # noqa: BLE001
        logging.exception("TAXII fetch failed: %s", exc)
        try:
            resp = requests.get(FALLBACK_URL, timeout=30)
            resp.raise_for_status()
            data = resp.json()
            CACHE = [obj for obj in data.get("objects", []) if obj.get("type") == "attack-pattern"]
            logging.info("Fetched %d techniques from fallback", len(CACHE))
        except Exception as exc2:  # noqa: BLE001
            logging.exception("Fallback MITRE fetch failed: %s", exc2)
            if CACHE_PATH.exists():
                try:
                    CACHE = json.loads(CACHE_PATH.read_text())
                    logging.info("Loaded %d techniques from cache", len(CACHE))
                except Exception as exc3:  # noqa: BLE001
                    logging.exception("Failed to load cache: %s", exc3)
                    raise RuntimeError("Failed to fetch MITRE data") from exc2
            else:
                raise RuntimeError("Failed to fetch MITRE data") from exc2

    LAST_FETCH_TIME = now
    try:
        CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
        CACHE_PATH.write_text(json.dumps(CACHE))
    except Exception:  # noqa: BLE001
        logging.exception("Failed to write MITRE cache")

    return CACHE
