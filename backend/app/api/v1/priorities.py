from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from app.db.session import SessionLocal
from app.db import models
from app.core.security import require_role
from app.services.coverage.prioritizer import prioritize


router = APIRouter(prefix="/priorities", tags=["priorities"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("", summary="Rank techniques by priority", response_model=List[dict])
def get_priorities(
    organization: Optional[str] = Query(None, description="If set, use this org's profile"),
    collapse_subtechniques: bool = Query(False),
    db: Session = Depends(get_db),
    _user=Depends(require_role("admin", "analyst", "viewer")),
):
    tp = None
    if organization:
        tp = (
            db.query(models.ThreatProfile)
            .filter(models.ThreatProfile.organization == organization)
            .one_or_none()
        )
    return prioritize(db, tp, collapse_subtechniques=collapse_subtechniques)

