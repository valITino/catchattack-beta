from typing import Dict
import yaml

from . import mitre


def generate_sigma_rule(technique_id: str) -> Dict[str, str]:
    """Generate a simple Sigma rule for a given MITRE technique."""
    techniques = mitre.fetch_techniques()
    technique = next((t for t in techniques if t.get("id") == technique_id), None)
    if not technique:
        raise ValueError(f"Technique {technique_id} not found")

    rule_dict = {
        "title": f"Detection rule for {technique.get('name')}",
        "id": technique_id,
        "description": technique.get("description", ""),
        "status": "experimental",
        "references": [f"https://attack.mitre.org/techniques/{technique_id}/"],
        "logsource": {"product": "windows"},
        "detection": {"selection": {"EventID": 1}, "condition": "selection"},
        "falsepositives": ["Unknown"],
        "level": "medium",
    }

    rule_yaml = yaml.safe_dump(rule_dict, sort_keys=False)

    return {
        "title": rule_dict["title"],
        "status": "generated",
        "rule": rule_yaml,
        "reference": f"https://attack.mitre.org/techniques/{technique_id}/",
    }
