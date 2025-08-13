from fastapi import APIRouter, Depends, HTTPException, Body, Path, Query
from typing import List, Optional, Dict, Any
from uuid import UUID
from sqlalchemy.orm import Session
from tenacity import retry, stop_after_attempt, wait_fixed

from app.db.session import SessionLocal
from app.db import models
from app.core.security import require_role
from app.core.config import settings
from app.services.tuning.overlays import effective_compile
from app.services.deploy.elastic import ElasticConnector
from app.services.deploy.splunk import SplunkConnector
from app.services.deploy.sentinel import SentinelConnector
from opentelemetry import trace

tr = trace.get_tracer(__name__)

router = APIRouter(prefix="/deploy", tags=["deploy"])

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

def _connector(target: str):
    if target == "elastic":
        # Lazily import the Elasticsearch client.  If the optional dependency
        # isn't installed, return a 503 so the caller understands why the
        # operation cannot proceed.
        try:
            from elasticsearch import Elasticsearch  # type: ignore[import]
        except Exception:
            raise HTTPException(
                503,
                "Elasticsearch client library is not available; install the 'elasticsearch' package to deploy to Elastic."
            )
        return ElasticConnector(Elasticsearch(settings.elastic_url))
    if target == "splunk":
        return SplunkConnector()
    if target == "sentinel":
        return SentinelConnector()
    raise HTTPException(400, "Unsupported target")

def _load_rules(db: Session, items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Load rule rows & compile effective queries per item."""
    loaded = []
    for it in items:
        rid = UUID(it["rule_id"])
        rule = db.get(models.Rule, rid)
        if not rule: raise HTTPException(404, f"Rule not found: {rid}")
        overlays = None
        if it.get("customization_id"):
            cid = UUID(it["customization_id"])
            c = db.get(models.Customization, cid)
            if not c or c.rule_id != rid:
                raise HTTPException(404, f"Customization not found for rule {rid}")
            overlays = [c.overlays] if isinstance(c.overlays, dict) else c.overlays
        # compile effective for target
        res = effective_compile(rule.sigma_yaml, overlays or [], it.get("target","elastic"))
        loaded.append({"rule":rule, "queries":res["queries"], "effective_yaml":res["effective_yaml"]})
    return loaded

@router.post("/{target}", summary="Deploy rules to a target system", response_model=dict)
def deploy_rules(
    target: str = Path(..., pattern="^(elastic|splunk|sentinel)$"),
    payload: dict = Body(..., example={
        "rules":[{"rule_id":"<uuid>","customization_id":"<uuid>?"}],
        "dry_run": False,
        "idempotency_key": "optional-key-123"
    }),
    db: Session = Depends(get_db),
    _user=Depends(require_role("admin","analyst"))  # analyst can dry-run, admin required for non-dry
):
    dry_run = bool(payload.get("dry_run", False))
    rules_req = payload.get("rules") or []
    if not isinstance(rules_req, list) or not rules_req:
        raise HTTPException(400, "rules[] required")

    # If not dry-run, require admin explicitly
    if not dry_run:
        require_role("admin")( _user )  # invoke checker

    conn = _connector(target)
    job = models.DeployJob(target=target, submitted_by=_user.sub, status=models.JobStatus.pending, details={"items":[]})
    db.add(job); db.commit(); db.refresh(job)

    # Load & compile per-rule
    with tr.start_as_current_span("deploy.load_and_compile"):
        loaded = _load_rules(db, [dict(r, target=target) for r in rules_req])

    # Perform deployment
    with tr.start_as_current_span("deploy.perform"):
        details = []
        for item in loaded:
            rule = item["rule"]
            queries = item["queries"]

            if dry_run:
                res = conn.dry_run(rule.name, queries)
                details.append({"rule_id": str(rule.id), "status": res.status, "target_ref": None, "error": res.error, "dry_run": True})
                continue

            res = conn.upsert_rule(rule.name, queries)
            dv = models.DeployVersion(
                job_id=job.id, rule_id=rule.id,
                target_version_ref=res.target_ref, prev_version_ref=res.prev_ref,
                status=models.DeployVersionStatus.deployed if res.ok else models.DeployVersionStatus.error,
                notes=(res.error or None)
            )
            db.add(dv); db.flush()
            details.append({"rule_id": str(rule.id), "status": res.status, "target_ref": res.target_ref, "error": res.error})

        job.status = models.JobStatus.success if all(d.get("status") in ["success","rolled_back"] for d in details) else models.JobStatus.error
        job.details = {"items": details, "dry_run": dry_run}
        db.add(job); db.commit(); db.refresh(job)

    return {"job_id": str(job.id), "status": job.status.value, "details": job.details}

@router.get("/{job_id}", summary="Get deploy job status", response_model=dict)
def get_job(job_id: UUID, db: Session = Depends(get_db), _user=Depends(require_role("admin","analyst","viewer"))):
    job = db.get(models.DeployJob, job_id)
    if not job: raise HTTPException(404, "Job not found")
    versions = db.query(models.DeployVersion).filter(models.DeployVersion.job_id == job.id).all()
    return {
        "job_id": str(job.id),
        "status": job.status.value,
        "details": job.details,
        "versions": [
            {
                "rule_id": str(v.rule_id),
                "target_ref": v.target_version_ref,
                "prev_ref": v.prev_version_ref,
                "status": v.status.value,
                "notes": v.notes
            } for v in versions
        ]
    }

@router.post("/{job_id}/rollback", summary="Rollback deployed rules for a job", response_model=dict)
def rollback_job(job_id: UUID, db: Session = Depends(get_db), _user=Depends(require_role("admin"))):
    job = db.get(models.DeployJob, job_id)
    if not job: raise HTTPException(404, "Job not found")
    conn = _connector(job.target.value if hasattr(job.target, "value") else job.target)

    versions = db.query(models.DeployVersion).filter(models.DeployVersion.job_id == job.id).all()
    results = []
    for v in versions:
        if not v.target_version_ref:
            results.append({"rule_id": str(v.rule_id), "status": "skipped", "reason": "no target_ref"})
            continue
        res = conn.rollback(v.target_version_ref, v.prev_version_ref)
        v.status = models.DeployVersionStatus.rolled_back if res.ok else models.DeployVersionStatus.error
        v.notes = res.error or v.notes
        results.append({"rule_id": str(v.rule_id), "status": v.status.value, "error": res.error})
        db.add(v)

    job.status = models.JobStatus.rolled_back if all(r["status"] == "rolled_back" or r["status"] == "skipped" for r in results) else models.JobStatus.error
    db.add(job); db.commit(); db.refresh(job)
    return {"job_id": str(job.id), "status": job.status.value, "results": results}
