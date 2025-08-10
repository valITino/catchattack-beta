from fastapi import APIRouter, Depends, Body, HTTPException

from app.db.session import SessionLocal
from app.core.security import require_role
from app.services.builder.models import RuleDraft
from app.services.builder.compile import compile_sigma_from_draft
from app.services.builder.catalog import operator_catalog
from app.services.builder.preview import preview_rule
from pathlib import Path
from app.services.builder.schema import infer_schema_from_ndjson

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


@router.post(
    "/preview",
    response_model=dict,
    summary="Compile draft and preview on NDJSON (local engine)",
)
def preview_draft(
    payload: dict = Body(...),
    _=Depends(require_role("admin", "analyst")),
):
    # Expect: { draft: RuleDraft, dataset_uri?: "file:///path.ndjson", inline_events?: [ {...}, ... ], sample_limit?: 10 }
    try:
        draft = RuleDraft.model_validate(payload.get("draft"))
    except Exception as e:
        raise HTTPException(400, f"Invalid draft: {e}")

    dataset_uri = payload.get("dataset_uri")
    inline_events = payload.get("inline_events")
    sample_limit = int(payload.get("sample_limit") or 10)
    if sample_limit < 1 or sample_limit > 50:
        sample_limit = 10

    try:
        res = preview_rule(draft, dataset_uri, inline_events, sample_limit)
        return res
    except FileNotFoundError as e:
        raise HTTPException(404, str(e))
    except ValueError as e:
        raise HTTPException(400, str(e))
    except RuntimeError as e:
        raise HTTPException(500, str(e))


@router.post("/schema", response_model=dict, summary="Infer field schema from NDJSON")
def builder_schema(
    payload: dict = Body(...), _=Depends(require_role("admin", "analyst", "viewer"))
):
    """
    Body:
    {
      "dataset_uri": "file:///app/backend/ops/seeds/telemetry/windows.ndjson",
      "limit_events": 100,
      "samples_per_field": 5
    }
    """
    dataset_uri = payload.get("dataset_uri")
    if not dataset_uri or not str(dataset_uri).startswith("file://"):
        raise HTTPException(400, "dataset_uri (file://...) is required")
    p = Path(str(dataset_uri).replace("file://", ""))
    if not p.exists():
        raise HTTPException(404, f"dataset not found: {p}")
    limit_events = int(payload.get("limit_events") or 100)
    samples_per_field = int(payload.get("samples_per_field") or 5)
    rows = infer_schema_from_ndjson(
        p, limit_events=limit_events, samples_per_field=samples_per_field
    )

    # minimal operator suggestions per type for the UI (reuse builder ops)
    type_ops = {
        "string": ["equals", "contains", "startswith", "endswith", "regex", "in"],
        "number": ["equals", "gt", "gte", "lt", "lte", "in"],
        "boolean": ["equals"],
        "date": ["equals", "gt", "gte", "lt", "lte"],
        "array": ["equals", "in"],  # for simple value-in-array cases
        "object": ["equals"],  # place-holder
    }
    # attach op suggestions per row based on types
    for r in rows:
        ops = set()
        for t in r.get("types", []):
            for op in type_ops.get(t, []):
                ops.add(op)
        r["suggested_ops"] = sorted(ops)

    return {"dataset": str(p), "fields": rows}
