"""Render a Wazuh rule XML stanza from a small structured spec.

This is intentionally minimal — Wazuh's rule grammar is large and we are not
trying to translate arbitrary Sigma rules here. Phase 4's Conductor uses
`mcp/sigma.convert_sigma(target="splunk")` for SPL and a separate Wazuh
template for XML. The render function below is the template.
"""

from __future__ import annotations

from xml.sax.saxutils import escape

from pydantic import BaseModel, ConfigDict, Field

_DEFAULT_GROUP = "catchattack,custom,"


class WazuhRuleSpec(BaseModel):
    """Inputs accepted by `deploy_rule`."""

    model_config = ConfigDict(extra="forbid")

    rule_id: int = Field(ge=100000, le=199999, description="Local rule range.")
    level: int = Field(ge=0, le=15)
    description: str = Field(max_length=256)
    match_text: str | None = Field(
        default=None,
        description="Substring to look for in the alert's `full_log`.",
    )
    pcre2: str | None = Field(
        default=None,
        description="PCRE2 regex to match against `full_log`. Mutually optional with match_text.",
    )
    groups: list[str] = Field(default_factory=list)
    if_sid: list[int] = Field(
        default_factory=list,
        description="Parent rule IDs that must fire first. Empty = standalone.",
    )


def render_rule_xml(spec: WazuhRuleSpec) -> str:
    """Render a single <rule>…</rule> element ready to drop into local_rules.xml."""
    group = ",".join([_DEFAULT_GROUP.strip(","), *spec.groups])
    parts = [
        f'<group name="{escape(group)}">',
        f'  <rule id="{spec.rule_id}" level="{spec.level}">',
    ]
    parts.extend(f"    <if_sid>{parent}</if_sid>" for parent in spec.if_sid)
    if spec.match_text:
        parts.append(f"    <match>{escape(spec.match_text)}</match>")
    if spec.pcre2:
        parts.append(f"    <pcre2>{escape(spec.pcre2)}</pcre2>")
    parts.append(f"    <description>{escape(spec.description)}</description>")
    parts.append("  </rule>")
    parts.append("</group>")
    return "\n".join(parts) + "\n"
