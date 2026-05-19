from __future__ import annotations

import pytest
from pydantic import ValidationError
from wazuh_mcp.rules import WazuhRuleSpec, render_rule_xml


def test_render_minimal_match_rule() -> None:
    spec = WazuhRuleSpec(
        rule_id=100100,
        level=10,
        description="PowerShell encoded command",
        match_text="-EncodedCommand",
        groups=["powershell"],
    )
    xml = render_rule_xml(spec)
    assert '<rule id="100100" level="10">' in xml
    assert "<match>-EncodedCommand</match>" in xml
    assert "<description>PowerShell encoded command</description>" in xml
    assert "powershell" in xml


def test_render_with_pcre2_and_if_sid() -> None:
    spec = WazuhRuleSpec(
        rule_id=100200,
        level=12,
        description="Suspicious child",
        pcre2=r"powershell.*-enc",
        if_sid=[18100, 18101],
    )
    xml = render_rule_xml(spec)
    assert "<if_sid>18100</if_sid>" in xml
    assert "<if_sid>18101</if_sid>" in xml
    assert "<pcre2>powershell.*-enc</pcre2>" in xml


def test_rule_id_must_be_in_local_range() -> None:
    with pytest.raises(ValidationError):
        WazuhRuleSpec(rule_id=50000, level=5, description="too low")
    with pytest.raises(ValidationError):
        WazuhRuleSpec(rule_id=99999, level=5, description="still too low")
    with pytest.raises(ValidationError):
        WazuhRuleSpec(rule_id=200000, level=5, description="too high")


def test_level_must_be_0_to_15() -> None:
    with pytest.raises(ValidationError):
        WazuhRuleSpec(rule_id=100100, level=16, description="over")


def test_xml_special_chars_are_escaped() -> None:
    spec = WazuhRuleSpec(
        rule_id=100100,
        level=5,
        description='Has <special> & "chars"',
        match_text="<script>",
    )
    xml = render_rule_xml(spec)
    assert "<script>" not in xml.replace("<rule", "").replace("</rule", "")
    assert "&lt;script&gt;" in xml
    assert "&amp;" in xml
