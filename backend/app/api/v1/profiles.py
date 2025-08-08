from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Optional
from uuid import UUID

from app.db.session import SessionLocal
from app.db import models
from app.core.security import require_role


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

