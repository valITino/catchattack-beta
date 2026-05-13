"""Integration test for the policy-aware router.

Spins up an in-memory FastMCP "upstream" with a couple of tools and mounts
it under a namespace, then drives requests through a fastmcp Client. Covers
both the non-destructive happy path and a denial.
"""

from __future__ import annotations

from pathlib import Path

import pytest
from fastmcp import Client, FastMCP
from mcp_proxy.audit import AuditLog
from mcp_proxy.config import ProxyConfig, TargetAllowlist, Upstream
from mcp_proxy.policy import PolicyEngine
from mcp_proxy.router import PolicyMiddleware


@pytest.fixture
def upstream() -> FastMCP:
    inner: FastMCP = FastMCP(name="inner")

    @inner.tool
    def lint_sigma(yaml_text: str) -> dict[str, object]:  # non-destructive
        return {"ok": True, "preview": yaml_text[:10]}

    @inner.tool
    def deploy_rule(name: str, index_target: str, dry_run: bool = True) -> dict[str, object]:
        return {"deployed": not dry_run, "name": name, "index": index_target}

    return inner


@pytest.fixture
def router_with_upstream(
    upstream: FastMCP, tmp_path: Path
) -> tuple[FastMCP, AuditLog, PolicyEngine]:
    config = ProxyConfig(
        destructive_tools=["splunk.deploy_rule"],
        target_allowlists={
            "splunk.deploy_rule": TargetAllowlist(param="index_target", allowed=["test"]),
        },
        upstreams={"splunk": Upstream(mode="stub")},
    )
    engine = PolicyEngine(config, approval_token="t0p-s3cret")
    audit = AuditLog(tmp_path / "audit.jsonl")

    router: FastMCP = FastMCP(name="router")
    router.add_middleware(PolicyMiddleware(engine, audit, namespaces={"splunk"}))
    router.mount(upstream, namespace="splunk")
    return router, audit, engine


async def test_non_destructive_tool_is_forwarded(
    router_with_upstream: tuple[FastMCP, AuditLog, PolicyEngine],
) -> None:
    router, audit, _ = router_with_upstream
    async with Client(router) as client:
        result = await client.call_tool("splunk_lint_sigma", {"yaml_text": "title: hi"})
        data = getattr(result, "data", None) or getattr(result, "structured_content", None)
        assert data is not None
        assert data["ok"] is True

    entries = list(audit.read_all())
    assert any(e["tool"] == "splunk.lint_sigma" for e in entries)


async def test_destructive_tool_outside_allowlist_is_denied(
    router_with_upstream: tuple[FastMCP, AuditLog, PolicyEngine],
) -> None:
    router, audit, _ = router_with_upstream
    async with Client(router) as client:
        with pytest.raises(Exception, match=r"proxy_denied|allowlist") as exc:
            await client.call_tool(
                "splunk_deploy_rule",
                {"name": "x", "index_target": "prod", "dry_run": True},
            )
        assert "proxy_denied" in str(exc.value) or "allowlist" in str(exc.value).lower()

    entries = list(audit.read_all())
    assert any(
        e["decision"].startswith("destructive") or "allowlist" in e["decision"] for e in entries
    )


async def test_destructive_tool_in_allowlist_with_dry_run_passes(
    router_with_upstream: tuple[FastMCP, AuditLog, PolicyEngine],
) -> None:
    router, _, _ = router_with_upstream
    async with Client(router) as client:
        result = await client.call_tool(
            "splunk_deploy_rule",
            {"name": "x", "index_target": "test", "dry_run": True},
        )
        data = getattr(result, "data", None) or getattr(result, "structured_content", None)
        assert data is not None
        assert data["deployed"] is False
        assert data["index"] == "test"
