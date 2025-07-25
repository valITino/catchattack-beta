from typing import List
import time

from stix2 import TAXIICollectionSource
from stix2 import Filter
from taxii2client.v20 import Collection, Server

MITRE_TAXII_URL = "https://cti-taxii.mitre.org/taxii/"
ATTACK_COLLECTION_ID = "95ecc380-afe9-11e4-9b6c-751b66dd541e"  # Enterprise ATT&CK

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

    collection = get_attack_collection()
    collection_source = TAXIICollectionSource(collection)
    filt = Filter("type", "=", "attack-pattern")
    CACHE = list(collection_source.query([filt]))
    LAST_FETCH_TIME = now
    return CACHE
