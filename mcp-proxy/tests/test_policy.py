from __future__ import annotations

from mcp_proxy.policy import PolicyEngine


def test_non_destructive_tool_is_always_allowed(engine: PolicyEngine) -> None:
    d = engine.evaluate("sigma.lint_sigma", {"yaml_text": "..."}, approval_header=None)
    assert d.allowed
    assert d.reason == "non_destructive"
    assert not d.dry_run_enforced


def test_destructive_without_dry_run_or_approval_is_denied(engine: PolicyEngine) -> None:
    d = engine.evaluate(
        "splunk.deploy_rule",
        {"name": "x", "spl": "search *", "index_target": "test"},
        approval_header=None,
    )
    assert not d.allowed
    assert d.requires_approval
    assert "dry_run" in d.reason


def test_destructive_with_dry_run_is_allowed_and_in_allowlist(engine: PolicyEngine) -> None:
    d = engine.evaluate(
        "splunk.deploy_rule",
        {"name": "x", "spl": "search *", "index_target": "test", "dry_run": True},
        approval_header=None,
    )
    assert d.allowed
    assert d.dry_run_enforced
    assert d.reason == "dry_run"


def test_destructive_with_dry_run_but_target_outside_allowlist_is_denied(
    engine: PolicyEngine,
) -> None:
    d = engine.evaluate(
        "splunk.deploy_rule",
        {"name": "x", "spl": "search *", "index_target": "prod", "dry_run": True},
        approval_header=None,
    )
    assert not d.allowed
    assert "allowlist" in d.reason


def test_destructive_with_valid_approval_token_bypasses_allowlist(
    engine: PolicyEngine,
) -> None:
    d = engine.evaluate(
        "splunk.deploy_rule",
        {"name": "x", "spl": "search *", "index_target": "prod"},
        approval_header="t0p-s3cret",
    )
    assert d.allowed
    assert d.reason in {"approved", "approved_override"}


def test_invalid_approval_token_is_rejected(engine: PolicyEngine) -> None:
    d = engine.evaluate(
        "splunk.deploy_rule",
        {"name": "x", "spl": "search *", "index_target": "prod"},
        approval_header="wrong-token",
    )
    assert not d.allowed


def test_missing_target_param_is_denied(engine: PolicyEngine) -> None:
    d = engine.evaluate(
        "agents.run_atomic",
        {"technique": "T1059.001", "test_number": 1, "dry_run": True},
        approval_header=None,
    )
    assert not d.allowed
    assert "missing" in d.reason


def test_target_param_in_allowlist_passes_with_dry_run(engine: PolicyEngine) -> None:
    d = engine.evaluate(
        "agents.run_atomic",
        {
            "agent_id": "lab-linux-01",
            "technique": "T1059.004",
            "test_number": 1,
            "dry_run": True,
        },
        approval_header=None,
    )
    assert d.allowed
    assert d.dry_run_enforced
