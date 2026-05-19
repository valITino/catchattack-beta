"""Parse a Sigma YAML rule into a structured ParsedRule.

Pure function on YAML text — no I/O, no external state. Errors are returned
via the ServerError model rather than raised; the MCP layer turns the
distinction into a structured tool result.
"""

from __future__ import annotations

import re
from typing import Any

import yaml

from .models import LogSource, ParsedRule, ServerError

_TECHNIQUE_RE = re.compile(r"^attack\.(t\d{4}(?:\.\d{3})?)$", re.IGNORECASE)


def _extract_techniques(tags: list[str]) -> list[str]:
    out: list[str] = []
    for tag in tags:
        m = _TECHNIQUE_RE.match(tag)
        if m:
            out.append(m.group(1).upper())
    # Preserve order, de-duplicate.
    seen: set[str] = set()
    deduped: list[str] = []
    for t in out:
        if t not in seen:
            seen.add(t)
            deduped.append(t)
    return deduped


def _coerce_str_list(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, str):
        return [value]
    if isinstance(value, list):
        return [str(v) for v in value]
    return []


def parse_sigma(yaml_text: str) -> ParsedRule | ServerError:
    """Parse YAML and return a ParsedRule, or ServerError on bad input."""
    if not yaml_text or not yaml_text.strip():
        return ServerError(error="empty_input", detail="yaml_text is empty.")

    try:
        doc = yaml.safe_load(yaml_text)
    except yaml.YAMLError as exc:
        return ServerError(
            error="invalid_yaml",
            detail=str(exc),
            suggestions=["Check indentation and that you are not mixing tabs and spaces."],
        )

    if not isinstance(doc, dict):
        return ServerError(
            error="invalid_structure",
            detail=f"Sigma rule must be a YAML mapping, got {type(doc).__name__}.",
        )

    title = doc.get("title")
    if not title or not isinstance(title, str):
        return ServerError(error="missing_title", detail="Sigma rules must have a 'title'.")

    detection = doc.get("detection")
    if not isinstance(detection, dict):
        return ServerError(
            error="missing_detection",
            detail="Sigma rules must have a 'detection' mapping with a 'condition' key.",
        )

    logsource_raw = doc.get("logsource") or {}
    logsource = LogSource(
        product=logsource_raw.get("product") if isinstance(logsource_raw, dict) else None,
        category=logsource_raw.get("category") if isinstance(logsource_raw, dict) else None,
        service=logsource_raw.get("service") if isinstance(logsource_raw, dict) else None,
    )

    tags = _coerce_str_list(doc.get("tags"))
    techniques = _extract_techniques(tags)

    condition = detection.get("condition")
    if isinstance(condition, list):
        # Multi-condition rules — join with ' or ' for the trace; backends still
        # see the raw structure when convert is called.
        condition_str = " | ".join(str(c) for c in condition)
    elif condition is not None:
        condition_str = str(condition)
    else:
        condition_str = None

    return ParsedRule(
        id=str(doc["id"]) if doc.get("id") else None,
        title=title,
        description=doc.get("description"),
        level=doc.get("level"),
        status=doc.get("status"),
        tags=tags,
        attack_techniques=techniques,
        logsource=logsource,
        detection_keys=sorted(detection.keys()),
        condition=condition_str,
        falsepositives=_coerce_str_list(doc.get("falsepositives")),
        references=_coerce_str_list(doc.get("references")),
    )
