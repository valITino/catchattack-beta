from typing import Dict, List
from sqlalchemy.orm import Session
from app.db import models
from .matrix import compute_coverage

DEFAULT_BASE_WEIGHT = 1.0


def _normalize(name: str) -> str:
    return (name or "").strip().lower()


def _weight_from_profile(tp: models.ThreatProfile | None, technique_id: str) -> float:
    """
    Heuristics:
    - Per-technique override in tp.weights: if provided, use it (float)
    - Boost by simple rules using industry/tech_stack/intel_tags keywords (MVP heuristics)
    """
    if not tp:
        return DEFAULT_BASE_WEIGHT

    # explicit override
    if tp.weights and technique_id in tp.weights:
        try:
            return float(tp.weights[technique_id])
        except Exception:
            pass

    boost = 1.0
    ind = _normalize(tp.industry)
    stack = set([_normalize(x) for x in (tp.tech_stack or [])])
    intel = set([_normalize(x) for x in (tp.intel_tags or [])])

    # naive examples — adjust later:
    if any(k in ind for k in ["finance", "bank"]):
        # finance cares more about credential access, collection, exfiltration
        if (
            technique_id.startswith("T1003")
            or technique_id.startswith("T1114")
            or technique_id.startswith("T1041")
        ):
            boost *= 1.4

    if "windows" in stack:
        if technique_id.startswith("T1059"):  # command and scripting
            boost *= 1.2
    if "linux" in stack:
        if technique_id.startswith("T1059"):
            boost *= 1.1

    if any(k in intel for k in ["ransomware", "initial-access"]):
        if technique_id.startswith("T1190") or technique_id.startswith("T1566"):
            # exploit public-facing, phishing
            boost *= 1.5

    return DEFAULT_BASE_WEIGHT * boost


def prioritize(
    db: Session, tp: models.ThreatProfile | None, collapse_subtechniques: bool = False
) -> List[Dict]:
    """
    priority_score = base_weight * (exposure_weight) * (1 - validated_ratio + gap_bias)
    Where:
      - base_weight from profile heuristics or override
      - exposure_weight approximated by rules_count (more rules -> more activity) but penalize validated coverage
      - gap_bias gives extra push when there are zero validated rules
    """
    cov = compute_coverage(db, collapse_subtechniques)
    out: List[Dict] = []
    for item in cov:
        rules_count = item["rules_count"]
        validated = item["validated_count"]
        validated_ratio = (validated / rules_count) if rules_count > 0 else 0.0
        base_w = _weight_from_profile(tp, item["technique_id"])
        exposure_w = 1.0 + 0.15 * max(0, rules_count - 1)  # small bump for more content
        gap_bias = 0.25 if validated == 0 else 0.0
        score = round(base_w * exposure_w * (1.0 - validated_ratio + gap_bias), 4)
        out.append(
            {
                "technique_id": item["technique_id"],
                "rules_count": rules_count,
                "validated_count": validated,
                "validated_ratio": round(validated_ratio, 4),
                "priority_score": score,
            }
        )
    # Sort high score first
    out.sort(key=lambda x: (-x["priority_score"], x["technique_id"]))
    return out
