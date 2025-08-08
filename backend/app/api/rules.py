from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.security import require_role
from app.db.models import Rule, DeployTarget
from app.db.schemas import RuleCreate, RuleUpdate, RuleOut


router = APIRouter(prefix="/api/v1/rules", tags=["rules"])


@router.get("/", response_model=list[RuleOut], dependencies=[Depends(require_role("admin", "analyst", "viewer"))])
def list_rules(db: Session = Depends(get_db)) -> list[Rule]:
    return db.query(Rule).all()


@router.post("/", response_model=RuleOut, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_role("admin", "analyst"))])
def create_rule(rule_in: RuleCreate, db: Session = Depends(get_db)) -> Rule:
    rule = Rule(**rule_in.model_dump())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


@router.get("/{rule_id}", response_model=RuleOut, dependencies=[Depends(require_role("admin", "analyst", "viewer"))])
def get_rule(rule_id: UUID, db: Session = Depends(get_db)) -> Rule:
    rule = db.get(Rule, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    return rule


@router.put("/{rule_id}", response_model=RuleOut, dependencies=[Depends(require_role("admin", "analyst"))])
def update_rule(rule_id: UUID, rule_in: RuleUpdate, db: Session = Depends(get_db)) -> Rule:
    rule = db.get(Rule, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    for field, value in rule_in.model_dump(exclude_unset=True).items():
        setattr(rule, field, value)
    db.commit()
    db.refresh(rule)
    return rule


@router.delete("/{rule_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_role("admin", "analyst"))])
def delete_rule(rule_id: UUID, db: Session = Depends(get_db)) -> None:
    rule = db.get(Rule, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    db.delete(rule)
    db.commit()


@router.post("/{rule_id}/lint", dependencies=[Depends(require_role("admin", "analyst"))])
def lint_rule(rule_id: UUID, db: Session = Depends(get_db)) -> dict:
    rule = db.get(Rule, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    try:
        from sigma.collection import SigmaCollection  # type: ignore

        SigmaCollection.from_yaml(rule.sigma_yaml)
        return {"valid": True}
    except Exception as exc:  # pragma: no cover - specific parsing errors
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/{rule_id}/compile", dependencies=[Depends(require_role("admin", "analyst"))])
def compile_rule(
    rule_id: UUID,
    target: DeployTarget,
    db: Session = Depends(get_db),
) -> dict:
    rule = db.get(Rule, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    try:
        from sigma.collection import SigmaCollection  # type: ignore
        from sigma.backends.elasticsearch import LuceneBackend  # type: ignore
        from sigma.backends.splunk import SplunkBackend  # type: ignore
        from sigma.backends.microsoft_sentinel import MicrosoftSentinelBackend  # type: ignore

        from typing import Any

        collection = SigmaCollection.from_yaml(rule.sigma_yaml)
        backend: Any
        if target == DeployTarget.elastic:
            backend = LuceneBackend()
        elif target == DeployTarget.splunk:
            backend = SplunkBackend()
        else:
            backend = MicrosoftSentinelBackend()
        queries = backend.convert(collection)
        return {"queries": queries}
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=400, detail=str(exc)) from exc

