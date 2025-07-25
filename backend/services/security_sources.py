from typing import Optional, Dict, Any

from . import mitre
from . import art
from . import caldera


def get_techniques() -> list[dict]:
    return mitre.fetch_techniques()


def get_full_technique(tech_id: str) -> Optional[Dict[str, Any]]:
    techs = mitre.fetch_techniques()
    technique = next((t for t in techs if t.get("id") == tech_id), None)
    if not technique:
        return None

    atomic_tests = art.get_atomic_tests(tech_id)
    caldera_abilities = caldera.get_abilities(tech_id)
    return {
        "technique": {
            "id": tech_id,
            "name": technique.get("name"),
            "description": technique.get("description"),
            "platforms": technique.get("x_mitre_platforms", []),
            "data_sources": technique.get("x_mitre_data_sources", []),
        },
        "atomic_tests": atomic_tests,
        "caldera_abilities": caldera_abilities,
    }
