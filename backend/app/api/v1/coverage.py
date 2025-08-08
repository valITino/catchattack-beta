from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.db.session import SessionLocal
from app.db import models
from app.db.schemas import CoverageItem, PriorityItem
from app.services.coverage.matrix import compute_coverage
from app.services.coverage.prioritizer import prioritize
from app.core.security import require_role

router = APIRouter(tags=["coverage"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/coverage", summary="Coverage stats", response_model=List[CoverageItem])
def get_coverage(
    collapse_subtechniques: bool = Query(False),
    db: Session = Depends(get_db),
    _user=Depends(require_role("admin", "analyst", "viewer")),
):
    return compute_coverage(db, collapse_subtechniques)

@router.get("/priorities", summary="Technique priorities", response_model=List[PriorityItem])
def get_priorities(
    profile_id: UUID | None = Query(None),
    collapse_subtechniques: bool = Query(False),
    db: Session = Depends(get_db),
    _user=Depends(require_role("admin", "analyst", "viewer")),
):
    tp = db.get(models.ThreatProfile, profile_id) if profile_id else None
    return prioritize(db, tp, collapse_subtechniques)
