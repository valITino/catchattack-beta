from __future__ import annotations
from typing import Any  # noqa: F401
from ruamel.yaml import YAML
import io
import hashlib

_yaml = YAML()
_yaml.preserve_quotes = False
_yaml.indent(mapping=2, sequence=2, offset=2)


def normalize_sigma_yaml(yaml_text: str) -> str:
    # Load and re-dump to canonical-ish form: sorted keys for top-level + detection selections
    data = _yaml.load(io.StringIO(yaml_text))
    # Best-effort sort only on plain dicts; keep order for detection if possible
    if isinstance(data, dict):
        # Shallow sort except 'detection'
        det = data.get("detection")
        items = {k: data[k] for k in sorted([k for k in data.keys() if k != "detection"])}
        if det is not None:
            items["detection"] = det
        data = items
    out = io.StringIO()
    _yaml.dump(data, out)
    return out.getvalue().strip() + "\n"


def logic_sha256(yaml_text: str) -> str:
    norm = normalize_sigma_yaml(yaml_text)
    return hashlib.sha256(norm.encode()).hexdigest()
