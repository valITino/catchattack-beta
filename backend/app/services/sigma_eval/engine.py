from typing import Iterable, Dict, Any, List, Tuple
import ujson as json
from pathlib import Path
import yaml
# Attempt to import the Elasticsearch client and helpers.  These are optional
# dependencies; if unavailable the module will still operate in local
# evaluation mode.  Remote evaluation functions should handle the absence
# gracefully.
try:
    from elasticsearch import Elasticsearch, helpers  # type: ignore[import]
except Exception:
    Elasticsearch = None  # type: ignore[assignment]
    helpers = None  # type: ignore[assignment]

SUPPORTED_LOCAL_OPS = {"contains", "startswith", "endswith", "equals", "re"}


def iter_ndjson(file_path: Path) -> Iterable[Dict[str, Any]]:
    with file_path.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            yield json.loads(line)


def _match_local(event: Dict[str, Any], clause_field: str, op: str, value: str) -> bool:
    # maps Sigma-like ops to simple checks. Keep minimal MVP.
    def _extract(d: Dict[str, Any], dotted: str):
        cur = d
        for part in dotted.split("."):
            if not isinstance(cur, dict) or part not in cur:
                return None
            cur = cur[part]
        return cur

    ev_val = _extract(event, clause_field)
    if ev_val is None:
        return False
    ev_s = str(ev_val)

    if op == "contains":
        return value in ev_s
    if op == "startswith":
        return ev_s.startswith(value)
    if op == "endswith":
        return ev_s.endswith(value)
    if op == "equals":
        return ev_s == value
    if op == "re":
        import re

        return re.search(value, ev_s) is not None
    return False


def evaluate_local(
    sigma_yaml: str, events_path: Path, sample_cap: int = 5
) -> Tuple[int, List[Dict[str, Any]]]:
    """
    Super-simplified evaluator:
    - Supports a single selection referenced directly in the condition
      (e.g., ``sel`` or ``sel0``)
    - With field ops: contains/startswith/endswith/equals/re via Sigma pipe ops mapping
    """
    data = yaml.safe_load(sigma_yaml)
    det = data.get("detection", {})
    cond = det.get("condition")
    if not isinstance(cond, str):
        return 0, []

    sel_name = cond.strip()
    sel = det.get(sel_name)
    if not isinstance(sel, dict):
        # non-supported structure
        return 0, []
    tests: List[Tuple[str, str, str]] = []
    for k, v in sel.items():
        if "|" in k:
            field, op = k.split("|", 1)
        else:
            field, op = k, "equals"
        op = op.lower()
        if op not in SUPPORTED_LOCAL_OPS:
            continue
        tests.append((field, op, str(v)))

    hits = 0
    samples: List[Dict[str, Any]] = []
    for ev in iter_ndjson(events_path):
        ok = all(_match_local(ev, f, op, val) for (f, op, val) in tests)
        if ok:
            hits += 1
            if len(samples) < sample_cap:
                samples.append(ev)
    return hits, samples


def ensure_elastic_index(es: Elasticsearch, index: str):
    if not es.indices.exists(index=index):
        es.indices.create(index=index, mappings={"dynamic": True})

