from fastapi import APIRouter, Depends, Body, HTTPException
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.core.security import require_role
from app.db import models
from app.services.imports.folder import import_sigma_folder

router = APIRouter(prefix="/imports", tags=["imports"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/folder", response_model=dict, summary="Import Sigma rules from a folder")
def import_folder(payload: dict = Body(...), db: Session = Depends(get_db), _=Depends(require_role("admin","analyst"))):
    folder = payload.get("folder")
    if not folder:
        raise HTTPException(400, "folder is required (container path)")
    techs = payload.get("default_techniques") or []
    res = import_sigma_folder(db, folder, techs)
    return res

@router.get("/logs", response_model=list[dict], summary="List import logs")
def list_logs(db: Session = Depends(get_db), _=Depends(require_role("admin","analyst","viewer"))):
    logs = db.query(models.ImportLog).order_by(models.ImportLog.created_at.desc()).limit(50).all()
    out=[]
    for l in logs:
        out.append({"id": str(l.id), "source": l.source, "uri": l.uri, "total": l.total, "inserted": l.inserted, "deduped": l.deduped, "errors": l.errors, "created_at": l.created_at})
    return out
