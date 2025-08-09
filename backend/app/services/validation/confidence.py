from __future__ import annotations
from datetime import datetime, timezone
from typing import List, Dict, Any
from math import exp


def _sigmoid(x: float) -> float:
    return 1.0 / (1.0 + exp(-x))


def compute_confidence(
    *,
    hits: int,
    total_events: int,
    sample_events: List[Dict[str, Any]] | None,
    last_eval: datetime | None,
) -> dict:
    ehr = min(max((hits / total_events) if total_events > 0 else 0.0, 0.0), 1.0)
    uniq = set()
    if sample_events:
        for ev in sample_events:
            cur = ev
            for p in ("host", "name"):
                if isinstance(cur, dict) and p in cur:
                    cur = cur[p]
                else:
                    cur = None
                    break
            if isinstance(cur, str):
                uniq.add(cur)
    div = min(len(uniq), 5) / 5.0
    if not last_eval:
        fresh = 0.0
    else:
        days = max((datetime.now(timezone.utc) - last_eval).days, 0)
        fresh = max(0.0, 1.0 - (days / 30.0))
    z = 2.0 * ehr + 1.5 * div + 1.0 * fresh
    conf = round(_sigmoid(z), 4)
    return {
        "confidence": conf,
        "recent_hit_rate": round(ehr, 4),
        "sample_diversity": round(div, 4),
        "data_freshness": round(fresh, 4),
    }
