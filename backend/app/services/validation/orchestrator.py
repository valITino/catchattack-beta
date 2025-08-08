from typing import List, Tuple
from pathlib import Path
from datetime import datetime, timezone
from uuid import UUID
from sqlalchemy.orm import Session
from elasticsearch import Elasticsearch
from elasticsearch import helpers

from app.core.config import settings
from app.db import models
from app.services.sigma_eval.engine import evaluate_local, ensure_elastic_index


def run_evaluate_local(
    db: Session, run: models.AttackRun, events_path: Path, rules: List[models.Rule]
) -> List[models.DetectionResult]:
    results = []
    for rule in rules:
        hit_count, samples = evaluate_local(rule.sigma_yaml, events_path)
        dr = models.DetectionResult(
            run_id=run.id,
            rule_id=rule.id,
            hit_count=hit_count,
            evidence_uri=f"file://{events_path}",
            sample_events=samples,
            evaluated_at=datetime.now(timezone.utc),
        )
        db.add(dr)
        results.append(dr)
    db.flush()
    return results


def bulk_index_events(es: Elasticsearch, index: str, events_path: Path) -> int:
    def gen():
        with events_path.open("r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                yield {"_index": index, "_source": line}

    ok, _ = helpers.bulk(es, gen())
    return ok


def run_evaluate_elastic(
    db: Session,
    run: models.AttackRun,
    index: str,
    rules: List[models.Rule],
    es: Elasticsearch,
) -> List[models.DetectionResult]:
    results = []
    for rule in rules:
        # Use pySigma backend to produce KQL and wrap in ES DSL query_string
        from sigma.collection import SigmaCollection
        from sigma.backends.elasticsearch import ElasticsearchBackend

        sc = SigmaCollection.from_yaml(rule.sigma_yaml)
        backend = ElasticsearchBackend()
        queries = backend.convert(sc)  # list[str]
        total_hits = 0
        samples = []
        for q in queries:
            # KQL via query_string with "kql" mode isn't a first-class API; use simple query_string for demo
            resp = es.search(index=index, q=q, size=5)
            total_hits += resp["hits"]["total"]["value"]
            for h in resp["hits"]["hits"]:
                samples.append(h["_source"])
        dr = models.DetectionResult(
            run_id=run.id,
            rule_id=rule.id,
            hit_count=total_hits,
            evidence_uri=f"es://{settings.elastic_url}/{index}",
            sample_events=samples[:5],
            evaluated_at=datetime.now(timezone.utc),
        )
        db.add(dr)
        results.append(dr)
    db.flush()
    return results


def update_validation_status(
    db: Session, run: models.AttackRun, results: List[models.DetectionResult]
):
    # MVP: mark TP as hit_count, leave FP/FN 0; compute precision/recall as None unless you later label truth.
    for dr in results:
        vs = db.get(models.ValidationStatus, dr.rule_id)
        if not vs:
            vs = models.ValidationStatus(rule_id=dr.rule_id)
        vs.last_run_id = run.id
        vs.tp = (vs.tp or 0) + dr.hit_count
        vs.support = (vs.support or 0) + dr.hit_count
        vs.precision = None
        vs.recall = None
        db.add(vs)
    db.commit()

