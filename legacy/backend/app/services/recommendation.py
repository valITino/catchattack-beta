"""
Utility functions for recommending techniques and detections based on a threat
profile.  These helpers enable CatchAttack to offer personalized guidance
similar to SnapAttack's threat profile recommendations.

The recommendation engine leverages MITRE ATT&CK metadata and the existing
rules stored in the database to identify which techniques are relevant to
the organization's environment and where detection coverage is lacking.

If external dependencies for fetching MITRE data (e.g., ``stix2`` or
``taxii2-client``) are unavailable, a small built-in default list of
techniques will be used instead.  See ``app.services.mitre`` for more
details.
"""

from __future__ import annotations

from typing import List, Dict, Optional
from sqlalchemy.orm import Session

from app.db import models
from app.services import mitre


def _root_id(tid: str) -> str:
    """Normalize a technique ID by stripping sub-technique suffix."""
    return tid.split(".", 1)[0]


def recommend_techniques(
    db: Session,
    profile: models.ThreatProfile,
    top_n: int = 10,
    include_covered: bool = True,
) -> List[Dict[str, object]]:
    """
    Generate a list of recommended MITRE techniques for a given threat profile.

    The algorithm works as follows:
    1. Fetch the MITRE technique catalog via ``app.services.mitre.fetch_techniques``.
       If the catalog cannot be fetched (e.g., due to missing dependencies or
       offline conditions), a built-in fallback list will be used instead.
    2. Filter techniques by the profile's declared ``tech_stack`` (platforms).
       If the profile specifies a list of technology stacks (e.g., windows,
       linux, cloud), only techniques that list one of those platforms in
       ``x_mitre_platforms`` are considered.  If no tech_stack is defined,
       all techniques are considered.
    3. For each candidate technique, compute whether there is at least one
       active rule covering that technique (based on the ``attack_techniques``
       field of each rule).  Coverage is aggregated by root technique ID
       (e.g., T1003 covers T1003.001).
    4. Sort recommendations so that techniques with zero coverage appear
       first.  Techniques with more rules are sorted ascending by their
       ``rule_count``.  The list is truncated to ``top_n`` items.

    Args:
        db: Database session for querying rules.
        profile: The threat profile to base recommendations on.
        top_n: Maximum number of recommendations to return.
        include_covered: Whether to include techniques that already have
            coverage.  When False, only uncovered techniques will be returned.

    Returns:
        A list of dictionaries with keys: ``technique_id``, ``name``,
        ``platforms``, ``covered`` (bool), ``rule_count`` (int).
    """
    # Fetch MITRE technique catalog.  ``fetch_techniques`` handles caching and
    # fallbacks if external dependencies are missing.
    try:
        techniques = mitre.fetch_techniques()
    except Exception:
        # ``fetch_techniques`` should already return a fallback, but catch
        # unexpected exceptions just in case.
        techniques = []

    # Build coverage map: root technique ID -> number of active rules
    coverage: Dict[str, int] = {}
    rules = (
        db.query(models.Rule)
        .filter(models.Rule.status == models.RuleStatus.active)
        .all()
    )
    for r in rules:
        for tid in r.attack_techniques or []:
            root = _root_id(tid)
            coverage[root] = coverage.get(root, 0) + 1

    # Normalize profile tech stack to lowercase for comparison
    stack = [s.lower() for s in (profile.tech_stack or []) if isinstance(s, str)]

    recs: List[Dict[str, object]] = []
    for t in techniques:
        tid: Optional[str] = t.get("id")
        if not tid or not isinstance(tid, str):
            continue
        root = _root_id(tid)
        platforms = [p.lower() for p in t.get("x_mitre_platforms", []) if isinstance(p, str)]
        # If a tech stack is specified, filter techniques whose platforms overlap
        if stack and not any(p in stack for p in platforms):
            continue
        rule_count = coverage.get(root, 0)
        covered = rule_count > 0
        if not include_covered and covered:
            continue
        recs.append(
            {
                "technique_id": tid,
                "name": t.get("name", ""),
                "platforms": platforms,
                "covered": covered,
                "rule_count": rule_count,
            }
        )

    # Sort: uncovered techniques first (rule_count == 0), then by rule_count ascending
    recs.sort(key=lambda x: (0 if x["rule_count"] == 0 else 1, x["rule_count"]))
    return recs[:top_n]