"""FastAPI entrypoint for the MCP proxy.

Phase 0: a minimal app that loads config, exposes /health and /policy/preview,
and runs the policy engine + audit log against synthetic requests. No upstream
transports yet — those land in Phase 1.

Run:
    uv run uvicorn mcp_proxy.app:app --port 7100
"""

from __future__ import annotations

import logging
import os
import time
from pathlib import Path
from typing import Any

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from .audit import AuditLog
from .config import ProxyConfig, load_config
from .policy import PolicyEngine
from .router import build_router

CONFIG_ENV = "CATCHATTACK_PROXY_CONFIG"
DEFAULT_CONFIG_PATH = "upstreams.yaml"

log = logging.getLogger(__name__)


class PreviewRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    tool: str = Field(..., description="Fully-qualified tool name, e.g. 'splunk.deploy_rule'.")
    params: dict[str, Any] = Field(default_factory=dict)
    caller: str = Field(default="anonymous")


def _load() -> tuple[ProxyConfig, PolicyEngine, AuditLog]:
    path = Path(os.environ.get(CONFIG_ENV, DEFAULT_CONFIG_PATH))
    if not path.exists():
        path = Path(__file__).resolve().parents[2] / "upstreams.example.yaml"
    config = load_config(path)
    approval = os.environ.get(config.approval_token_env)
    if not approval:
        log.warning(
            "%s is unset — destructive tool calls can only run as dry_run; "
            "no approval-token override is possible until it is configured",
            config.approval_token_env,
        )
    engine = PolicyEngine(config, approval_token=approval)
    audit = AuditLog(config.audit_log_path)
    return config, engine, audit


def create_app() -> FastAPI:
    config, engine, audit = _load()
    app = FastAPI(
        title="CatchAttack MCP Proxy",
        version="0.1.0",
        description="Phase 0 skeleton — policy engine + audit log, no upstream routing yet.",
    )

    @app.get("/health")
    def health() -> dict[str, Any]:
        return {
            "status": "ok",
            "upstreams": sorted(config.upstreams.keys()),
            "destructive_tools": sorted(config.destructive_tools),
        }

    @app.post("/policy/preview")
    def policy_preview(
        request: PreviewRequest,
        x_catchattack_approval_token: str | None = Header(default=None),
    ) -> dict[str, Any]:
        """Run the policy engine without forwarding. Useful for dry-runs and tests."""
        start = time.perf_counter()
        decision = engine.evaluate(
            tool=request.tool,
            params=request.params,
            approval_header=x_catchattack_approval_token,
        )
        latency_ms = int((time.perf_counter() - start) * 1000)
        audit.record(
            caller=request.caller,
            tool=request.tool,
            params=request.params,
            result={"decision": decision.reason},
            latency_ms=latency_ms,
            dry_run=bool(request.params.get("dry_run", False)) or decision.dry_run_enforced,
            approval_token_id="present" if x_catchattack_approval_token else None,
            decision=decision.reason,
        )
        if not decision.allowed:
            raise HTTPException(status_code=403, detail=decision.reason)
        return {
            "allowed": True,
            "reason": decision.reason,
            "dry_run_enforced": decision.dry_run_enforced,
        }

    # Mount the FastMCP router as the streamable-HTTP MCP endpoint.
    router = build_router(config, engine, audit)
    mcp_app = router.http_app(path="/", transport="http", stateless_http=True)
    app.mount("/mcp", mcp_app)

    # Re-publish the underlying Starlette lifespan so subprocess upstreams
    # (sigma-mcp via stdio, etc.) are started/stopped with the app.
    app.router.lifespan_context = mcp_app.lifespan

    return app


app = create_app()
