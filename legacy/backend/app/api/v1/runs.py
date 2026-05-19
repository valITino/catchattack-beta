from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from typing import Optional, List
from uuid import UUID, uuid4
from pathlib import Path
from datetime import datetime, timezone
from sqlalchemy.orm import Session

# Elasticsearch is an optional dependency.  Import errors are swallowed so
# that the API module can still be imported on systems without the
# ``elasticsearch`` package.  When auto indexing is requested, the handler
# will check for ``Elasticsearch`` availability and return an error if
# necessary.
try:
    from elasticsearch import Elasticsearch  # type: ignore[import]
except Exception:
    Elasticsearch = None  # type: ignore[assignment]

from app.db.session import SessionLocal
from app.db import models
from app.core.config import settings
from app.core.security import require_role
from app.services.validation.orchestrator import (
    run_evaluate_local, run_evaluate_elastic, update_validation_status,
    ensure_elastic_index, bulk_index_events
)

router = APIRouter(prefix="/runs", tags=["runs"])

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

def _run_dir(run_id: UUID) -> Path:
    d = Path(settings.artifacts_dir) / "runs" / str(run_id)
    d.mkdir(parents=True, exist_ok=True); return d

@router.post("", summary="Create attack run", response_model=dict)
def create_run(
    name: str = Form(...),
    techniques: Optional[List[str]] = Form(None),
    source: models.RunSource = Form(...),
    environment: Optional[str] = Form(None),  # raw JSON string (MVP)
    db: Session = Depends(get_db),
    _user=Depends(require_role("admin","analyst"))
):
    run = models.AttackRun(
        name=name, techniques=techniques or [], source=source,
        status=models.RunStatus.created, started_at=None, ended_at=None,
        environment=None
    )
    if environment:
        import json
        run.environment = json.loads(environment)
    db.add(run); db.commit(); db.refresh(run)
    return {"id": str(run.id), "status": run.status.value}

@router.post("/{run_id}/start", summary="Start run", response_model=dict)
def start_run(run_id: UUID, db: Session = Depends(get_db), _user=Depends(require_role("admin","analyst"))):
    run = db.get(models.AttackRun, run_id)
    if not run: raise HTTPException(404, "Run not found")
    if run.status not in [models.RunStatus.created, models.RunStatus.failed]:
        raise HTTPException(400, "Run not in creatable state")
    run.status = models.RunStatus.running
    run.started_at = datetime.now(timezone.utc)
    db.add(run); db.commit(); db.refresh(run)
    return {"id": str(run.id), "status": run.status.value}

@router.post("/{run_id}/ingest", summary="Upload NDJSON telemetry for run", response_model=dict)
async def ingest_run_data(
    run_id: UUID,
    file: UploadFile = File(..., description="NDJSON file of events"),
    auto_index: bool = Query(False, description="If true, index to local Elastic"),
    db: Session = Depends(get_db),
    _user=Depends(require_role("admin","analyst"))
):
    run = db.get(models.AttackRun, run_id)
    if not run: raise HTTPException(404, "Run not found")
    if run.status != models.RunStatus.running:
        raise HTTPException(400, "Run must be running to ingest data")

    rd = _run_dir(run_id)
    dest = rd / "events.ndjson"
    content = await file.read()
    dest.write_bytes(content)
    events_uri = f"file://{dest}"

    indexed = 0
    index_name = None
    if auto_index:
        # Ensure Elasticsearch client is available
        if Elasticsearch is None:
            raise HTTPException(503, "Elasticsearch client not available; cannot auto-index events")
        es = Elasticsearch(settings.elastic_url)  # type: ignore[call-arg]
        index_name = f"{settings.elastic_index_prefix}-{run_id}"
        ensure_elastic_index(es, index_name)
        indexed = bulk_index_events(es, index_name, dest)

    return {"ok": True, "events_uri": events_uri, "indexed": indexed, "index": index_name}

@router.post("/{run_id}/evaluate", summary="Evaluate rules against run data", response_model=dict)
def evaluate_run(
    run_id: UUID,
    engine: str = Query("local", pattern="^(local|elastic)$"),
    db: Session = Depends(get_db),
    _user=Depends(require_role("admin","analyst"))
):
    run = db.get(models.AttackRun, run_id)
    if not run: raise HTTPException(404, "Run not found")
    if run.status != models.RunStatus.running:
        raise HTTPException(400, "Run must be running")

    # Fetch active rules
    rules = db.query(models.Rule).filter(models.Rule.status == models.RuleStatus.active).all()
    if not rules:
        # as fallback evaluate drafts too (useful in demo)
        rules = db.query(models.Rule).all()
    if not rules:
        raise HTTPException(400, "No rules to evaluate")

    rd = _run_dir(run_id)
    events_path = rd / "events.ndjson"
    if not events_path.exists():
        raise HTTPException(400, "No events ingested for this run")

    results: list[models.DetectionResult] = []
    if engine == "local":
        results = run_evaluate_local(db, run, events_path, rules)
    else:
        # Evaluate using an Elastic backend.  The Elastic client is optional, so
        # lazily import and provide a helpful error if it's unavailable.
        try:
            from elasticsearch import Elasticsearch  # type: ignore[import]
        except Exception:
            raise HTTPException(
                503,
                "Elasticsearch client library is not available; install the 'elasticsearch' package or disable Elastic engine"
            )
        es = Elasticsearch(settings.elastic_url)
        index_name = f"{settings.elastic_index_prefix}-{run_id}"
        ensure_elastic_index(es, index_name)
        # If events were not indexed yet, index now:
        if es.count(index=index_name).body.get("count", 0) == 0:
            from app.services.validation.orchestrator import bulk_index_events
            bulk_index_events(es, index_name, events_path)
        results = run_evaluate_elastic(db, run, index_name, rules, es)

    # finalize run
    run.status = models.RunStatus.completed
    run.ended_at = datetime.now(timezone.utc)
    db.add(run)
    update_validation_status(db, run, results)
    db.refresh(run)

    # Response
    payload = {
        "run_id": str(run.id),
        "status": run.status.value,
        "evaluated_rules": len(results),
        "results": [
            {
                "rule_id": str(r.rule_id),
                "hit_count": r.hit_count,
                "evidence_uri": r.evidence_uri,
                "sample_events": r.sample_events[:3] if r.sample_events else [],
            } for r in results
        ]
    }
    return payload

@router.get("/{run_id}", summary="Get run summary", response_model=dict)
def get_run(run_id: UUID, db: Session = Depends(get_db), _user=Depends(require_role("admin","analyst","viewer"))):
    run = db.get(models.AttackRun, run_id)
    if not run: raise HTTPException(404, "Run not found")
    # summarize
    total_rules = db.query(models.DetectionResult).filter_by(run_id=run.id).count()
    total_hits = 0
    for dr in db.query(models.DetectionResult).filter_by(run_id=run.id).all():
        total_hits += dr.hit_count
    return {
        "id": str(run.id),
        "name": run.name,
        "status": run.status.value,
        "started_at": run.started_at,
        "ended_at": run.ended_at,
        "techniques": run.techniques or [],
        "summary": {"rules_evaluated": total_rules, "hits": total_hits}
    }

@router.get("/{run_id}/results", summary="List per-rule results", response_model=dict)
def get_run_results(run_id: UUID, rule_id: Optional[UUID] = None, db: Session = Depends(get_db), _user=Depends(require_role("admin","analyst","viewer"))):
    run = db.get(models.AttackRun, run_id)
    if not run: raise HTTPException(404, "Run not found")
    q = db.query(models.DetectionResult).filter(models.DetectionResult.run_id == run.id)
    if rule_id:
        q = q.filter(models.DetectionResult.rule_id == rule_id)
    out = []
    for r in q.all():
        out.append({
            "rule_id": str(r.rule_id),
            "hit_count": r.hit_count,
            "evidence_uri": r.evidence_uri,
            "sample_events": r.sample_events[:5] if r.sample_events else [],
            "evaluated_at": r.evaluated_at
        })
    return {"run_id": str(run.id), "results": out}
