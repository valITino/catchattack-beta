from __future__ import annotations
from typing import List, Dict, Any, Optional
from pathlib import Path
import tempfile
import os
import json

from .models import RuleDraft
from .compile import compile_sigma_from_draft

# We rely on the existing local evaluator:
# It should return (hits: int, samples: List[Dict])
try:
    from app.services.sigma_eval.engine import (
        evaluate_local,
    )  # (sigma_yaml: str, ndjson_path: Path) -> tuple[int, list[dict]]
except Exception:
    evaluate_local = None  # We'll raise a clean error later


def _write_inline_events_to_ndjson(events: List[Dict[str, Any]]) -> str:
    fd, tmp = tempfile.mkstemp(prefix="builder_preview_", suffix=".ndjson")
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        for ev in events:
            f.write(json.dumps(ev, ensure_ascii=False))
            f.write("\n")
    return tmp


def _resolve_dataset(
    dataset_uri: Optional[str], inline_events: Optional[List[Dict[str, Any]]]
) -> str:
    if dataset_uri:
        if not dataset_uri.startswith("file://"):
            raise ValueError("dataset_uri must start with file:// (NDJSON path)")
        p = dataset_uri.replace("file://", "")
        if not Path(p).exists():
            raise FileNotFoundError(f"dataset not found: {p}")
        return p
    if inline_events:
        return _write_inline_events_to_ndjson(inline_events)
    raise ValueError("Provide either dataset_uri or inline_events")


def preview_rule(
    draft: RuleDraft,
    dataset_uri: Optional[str],
    inline_events: Optional[List[Dict[str, Any]]],
    sample_limit: int = 10,
) -> Dict[str, Any]:
    if evaluate_local is None:
        raise RuntimeError(
            "Local Sigma evaluation engine not available (app.services.sigma_eval.engine)"
        )

    sigma_yaml = compile_sigma_from_draft(draft)
    path = _resolve_dataset(dataset_uri, inline_events)

    try:
        hits, samples = evaluate_local(sigma_yaml, Path(path))
    finally:
        # cleanup only if we created a temp file (inline_events case)
        if inline_events and path and path.startswith("/tmp/builder_preview_"):
            try:
                os.remove(path)
            except Exception:
                pass

    return {
        "sigma_yaml": sigma_yaml,
        "hits": int(hits or 0),
        "samples": (samples or [])[:sample_limit],
    }
