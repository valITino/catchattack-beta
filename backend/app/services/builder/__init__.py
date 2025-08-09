from typing import get_args
import yaml

from .models import RuleDraft, Operator


def compile_rule(draft: RuleDraft) -> str:
    """Compile a RuleDraft into Sigma YAML string."""
    if not draft.predicates:
        raise ValueError("predicates[] required")

    detection = {}
    condition = ""
    if draft.combine == "all":
        sel = {}
        for p in draft.predicates:
            sel[f"{p.field}|{p.op}"] = p.value
        detection["sel"] = sel
        condition = "sel"
    else:  # any
        sel_names = []
        for idx, p in enumerate(draft.predicates):
            name = f"sel{idx}"
            detection[name] = {f"{p.field}|{p.op}": p.value}
            sel_names.append(name)
        condition = " or ".join(sel_names) if sel_names else ""
    detection["condition"] = condition

    rule = {
        "title": draft.title,
        "description": draft.description,
        "logsource": draft.logsource.model_dump(exclude_none=True),
        "detection": detection,
        "level": draft.level,
        "falsepositives": draft.falsepositives,
        "fields": draft.fields,
    }
    if draft.technique_ids:
        rule["tags"] = [f"attack.{tid}" for tid in draft.technique_ids]

    # Remove empty or None values
    rule = {k: v for k, v in rule.items() if v}

    return yaml.safe_dump(rule, sort_keys=False)


def operator_catalog() -> list[str]:
    return list(get_args(Operator))
