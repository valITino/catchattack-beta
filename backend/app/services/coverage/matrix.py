from typing import Dict, List
from sqlalchemy.orm import Session
from app.db import models


def _technique_root(tid: str) -> str:
    # Collapse subtechniques T1003.001 -> T1003 for matrix aggregation if needed
    return tid.split(".", 1)[0]


def compute_coverage(db: Session, collapse_subtechniques: bool = False) -> List[Dict]:
    """
    Returns list of {technique_id, rules_count, validated_count, rule_ids}
    Collapse sub-techniques if requested.
    """
    # Fetch all rules and their validation presence
    rules = db.query(models.Rule).all()
    # Build set of validated rule ids
    validated_rule_ids = set([
        vs.rule_id
        for vs in db.query(models.ValidationStatus)
        .filter(models.ValidationStatus.support > 0)
        .all()
    ])

    agg: Dict[str, Dict] = {}
    for r in rules:
        if not r.attack_techniques:
            continue
        for t in r.attack_techniques:
            key = _technique_root(t) if collapse_subtechniques else t
            entry = agg.setdefault(
                key,
                {
                    "technique_id": key,
                    "rules_count": 0,
                    "validated_count": 0,
                    "rule_ids": [],
                },
            )
            entry["rules_count"] += 1
            entry["rule_ids"].append(str(r.id))
            if r.id in validated_rule_ids:
                entry["validated_count"] += 1

    # Sort by technique id for stability
    return sorted(agg.values(), key=lambda x: x["technique_id"])
