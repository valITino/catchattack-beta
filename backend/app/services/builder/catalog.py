from __future__ import annotations


def operator_catalog() -> list[dict]:
    return [
        {"op": "equals", "types": ["string", "number", "boolean"]},
        {"op": "contains", "types": ["string"]},
        {"op": "startswith", "types": ["string"]},
        {"op": "endswith", "types": ["string"]},
        {"op": "in", "types": ["string", "number"], "value": "list"},
        {"op": "regex", "types": ["string"]},
        {"op": "gt", "types": ["number", "date"]},
        {"op": "gte", "types": ["number", "date"]},
        {"op": "lt", "types": ["number", "date"]},
        {"op": "lte", "types": ["number", "date"]},
    ]
