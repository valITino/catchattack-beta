from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from app.db.session import SessionLocal
from app.db import models
from app.core.security import require_role

router = APIRouter(prefix="/rules", tags=["health"])

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

@router.get("/{rule_id}/health", response_model=dict)
def rule_health(rule_id: UUID, db: Session = Depends(get_db), _=Depends(require_role("admin","analyst","viewer"))):
    r = db.get(models.Rule, rule_id)
    if not r: raise HTTPException(404, "Rule not found")
    vs = db.get(models.ValidationStatus, rule_id)
    return {
        "rule_id": str(rule_id),
        "status": getattr(r.status, "value", r.status),
        "confidence": getattr(vs, "confidence", None),
        "recent_hit_rate": getattr(vs, "recent_hit_rate", None),
        "sample_diversity": getattr(vs, "sample_diversity", None),
        "data_freshness": getattr(vs, "data_freshness", None),
        "last_validated_at": getattr(vs, "last_validated_at", None),
    }
