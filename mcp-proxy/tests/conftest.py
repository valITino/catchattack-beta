from __future__ import annotations

from pathlib import Path

import pytest
from mcp_proxy.audit import AuditLog
from mcp_proxy.config import ProxyConfig, TargetAllowlist, Upstream
from mcp_proxy.policy import PolicyEngine


@pytest.fixture
def sample_config() -> ProxyConfig:
    return ProxyConfig(
        destructive_tools=["splunk.deploy_rule", "agents.run_atomic"],
        target_allowlists={
            "splunk.deploy_rule": TargetAllowlist(param="index_target", allowed=["test", "lab"]),
            "agents.run_atomic": TargetAllowlist(
                param="agent_id", allowed=["lab-linux-01", "lab-win-01"]
            ),
        },
        upstreams={"sigma": Upstream(mode="stub")},
    )


@pytest.fixture
def engine(sample_config: ProxyConfig) -> PolicyEngine:
    return PolicyEngine(sample_config, approval_token="t0p-s3cret")


@pytest.fixture
def audit_log(tmp_path: Path) -> AuditLog:
    return AuditLog(tmp_path / "audit.jsonl")
