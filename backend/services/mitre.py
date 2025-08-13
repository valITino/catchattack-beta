from typing import List
import time
import json
from pathlib import Path
import logging
import requests

"""Helpers for retrieving MITRE ATT&CK data.

This module attempts to retrieve ATT&CK techniques via the official MITRE
TAXII API. However, the third‑party libraries (``stix2`` and
``taxii2-client``) may not be installed in all environments. To ensure the
module can still be imported and basic functionality is available, the
imports are wrapped in a ``try/except`` block. When the TAXII client
libraries are unavailable, the code will fall back to a static list of
techniques or cached data on disk.  This design allows unit tests to
monkeypatch ``TAXIICollectionSource`` and related classes without import
errors.
"""

try:
    # These imports provide the TAXII client and filtering classes used to
    # query MITRE ATT&CK via the TAXII protocol.  They are optional; if
    # unavailable the module will fall back to other data sources.
    from stix2 import TAXIICollectionSource, Filter  # type: ignore
    from taxii2client.v20 import Collection, Server  # type: ignore
except Exception:
    # If the libraries are not installed, define placeholders so that
    # attributes exist on this module.  Tests can still monkeypatch these
    # names when simulating successful TAXII queries.
    TAXIICollectionSource = None  # type: ignore
    Filter = None  # type: ignore
    Collection = None  # type: ignore
    Server = None  # type: ignore

MITRE_TAXII_URL = "https://cti-taxii.mitre.org/taxii/"
ATTACK_COLLECTION_ID = "95ecc380-afe9-11e4-9b6c-751b66dd541e"  # Enterprise ATT&CK
FALLBACK_URL = (
    "https://raw.githubusercontent.com/mitre/cti/master/enterprise-attack/enterprise-attack.json"
)
CACHE_PATH = Path("generated/mitre_cache.json")

# Built‑in minimal technique set used when all external lookups fail.  This
# ensures that ``fetch_techniques()`` always returns a non‑empty list.  The
# entries here use a subset of the ATT&CK dataset commonly referenced in
# detection engineering and threat hunting.  Additional fields can be added
# as needed by the application.
DEFAULT_TECHNIQUES = [
    {
        "type": "attack-pattern",
        "id": "T1003",
        "name": "Credential Dumping",
        "description": "Adversaries may attempt to dump credentials from a system to obtain account login information.",
    },
    {
        "type": "attack-pattern",
        "id": "T1059",
        "name": "Command and Scripting Interpreter",
        "description": "Adversaries may abuse command and script interpreters to execute commands, scripts, or binaries.",
    },
    {
        "type": "attack-pattern",
        "id": "T1033",
        "name": "Account Discovery",
        "description": "Adversaries may attempt to gather information about active user accounts.",
    },
]

# Cache of ATT&CK techniques to reduce network calls
CACHE: List[dict] = []
LAST_FETCH_TIME: float = 0.0


def get_attack_collection() -> "Collection":
    """Return the ATT&CK collection via TAXII.

    If the TAXII client libraries are unavailable, a ``RuntimeError`` is
    raised.  Callers should handle this and fall back to other data sources.
    """
    if Server is None:
        raise RuntimeError("TAXII client libraries are not installed")
    server = Server(MITRE_TAXII_URL)  # type: ignore[call-arg]
    api_root = server.api_roots[0]
    return api_root.collections[ATTACK_COLLECTION_ID]


def fetch_techniques() -> List[dict]:
    """Return the list of ATT&CK techniques.

    This function first attempts to return cached results.  When the cache is
    stale or empty, it tries (in order):

    1. Fetching from the MITRE TAXII server using the ``stix2`` and
       ``taxii2-client`` libraries.
    2. Downloading the raw JSON from the MITRE GitHub repository.
    3. Reading a previously cached JSON file on disk.
    4. Falling back to a small built‑in list of techniques.

    Each successful fetch will update the in‑memory cache and write it to
    ``CACHE_PATH`` to speed up subsequent calls.
    """
    global CACHE, LAST_FETCH_TIME
    now = time.time()
    # Return cached result if within TTL
    if CACHE and now - LAST_FETCH_TIME < 60 * 60 * 24:
        return CACHE

    # Attempt TAXII fetch if dependencies are available
    if TAXIICollectionSource and Filter and Server:
        try:
            collection = get_attack_collection()
            collection_source = TAXIICollectionSource(collection)  # type: ignore[call-arg]
            filt = Filter("type", "=", "attack-pattern")  # type: ignore[call-arg]
            CACHE = list(collection_source.query([filt]))  # type: ignore[attr-defined]
            logging.info("Fetched %d techniques from TAXII", len(CACHE))
        except Exception as exc:  # noqa: BLE001
            logging.exception("TAXII fetch failed: %s", exc)

    # If TAXII did not populate the cache, try fallback HTTP
    if not CACHE:
        try:
            resp = requests.get(FALLBACK_URL, timeout=30)
            resp.raise_for_status()
            data = resp.json()
            CACHE = [obj for obj in data.get("objects", []) if obj.get("type") == "attack-pattern"]
            logging.info("Fetched %d techniques from fallback", len(CACHE))
        except Exception as exc2:  # noqa: BLE001
            logging.exception("Fallback MITRE fetch failed: %s", exc2)

    # Attempt to load cached data from disk if still empty
    if not CACHE and CACHE_PATH.exists():
        try:
            CACHE = json.loads(CACHE_PATH.read_text())
            logging.info("Loaded %d techniques from cache", len(CACHE))
        except Exception as exc3:  # noqa: BLE001
            logging.exception("Failed to load cache: %s", exc3)

    # Use built‑in defaults if all else failed
    if not CACHE:
        logging.warning("Using built‑in default techniques; ATT&CK data may be incomplete")
        CACHE = DEFAULT_TECHNIQUES.copy()

    # Persist the cache to disk for future runs
    LAST_FETCH_TIME = now
    try:
        CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
        CACHE_PATH.write_text(json.dumps(CACHE))
    except Exception:  # noqa: BLE001
        logging.exception("Failed to write MITRE cache")

    return CACHE
