from __future__ import annotations

from mcp_proxy.audit import AuditLog


def test_record_writes_jsonl_with_redacted_secrets(audit_log: AuditLog) -> None:
    audit_log.record(
        caller="conductor",
        tool="splunk.deploy_rule",
        params={
            "name": "test_rule",
            "spl": "search *",
            "api_token": "ghp_super_secret",
            "nested": {"client_secret": "xyz", "ok": "visible"},
        },
        result={"status": "dry_run_ok"},
        latency_ms=12,
        dry_run=True,
        approval_token_id=None,
        decision="dry_run",
    )

    entries = list(audit_log.read_all())
    assert len(entries) == 1
    entry = entries[0]
    assert entry["tool"] == "splunk.deploy_rule"
    assert entry["params"]["api_token"] == "***redacted***"
    assert entry["params"]["nested"]["client_secret"] == "***redacted***"
    assert entry["params"]["nested"]["ok"] == "visible"
    assert entry["params"]["spl"] == "search *"
    assert entry["dry_run"] is True
    assert entry["decision"] == "dry_run"
    assert len(entry["result_hash"]) == 16


def test_multiple_records_append(audit_log: AuditLog) -> None:
    for i in range(3):
        audit_log.record(
            caller="ui",
            tool="sigma.lint_sigma",
            params={"yaml_text": f"rule_{i}"},
            result={"errors": []},
            latency_ms=1,
            dry_run=False,
            approval_token_id=None,
            decision="non_destructive",
        )
    assert len(list(audit_log.read_all())) == 3
