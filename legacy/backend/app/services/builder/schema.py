from __future__ import annotations
from typing import Any, DefaultDict, Dict, List
from pathlib import Path
import json
import collections
import re

# very light date-like detector (ISO-ish or epoch millis)
_ISO_DATE = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}")


def _typeof(v: Any) -> str:
    if v is None:
        return "null"
    if isinstance(v, bool):
        return "boolean"
    if isinstance(v, (int, float)) and not isinstance(v, bool):
        return "number"
    if isinstance(v, str):
        if _ISO_DATE.match(v):
            return "date"
        return "string"
    if isinstance(v, list):
        return "array"
    if isinstance(v, dict):
        return "object"
    return "string"


def _walk(obj: Any, prefix: str, out: DefaultDict[str, Dict[str, Any]], samples_per_field: int):
    t = _typeof(obj)
    if t in ("object",):
        for k, v in obj.items():
            key = f"{prefix}.{k}" if prefix else k
            _walk(v, key, out, samples_per_field)
    elif t == "array":
        # mark the array itself and also attempt to infer element types
        field = prefix
        rec = out[field]
        rec.setdefault("types", set()).add("array")
        # First few elements only
        for el in obj[:5]:
            et = _typeof(el)
            rec.setdefault("elem_types", set()).add(et)
            # if element is object, descend using same field (we don't create path[k], keep flat)
            if isinstance(el, dict):
                # provide child keys as hints like field[].subkey
                for ck, cv in el.items():
                    child = f"{field}[].{ck}"
                    cre = out[child]
                    cre.setdefault("types", set()).add(_typeof(cv))
                    if len(cre.setdefault("examples", [])) < samples_per_field:
                        cre["examples"].append(cv)
            else:
                if len(rec.setdefault("examples", [])) < samples_per_field:
                    rec["examples"].append(el)
    else:
        field = prefix
        rec = out[field]
        rec.setdefault("types", set()).add(t)
        if len(rec.setdefault("examples", [])) < samples_per_field:
            rec["examples"].append(obj)


def infer_schema_from_ndjson(
    path: Path, limit_events: int = 100, samples_per_field: int = 5
) -> List[Dict[str, Any]]:
    acc: DefaultDict[str, Dict[str, Any]] = collections.defaultdict(dict)
    cnt = 0
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                ev = json.loads(line)
            except Exception:
                continue
            _walk(ev, "", acc, samples_per_field)
            cnt += 1
            if cnt >= limit_events:
                break

    rows: List[Dict[str, Any]] = []
    for k, rec in acc.items():
        types = sorted(list(rec.get("types", set())))
        elem_types = sorted(list(rec.get("elem_types", set()))) if "elem_types" in rec else None
        examples = rec.get("examples", [])
        rows.append(
            {
                "field": k,
                "types": types,
                **({"elem_types": elem_types} if elem_types else {}),
                "examples": examples[:samples_per_field],
            }
        )

    # sort: prioritize common detection fields
    def rank(field: str) -> int:
        tops = [
            "timestamp",
            "@timestamp",
            "event.category",
            "event.action",
            "host.name",
            "user.name",
            "process.command_line",
            "process.executable",
            "process.name",
            "registry.path",
            "registry.value",
            "file.path",
            "file.name",
            "file.hash.sha256",
            "source.ip",
            "destination.ip",
            "url.full",
            "http.url",
        ]
        try:
            return tops.index(field)
        except Exception:
            return 9999

    rows.sort(key=lambda r: (rank(r["field"]), r["field"]))
    return rows
