from __future__ import annotations

from pathlib import Path
from typing import Any
from sqlalchemy.orm import Session
from uuid import uuid4  # noqa: F401
import datetime as dt

from app.db import models
from .utils import logic_sha256, normalize_sigma_yaml


def import_sigma_folder(
    db: Session, folder: str, default_techniques: list[str] | None = None
) -> dict[str, Any]:
    p = Path(folder)
    files = list(p.rglob("*.yml")) + list(p.rglob("*.yaml"))
    total = 0
    inserted = 0
    deduped = 0
    errors = 0
    details: list[dict[str, Any]] = []

    for f in files:
        total += 1
        try:
            y = f.read_text(encoding="utf-8")
            norm = normalize_sigma_yaml(y)
            lh = logic_sha256(norm)
            # dedupe by hash
            exists = db.query(models.Rule).filter(models.Rule.logic_hash == lh).first()
            if exists:
                deduped += 1
                details.append({"file": str(f), "action": "dedupe", "rule_id": str(exists.id)})
                continue
            # minimal parsing for techniques: look for 'attack_techniques' in YAML or use default
            techs = default_techniques or []
            # Create rule
            r = models.Rule(
                name=f.stem,
                description="Imported from folder",
                attack_techniques=techs,
                sigma_yaml=norm,
                status=models.RuleStatus.draft,
                provenance={
                    "source": "folder",
                    "uri": str(f),
                    "imported_at": dt.datetime.utcnow().isoformat() + "Z",
                },
                logic_hash=lh,
            )
            db.add(r)
            db.flush()
            inserted += 1
            details.append({"file": str(f), "action": "insert", "rule_id": str(r.id)})
        except Exception as e:
            errors += 1
            details.append({"file": str(f), "action": "error", "error": str(e)})
    db.commit()
    il = models.ImportLog(
        source="folder",
        uri=str(p.resolve()),
        total=total,
        inserted=inserted,
        deduped=deduped,
        errors=errors,
        details={"files": details},
    )
    db.add(il)
    db.commit()
    return {
        "total": total,
        "inserted": inserted,
        "deduped": deduped,
        "errors": errors,
        "import_log_id": str(il.id),
    }
