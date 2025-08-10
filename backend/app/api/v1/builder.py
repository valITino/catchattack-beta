from fastapi import APIRouter, Depends, Body

from app.db.session import SessionLocal
from app.core.security import require_role
from app.services.builder.models import RuleDraft, PreviewPayload
from app.services.builder.compile import compile_sigma_from_draft
from app.services.builder.catalog import operator_catalog
from app.services.builder.preview import preview_rule

router = APIRouter(prefix="/builder", tags=["builder"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/operators", response_model=list[dict], summary="Builder operator catalog")
def get_operators(_=Depends(require_role("admin", "analyst", "viewer"))):
    return operator_catalog()


@router.post("/compile", response_model=dict, summary="Compile draft to Sigma YAML")
def compile_draft(payload: RuleDraft = Body(...), _=Depends(require_role("admin", "analyst"))):
    yaml_text = compile_sigma_from_draft(payload)
    return {"sigma_yaml": yaml_text}


@router.post("/preview", response_model=dict, summary="Compile draft and preview against dataset")
def preview_draft(payload: PreviewPayload = Body(...), _=Depends(require_role("admin", "analyst"))):
    return preview_rule(
        payload.rule, payload.dataset_uri, payload.inline_events, payload.sample_limit
    )
