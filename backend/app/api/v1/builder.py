from fastapi import APIRouter, HTTPException
from app.services.builder import compile_rule, operator_catalog
from app.services.builder.models import RuleDraft

router = APIRouter(prefix="/builder", tags=["builder"])


@router.get("/operators", response_model=dict)
def get_operators():
    return {"operators": operator_catalog()}


@router.post("/rules/draft", response_model=dict)
def compile_draft(draft: RuleDraft):
    try:
        sigma = compile_rule(draft)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"sigma": sigma}
