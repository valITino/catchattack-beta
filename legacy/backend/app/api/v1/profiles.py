from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Optional
from uuid import UUID

from app.db.session import SessionLocal
from app.db import models
from app.core.security import require_role
from app.services.recommendation import recommend_techniques


router = APIRouter(prefix="/profiles", tags=["profiles"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class ProfileIn(BaseModel):
    organization: str
    industry: Optional[str] = None
    tech_stack: List[str] = []
    intel_tags: List[str] = []
    weights: Optional[Dict[str, float]] = None


class ProfileOut(ProfileIn):
    id: UUID


@router.post("", response_model=ProfileOut, summary="Create or update threat profile for an org")
def upsert_profile(
    payload: ProfileIn,
    db: Session = Depends(get_db),
    _user=Depends(require_role("admin", "analyst")),
):
    # For MVP: enforce single profile per organization (latest wins)
    tp = (
        db.query(models.ThreatProfile)
        .filter(models.ThreatProfile.organization == payload.organization)
        .one_or_none()
    )
    if not tp:
        tp = models.ThreatProfile(organization=payload.organization)
    tp.industry = payload.industry
    tp.tech_stack = payload.tech_stack or []
    tp.intel_tags = payload.intel_tags or []
    tp.weights = payload.weights or None
    db.add(tp)
    db.commit()
    db.refresh(tp)
    return ProfileOut.model_validate(tp)


@router.get("/{profile_id}/recommendations", response_model=list[dict], summary="Recommend techniques for a profile")
def profile_recommendations(
    profile_id: UUID,
    top: int = Query(10, ge=1, le=100, description="Maximum number of recommendations to return"),
    include_covered: bool = Query(True, description="Include techniques that already have detection coverage"),
    db: Session = Depends(get_db),
    _user=Depends(require_role("admin", "analyst", "viewer")),
):
    """
    Provide a personalized list of MITRE techniques for the given threat profile.

    Recommendations are based on the organization's technology stack and the
    existing detection coverage.  Techniques with no associated active rules
    appear first.  Use ``include_covered`` to hide techniques that are already
    covered by one or more rules.
    """
    tp = db.get(models.ThreatProfile, profile_id)
    if not tp:
        raise HTTPException(404, "Profile not found")
    return recommend_techniques(db, tp, top_n=top, include_covered=include_covered)

