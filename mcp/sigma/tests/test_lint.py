from __future__ import annotations

from sigma_mcp.lint import lint_sigma


def test_lint_clean_rule_is_ok(psh_encoded: str) -> None:
    report = lint_sigma(psh_encoded)
    assert report.ok
    assert report.errors == []


def test_lint_flags_invalid_level_as_error(bad_level_rule: str) -> None:
    report = lint_sigma(bad_level_rule)
    assert not report.ok
    codes = {issue.code for issue in report.errors}
    assert "schema.bad_level" in codes


def test_lint_returns_yaml_parse_error(malformed_yaml: str) -> None:
    report = lint_sigma(malformed_yaml)
    assert not report.ok
    assert any(issue.code == "schema.invalid_yaml" for issue in report.errors)


def test_lint_warns_on_missing_attack_technique_tag() -> None:
    rule = """\
title: Some rule
id: 00000000-0000-0000-0000-000000000001
tags:
  - attack.tactic.execution
logsource:
  category: process_creation
  product: windows
detection:
  selection:
    Image|endswith: '\\\\notepad.exe'
  condition: selection
level: medium
"""
    report = lint_sigma(rule)
    codes = {issue.code for issue in report.warnings}
    assert "style.no_attack_technique" in codes


def test_lint_warns_on_missing_id() -> None:
    rule = """\
title: No id
logsource:
  category: process_creation
  product: windows
detection:
  selection:
    Image|endswith: '\\\\notepad.exe'
  condition: selection
"""
    report = lint_sigma(rule)
    codes = {issue.code for issue in report.warnings}
    assert "style.missing_id" in codes


def test_lint_empty_input_is_error() -> None:
    report = lint_sigma("")
    assert not report.ok
    assert any(issue.code == "schema.empty" for issue in report.errors)


def test_lint_empty_title_does_not_crash() -> None:
    # An empty title once raised IndexError on title[0]; lint must never raise.
    rule = """\
title: ""
id: 00000000-0000-0000-0000-000000000002
logsource:
  category: process_creation
  product: windows
detection:
  selection:
    Image|endswith: '\\\\notepad.exe'
  condition: selection
level: medium
"""
    report = lint_sigma(rule)
    assert "style.title_capitalisation" not in {issue.code for issue in report.info}
