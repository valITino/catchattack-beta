from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from app.db.session import SessionLocal
from app.core.security import require_role
from app.services.coverage.matrix import compute_coverage


router = APIRouter(prefix="/coverage", tags=["coverage"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("", summary="Get coverage per technique", response_model=List[dict])
def get_coverage(
    collapse_subtechniques: bool = Query(False),
    db: Session = Depends(get_db),
    _user=Depends(require_role("admin", "analyst", "viewer")),
):
    return compute_coverage(db, collapse_subtechniques=collapse_subtechniques)

