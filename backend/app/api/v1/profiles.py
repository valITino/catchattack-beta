from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.db import models
from app.db.schemas import ThreatProfilePayload, ThreatProfileOut
from app.core.security import require_role

router = APIRouter(prefix="/profiles", tags=["profiles"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("", response_model=ThreatProfileOut, summary="Create or update threat profile")
def create_or_update_profile(
    payload: ThreatProfilePayload,
    db: Session = Depends(get_db),
    _user=Depends(require_role("admin", "analyst")),
):
    profile = (
        db.query(models.ThreatProfile)
        .filter(models.ThreatProfile.organization == payload.organization)
        .first()
    )
    if profile:
        profile.industry = payload.industry
        profile.tech_stack = payload.tech_stack or []
        profile.intel_tags = payload.intel_tags or []
        profile.weights = payload.weights
    else:
        profile = models.ThreatProfile(
            organization=payload.organization,
            industry=payload.industry,
            tech_stack=payload.tech_stack or [],
            intel_tags=payload.intel_tags or [],
            weights=payload.weights,
        )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile
