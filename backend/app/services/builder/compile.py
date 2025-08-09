from __future__ import annotations
from typing import Dict
import uuid
from ruamel.yaml import YAML
import io
from .models import RuleDraft, Predicate

_yaml = YAML()
_yaml.indent(mapping=2, sequence=2, offset=2)
_yaml.preserve_quotes = True

# Map builder ops to Sigma field modifiers
_OP_MAP = {
    "equals": "|equals",
    "contains": "|contains",
    "startswith": "|startswith",
    "endswith": "|endswith",
    "in": "|in",
    "regex": "|re",
    "gt": "|gt",
    "gte": "|gte",
    "lt": "|lt",
    "lte": "|lte",
}


def _predicate_to_kv(p: Predicate):
    mod = _OP_MAP[p.op]
    key = f"{p.field}{mod}"
    val = p.value
    return key, val


def compile_sigma_from_draft(draft: RuleDraft) -> str:
    """Render a Sigma v2 YAML from the draft."""
    detection: Dict[str, Dict] = {}

    if draft.combine == "all" and draft.predicates:
        sel = {}
        for pred in draft.predicates:
            k, v = _predicate_to_kv(pred)
            sel[k] = v
        detection["sel"] = sel
        detection["condition"] = "sel"
    else:
        for i, pred in enumerate(draft.predicates):
            sel_name = f"sel{i}"
            k, v = _predicate_to_kv(pred)
            detection.setdefault(sel_name, {})[k] = v
        if not draft.predicates:
            condition = "1 of them"
        else:
            joiner = " or " if draft.combine == "any" else " and "
            condition = joiner.join([f"sel{i}" for i in range(len(draft.predicates))])
        detection["condition"] = condition

    body = {
        "title": draft.title,
        "id": str(uuid.uuid4()),
        "logsource": {k: v for k, v in draft.logsource.model_dump().items() if v},
        "detection": detection,
        "fields": draft.fields or [],
        "falsepositives": draft.falsepositives or [],
        "level": draft.level,
    }
    # ATT&CK technique IDs as tags (common convention)
    if draft.technique_ids:
        body["tags"] = [*draft.technique_ids]

    buf = io.StringIO()
    _yaml.dump(body, buf)
    return buf.getvalue()
