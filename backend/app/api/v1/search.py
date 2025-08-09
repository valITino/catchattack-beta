from fastapi import APIRouter, Depends, Query
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from ...db.session import SessionLocal
from ...db import models
from ...core.security import require_role

router = APIRouter(prefix="/search", tags=["search"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/rules", response_model=list[dict], summary="Search rules")
def search_rules(
    q: Optional[str] = Query(None),
    technique: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    _=Depends(require_role("admin","analyst","viewer"))
):
    query = db.query(models.Rule)
    if q:
        pat = f"%{q}%"
        query = query.filter(or_(
            models.Rule.name.ilike(pat),
            models.Rule.description.ilike(pat),
            models.Rule.sigma_yaml.ilike(pat),
        ))
    if technique:
        if db.bind.dialect.name == "postgresql":
            query = query.filter(models.Rule.attack_techniques.op("&&")([technique]))
        else:
            query = query.filter(models.Rule.attack_techniques.any(technique))
    if status:
        query = query.filter(models.Rule.status == status)
    query = query.order_by(models.Rule.updated_at.desc()).limit(limit)
    rows = query.all()
    return [
        {
            "id": str(r.id),
            "name": r.name,
            "status": r.status.value if hasattr(r.status, "value") else r.status,
            "techniques": r.attack_techniques or [],
            "updated_at": r.updated_at,
        }
        for r in rows
    ]
