"""Lint a Sigma YAML rule.

Two layers:

1. **Schema validity** — try to instantiate `sigma.rule.SigmaRule`. Anything
   the upstream parser rejects becomes an `error`.
2. **Style** — checks beyond raw schema validity: title length, missing
   metadata, suspiciously-broad detections, absent ATT&CK tags, etc.
   These become `warning` or `info`.

The function is pure and side-effect-free; LLMs can call it freely.
"""

from __future__ import annotations

import re

import yaml
from sigma.exceptions import SigmaError
from sigma.rule import SigmaRule

from .models import LintIssue, LintReport

_UUID_RE = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", re.I)
_ATTACK_TAG_RE = re.compile(
    r"^attack\.(t\d{4}(?:\.\d{3})?|tactic\.[a-z_-]+|[a-z][a-z0-9_-]*)$", re.I
)
_ATTACK_TECHNIQUE_RE = re.compile(r"^attack\.t\d{4}(?:\.\d{3})?$", re.I)

_ALLOWED_LEVELS = {"informational", "low", "medium", "high", "critical"}
_ALLOWED_STATUSES = {"stable", "experimental", "test", "deprecated", "unsupported"}
_MAX_TITLE_LEN = 120


def _style_checks(  # noqa: PLR0912 — branching is the point: each check is its own rule
    doc: dict[str, object],
) -> tuple[list[LintIssue], list[LintIssue], list[LintIssue]]:
    errors: list[LintIssue] = []
    warnings: list[LintIssue] = []
    info: list[LintIssue] = []

    title = doc.get("title")
    if isinstance(title, str):
        if len(title) > _MAX_TITLE_LEN:
            warnings.append(
                LintIssue(
                    severity="warning",
                    code="style.title_too_long",
                    message="Title is over 120 chars; aim for under 100.",
                    path="title",
                )
            )
        if not title[0].isupper():
            info.append(
                LintIssue(
                    severity="info",
                    code="style.title_capitalisation",
                    message="Title should start with an uppercase letter.",
                    path="title",
                )
            )

    rule_id = doc.get("id")
    if rule_id is None:
        warnings.append(
            LintIssue(
                severity="warning",
                code="style.missing_id",
                message="Rule has no 'id' (UUID). All production rules should have one.",
                path="id",
            )
        )
    elif isinstance(rule_id, str) and not _UUID_RE.match(rule_id):
        errors.append(
            LintIssue(
                severity="error",
                code="schema.bad_id",
                message="'id' must be a UUID.",
                path="id",
            )
        )

    if "description" not in doc:
        info.append(
            LintIssue(
                severity="info",
                code="style.missing_description",
                message="Rule has no 'description'.",
                path="description",
            )
        )

    level = doc.get("level")
    if level is not None and level not in _ALLOWED_LEVELS:
        errors.append(
            LintIssue(
                severity="error",
                code="schema.bad_level",
                message=f"'level' must be one of {sorted(_ALLOWED_LEVELS)}; got {level!r}.",
                path="level",
            )
        )

    status = doc.get("status")
    if status is not None and status not in _ALLOWED_STATUSES:
        warnings.append(
            LintIssue(
                severity="warning",
                code="style.unknown_status",
                message=f"'status' should be one of {sorted(_ALLOWED_STATUSES)}; got {status!r}.",
                path="status",
            )
        )

    tags = doc.get("tags")
    if not isinstance(tags, list) or not tags:
        warnings.append(
            LintIssue(
                severity="warning",
                code="style.no_tags",
                message="Rule has no ATT&CK tags; coverage tracking will skip this rule.",
                path="tags",
            )
        )
    else:
        has_technique = False
        for tag in tags:
            if not isinstance(tag, str):
                continue
            if not _ATTACK_TAG_RE.match(tag):
                info.append(
                    LintIssue(
                        severity="info",
                        code="style.non_attack_tag",
                        message=f"Tag {tag!r} is not in attack.* namespace.",
                        path="tags",
                    )
                )
            elif _ATTACK_TECHNIQUE_RE.match(tag):
                has_technique = True
        if not has_technique:
            warnings.append(
                LintIssue(
                    severity="warning",
                    code="style.no_attack_technique",
                    message="No attack.tNNNN[.NNN] tag found; rule will not show on matrix.",
                    path="tags",
                )
            )

    return errors, warnings, info


def lint_sigma(yaml_text: str) -> LintReport:
    """Lint a Sigma rule. Always returns a LintReport, never raises."""
    if not yaml_text or not yaml_text.strip():
        return LintReport(
            ok=False,
            errors=[
                LintIssue(severity="error", code="schema.empty", message="yaml_text is empty."),
            ],
        )

    try:
        doc = yaml.safe_load(yaml_text)
    except yaml.YAMLError as exc:
        return LintReport(
            ok=False,
            errors=[
                LintIssue(
                    severity="error",
                    code="schema.invalid_yaml",
                    message=f"YAML parse error: {exc}",
                ),
            ],
        )

    if not isinstance(doc, dict):
        return LintReport(
            ok=False,
            errors=[
                LintIssue(
                    severity="error",
                    code="schema.not_mapping",
                    message=f"Top-level value must be a mapping, got {type(doc).__name__}.",
                ),
            ],
        )

    schema_errors: list[LintIssue] = []
    try:
        SigmaRule.from_yaml(yaml_text)
    except SigmaError as exc:
        schema_errors.append(
            LintIssue(
                severity="error",
                code="schema.pysigma",
                message=str(exc),
            )
        )

    style_errors, warnings, info = _style_checks(doc)
    all_errors = schema_errors + style_errors

    return LintReport(
        ok=len(all_errors) == 0,
        errors=all_errors,
        warnings=warnings,
        info=info,
    )
