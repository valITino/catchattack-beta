from __future__ import annotations

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.orm import Session
from pathlib import Path
from datetime import datetime, timezone
import logging

from app.db.session import SessionLocal
from app.db import models
from app.core.config import settings
from app.services.validation.orchestrator import (
    run_evaluate_local,
    run_evaluate_elastic,
    update_validation_status,
    bulk_index_events,
    ensure_elastic_index,
)

log = logging.getLogger(__name__)


def _events_path(uri: str) -> Path | None:
    if uri.startswith("file://"):
        return Path(uri.replace("file://", "")).resolve()
    return None


def _select_rules(db: Session, sched: models.ValidationSchedule):
    q = db.query(models.Rule)
    if sched.rule_ids:
        q = q.filter(models.Rule.id.in_(sched.rule_ids))
    elif sched.techniques:
        q = q.filter(models.Rule.attack_techniques.overlap(sched.techniques))
    else:
        q = q.filter(models.Rule.status == models.RuleStatus.active)
    return q.all()


def _execute_schedule(db: Session, sched: models.ValidationSchedule):
    run = models.AttackRun(
        name=f"schedule:{sched.name}",
        techniques=sched.techniques or [],
        source=models.RunSource.local,
        status=models.RunStatus.running,
        started_at=datetime.now(timezone.utc),
    )
    db.add(run)
    db.commit()
    db.refresh(run)

    rules = _select_rules(db, sched)
    ev = _events_path(sched.dataset_uri)
    if not ev or not ev.exists():
        log.warning("dataset missing for schedule %s", sched.name)
        run.status = models.RunStatus.failed
        db.add(run)
        db.commit()
        return

    if sched.engine == "elastic":
        from elasticsearch import Elasticsearch

        es = Elasticsearch(settings.elastic_url)
        index_name = f"{settings.elastic_index_prefix}-{run.id}"
        ensure_elastic_index(es, index_name)
        bulk_index_events(es, index_name, ev)
        res = run_evaluate_elastic(db, run, index_name, rules, es)
    else:
        res = run_evaluate_local(db, run, ev, rules)

    run.status = models.RunStatus.completed
    run.ended_at = datetime.now(timezone.utc)
    db.add(run)
    update_validation_status(db, run, res)
    sched.last_run_at = run.ended_at
    db.add(sched)
    db.commit()


def start_scheduler():
    if not getattr(settings, "scheduler_enabled", True):
        return None
    sched = BackgroundScheduler(timezone=getattr(settings, "scheduler_timezone", "UTC"))

    def _load_jobs():
        db = SessionLocal()
        try:
            for s in (
                db.query(models.ValidationSchedule)
                .filter(models.ValidationSchedule.enabled == True)  # noqa: E712
                .all()
            ):
                trig = CronTrigger.from_crontab(s.cron)
                sched.add_job(
                    lambda sid=s.id: _run_job(sid),
                    trig,
                    id=str(s.id),
                    replace_existing=True,
                    max_instances=1,
                )
        finally:
            db.close()

    def _run_job(sid):
        db = SessionLocal()
        try:
            row = db.get(models.ValidationSchedule, sid)
            if row and row.enabled:
                _execute_schedule(db, row)
        finally:
            db.close()

    _load_jobs()
    sched.start()
    return sched
