from fastapi import APIRouter, Depends, HTTPException, Query, Body
from typing import List, Optional
from sqlalchemy.orm import Session
from uuid import UUID
import yaml

from ...db.session import SessionLocal
from ...db import models
from ...db.schemas import RuleCreate, RuleOut
from ...core.security import require_role

router = APIRouter(prefix="/rules", tags=["rules"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("", response_model=List[RuleOut], summary="List rules")
def list_rules(
    technique: Optional[str] = Query(None),
    status: Optional[models.RuleStatus] = Query(None),
    db: Session = Depends(get_db),
    _user=Depends(require_role("admin","analyst","viewer")),
):
    q = db.query(models.Rule)
    if technique:
        q = q.filter(models.Rule.attack_techniques.any(technique))
    if status:
        q = q.filter(models.Rule.status == status)
    q = q.order_by(models.Rule.created_at.desc())
    return q.all()

@router.post("", response_model=RuleOut, status_code=201, summary="Create rule")
def create_rule(payload: RuleCreate, db: Session = Depends(get_db), _user=Depends(require_role("admin","analyst"))):
    # Basic YAML parse check
    try:
        yaml.safe_load(payload.sigma_yaml)
    except yaml.YAMLError as e:
        raise HTTPException(status_code=400, detail=f"Invalid YAML: {e}")

    rule = models.Rule(
        name=payload.name,
        description=payload.description,
        attack_techniques=payload.attack_techniques or [],
        sigma_yaml=payload.sigma_yaml,
        status=payload.status or models.RuleStatus.draft,
    )
    db.add(rule)
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        if "unique" in str(e).lower():
            raise HTTPException(status_code=409, detail="Rule name already exists")
        raise
    db.refresh(rule)
    return rule

@router.get("/{rule_id}", response_model=RuleOut, summary="Get rule by id")
def get_rule(rule_id: UUID, db: Session = Depends(get_db), _user=Depends(require_role("admin","analyst","viewer"))):
    rule = db.get(models.Rule, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    return rule

class RuleUpdate(RuleCreate):  # same fields; optional in practice
    pass

@router.put("/{rule_id}", response_model=RuleOut, summary="Update rule")
def update_rule(rule_id: UUID, payload: RuleUpdate, db: Session = Depends(get_db), _user=Depends(require_role("admin","analyst"))):
    rule = db.get(models.Rule, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    # Validate YAML early
    try:
        yaml.safe_load(payload.sigma_yaml)
    except yaml.YAMLError as e:
        raise HTTPException(status_code=400, detail=f"Invalid YAML: {e}")

    rule.name = payload.name
    rule.description = payload.description
    rule.attack_techniques = payload.attack_techniques or []
    rule.sigma_yaml = payload.sigma_yaml
    rule.status = payload.status
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule

@router.delete("/{rule_id}", status_code=204, summary="Delete rule")
def delete_rule(rule_id: UUID, db: Session = Depends(get_db), _user=Depends(require_role("admin"))):
    rule = db.get(models.Rule, rule_id)
    if not rule:
        return
    db.delete(rule)
    db.commit()
    return

class LintOutItem(dict): pass
class LintOut(dict): pass

@router.post("/{rule_id}/lint", summary="Parse & lint Sigma", response_model=dict)
def lint_rule(rule_id: UUID, db: Session = Depends(get_db), _user=Depends(require_role("admin","analyst"))):
    rule = db.get(models.Rule, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    try:
        from sigma.collection import SigmaCollection
        from sigma.exceptions import SigmaError

        sc = SigmaCollection.from_yaml(rule.sigma_yaml)
        return {"ok": True, "messages": ["Sigma parsed successfully"], "rules_count": len(sc.rules)}
    except SigmaError as e:
        return {"ok": False, "messages": [str(e)], "rules_count": 0}

def _compile_sigma(yaml_text: str, target: str) -> dict:
    from sigma.collection import SigmaCollection

    sc = SigmaCollection.from_yaml(yaml_text)
    if target == "elastic":
        from sigma.backends.elasticsearch.elasticsearch_lucene import LuceneBackend
        backend = LuceneBackend()
    elif target == "splunk":
        from sigma.backends.splunk.splunk import SplunkBackend
        backend = SplunkBackend()
    elif target == "sentinel":
        from sigma.backends.sentinel.sentinel import SentinelBackend
        backend = SentinelBackend()
    else:
        raise HTTPException(status_code=400, detail="Unsupported target")
    queries = backend.convert(sc)
    return {"queries": queries}

@router.post("/{rule_id}/compile", summary="Compile Sigma to target query", response_model=dict)
def compile_rule(rule_id: UUID, target: str = Query(..., pattern="^(elastic|splunk|sentinel)$"),
                 db: Session = Depends(get_db), _user=Depends(require_role("admin","analyst","viewer"))):
    rule = db.get(models.Rule, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    try:
        result = _compile_sigma(rule.sigma_yaml, target)
        return {"ok": True, "target": target, **result}
    except Exception as e:
        from sigma.exceptions import SigmaError
        if isinstance(e, SigmaError):
            raise HTTPException(status_code=400, detail=f"Compile error: {e}")
        raise
