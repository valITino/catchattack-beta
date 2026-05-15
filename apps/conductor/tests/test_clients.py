"""Unit tests for the client wrappers."""

from __future__ import annotations

import pytest
from conductor.clients.llm import StaticLLM, _extract_yaml
from conductor.clients.mcp import StaticMCPClient, _to_underscore


def test_to_underscore_translates_first_dot_only() -> None:
    assert _to_underscore("splunk.deploy_rule") == "splunk_deploy_rule"
    assert _to_underscore("sentinel.triage.list_incidents") == "sentinel_triage.list_incidents"
    assert _to_underscore("plain") == "plain"


async def test_static_mcp_client_dispatches_to_handler() -> None:
    c = StaticMCPClient()
    c.respond_to("sigma.lint_sigma", result={"ok": True})
    out = await c.call("sigma.lint_sigma", {"yaml_text": "x"})
    assert out == {"ok": True}
    assert c.calls == [("sigma.lint_sigma", {"yaml_text": "x"})]


async def test_static_mcp_client_filters_by_params_subset() -> None:
    c = StaticMCPClient()
    c.respond_to("splunk.deploy_rule", {"dry_run": True}, result={"deployed": False})
    c.respond_to("splunk.deploy_rule", {"dry_run": False}, result={"deployed": True})
    a = await c.call("splunk.deploy_rule", {"name": "x", "dry_run": True})
    b = await c.call("splunk.deploy_rule", {"name": "x", "dry_run": False})
    assert a == {"deployed": False}
    assert b == {"deployed": True}


async def test_static_mcp_client_raises_for_unregistered() -> None:
    c = StaticMCPClient()
    with pytest.raises(AssertionError, match="no handler"):
        await c.call("missing.tool", {})


async def test_static_llm_returns_canned_rule() -> None:
    llm = StaticLLM()
    rule = await llm.draft_sigma_rule(
        technique="T1059.001",
        evidence={"x": 1},
        system_prompt="x",
    )
    assert "EncodedCommand" in rule
    assert llm.call_count == 1


def test_extract_yaml_pulls_first_code_block() -> None:
    text = "Some prose\n```yaml\ntitle: hi\nid: 1\n```\nmore prose"
    assert _extract_yaml(text) == "title: hi\nid: 1"


def test_extract_yaml_falls_back_to_full_text() -> None:
    assert _extract_yaml("title: x\nid: 1") == "title: x\nid: 1"
