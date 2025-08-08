from fastapi import APIRouter, Depends, HTTPException, Body, Query
from typing import List, Dict, Any, Optional
from uuid import UUID
from sqlalchemy.orm import Session

from ...db.session import SessionLocal
from ...db import models
from ...core.security import require_role
from ...services.tuning.overlays import effective_compile
from sigma.exceptions import SigmaError

router = APIRouter(prefix="/rules", tags=["tuning"])

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

# ---- List/Get/Create overlays ----

@router.get("/{rule_id}/tuning", response_model=List[dict], summary="List tuning overlays for a rule")
def list_tuning(rule_id: UUID, db: Session = Depends(get_db), _user=Depends(require_role("admin","analyst","viewer"))):
    rule = db.get(models.Rule, rule_id)
    if not rule:
        raise HTTPException(404, "Rule not found")
    rows = (
        db.query(models.Customization)
          .filter(models.Customization.rule_id == rule_id)
          .order_by(models.Customization.created_at.asc())
          .all()
    )
    return [
        {
            "id": str(r.id),
            "owner": r.owner,
            "notes": r.notes,
            "created_at": r.created_at,
            "overlays": r.overlays,
        } for r in rows
    ]

class TuningIn(models.Base.__class__):  # dummy to avoid pydantic here; validate at runtime
    pass

@router.post("/{rule_id}/tuning", status_code=201, response_model=dict, summary="Add a tuning overlay (RFC6902 JSON Patch)")
def add_tuning(
    rule_id: UUID,
    payload: dict = Body(..., example={
        "owner": "blue-team",
        "notes": "exclude scanner host + adjust field path",
        "overlays": [
          {"op": "add", "path": "/falsepositives/-", "value": "EDR scanner host"},
          {"op": "add", "path": "/detection/condition", "value": "sel and not fp"},
          {"op": "add", "path": "/detection/fp/host.name|endswith", "value": ".scanner.local"}
        ]
    }),
    db: Session = Depends(get_db),
    _user=Depends(require_role("admin","analyst"))
):
    rule = db.get(models.Rule, rule_id)
    if not rule:
        raise HTTPException(404, "Rule not found")
    # Validate presence
    owner = payload.get("owner")
    overlays = payload.get("overlays")
    notes = payload.get("notes")
    if not owner or not overlays:
        raise HTTPException(400, "owner and overlays are required")
    # Basic structural check for overlays
    def _is_op(x): return isinstance(x, dict) and "op" in x and "path" in x
    if not (isinstance(overlays, list) and all(_is_op(o) or isinstance(o, list) for o in overlays)):
        raise HTTPException(400, "overlays must be a list of RFC6902 ops or lists of ops")
    row = models.Customization(rule_id=rule_id, owner=str(owner), overlays=overlays, notes=notes)
    db.add(row); db.commit(); db.refresh(row)
    return {"id": str(row.id), "owner": row.owner, "notes": row.notes, "created_at": row.created_at}

@router.post("/{rule_id}/effective", response_model=dict, summary="Compile effective (patched) Sigma for a target")
def compile_effective(
    rule_id: UUID,
    target: str = Query(..., pattern="^(elastic|splunk|sentinel)$"),
    customization_id: Optional[UUID] = Query(None, description="If provided, only this customization is applied. Otherwise all customizations are applied in created_at order."),
    db: Session = Depends(get_db),
    _user=Depends(require_role("admin","analyst","viewer"))
):
    rule = db.get(models.Rule, rule_id)
    if not rule:
        raise HTTPException(404, "Rule not found")

    overlays: List[dict] = []
    if customization_id:
        c = db.get(models.Customization, customization_id)
        if not c or c.rule_id != rule_id:
            raise HTTPException(404, "Customization not found for this rule")
        overlays = c.overlays if isinstance(c.overlays, list) else [c.overlays]
    else:
        rows = (
            db.query(models.Customization)
              .filter(models.Customization.rule_id == rule_id)
              .order_by(models.Customization.created_at.asc())
              .all()
        )
        for r in rows:
            if isinstance(r.overlays, list):
                overlays.extend(r.overlays)
            else:
                overlays.append(r.overlays)

    try:
        result = effective_compile(rule.sigma_yaml, overlays, target)
        return {
            "ok": True,
            "target": target,
            "effective_yaml": result["effective_yaml"],
            "queries": result["queries"],
            "overlays_applied": len(overlays),
            "customization_scope": "single" if customization_id else "all"
        }
    except ValueError as e:
        raise HTTPException(400, str(e))
    except SigmaError as e:
        raise HTTPException(400, f"Sigma compile error: {e}")
