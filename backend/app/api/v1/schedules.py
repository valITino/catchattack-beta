from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List
from uuid import UUID
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.db import models
from app.core.security import require_role
from app.services.validation.scheduler import _execute_schedule

router = APIRouter(prefix="/schedules", tags=["schedules"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("", response_model=dict)
def create_schedule(
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    _=Depends(require_role("admin","analyst")),
):
    row = models.ValidationSchedule(
        name=payload["name"],
        cron=payload.get("cron","0 2 * * *"),
        dataset_uri=payload["dataset_uri"],
        engine=payload.get("engine","local"),
        techniques=payload.get("techniques"),
        rule_ids=payload.get("rule_ids"),
        auto_index=bool(payload.get("auto_index", False)),
        enabled=bool(payload.get("enabled", True)),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"id": str(row.id)}


@router.get("", response_model=List[dict])
def list_schedules(
    db: Session = Depends(get_db),
    _=Depends(require_role("admin","analyst","viewer")),
):
    out = []
    for s in db.query(models.ValidationSchedule).order_by(models.ValidationSchedule.created_at.desc()).all():
        out.append({
            "id": str(s.id),
            "name": s.name,
            "cron": s.cron,
            "dataset_uri": s.dataset_uri,
            "engine": s.engine,
            "techniques": s.techniques or [],
            "enabled": s.enabled,
            "last_run_at": s.last_run_at,
        })
    return out


@router.put("/{sid}", response_model=dict)
def update_schedule(
    sid: UUID,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    _=Depends(require_role("admin","analyst")),
):
    s = db.get(models.ValidationSchedule, sid)
    if not s:
        raise HTTPException(404, "not found")
    for k in ["name","cron","dataset_uri","engine","techniques","rule_ids","auto_index","enabled"]:
        if k in payload:
            setattr(s, k, payload[k])
    db.add(s)
    db.commit()
    db.refresh(s)
    return {"ok": True}


@router.post("/{sid}/run", response_model=dict)
def run_schedule_now(
    sid: UUID,
    db: Session = Depends(get_db),
    _=Depends(require_role("admin","analyst")),
):
    s = db.get(models.ValidationSchedule, sid)
    if not s:
        raise HTTPException(404, "not found")
    _execute_schedule(db, s)
    return {"ok": True, "last_run_at": s.last_run_at}
