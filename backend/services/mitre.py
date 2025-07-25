from typing import List
from stix2 import TAXIICollectionSource
from stix2 import Filter
from taxii2client.v20 import Collection, Server

MITRE_TAXII_URL = "https://cti-taxii.mitre.org/taxii/"
ATTACK_COLLECTION_ID = "95ecc380-afe9-11e4-9b6c-751b66dd541e"  # Enterprise ATT&CK


def get_attack_collection() -> Collection:
    server = Server(MITRE_TAXII_URL)
    api_root = server.api_roots[0]
    return api_root.collections[ATTACK_COLLECTION_ID]


def fetch_techniques() -> List[dict]:
    """Fetch the latest ATT&CK techniques."""
    collection = get_attack_collection()
    collection_source = TAXIICollectionSource(collection)
    filt = Filter("type", "=", "attack-pattern")
    return list(collection_source.query([filt]))
