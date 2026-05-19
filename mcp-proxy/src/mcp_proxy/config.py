"""Config loader for the MCP proxy.

Loads `upstreams.yaml` into typed pydantic models. The file is treated as
fully-trusted (operator-controlled), but every field is still validated so
schema drift is caught at startup, not at runtime.
"""

from __future__ import annotations

from pathlib import Path
from typing import Literal

import yaml
from pydantic import BaseModel, ConfigDict, Field


class TargetAllowlist(BaseModel):
    model_config = ConfigDict(extra="forbid")

    param: str = Field(..., description="Path of the target field in the tool input.")
    allowed: list[str] = Field(default_factory=list)


class BreakerConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    consecutive_failures: int = 5
    cooldown_seconds: int = 30


class RateLimitConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    rps: int = 10
    burst: int = 20
    breaker: BreakerConfig = Field(default_factory=BreakerConfig)


class Upstream(BaseModel):
    model_config = ConfigDict(extra="forbid")

    mode: Literal["stub", "stdio", "http", "mock", "real"] = "stub"
    description: str | None = None
    mock_url: str | None = None
    real_url: str | None = None
    real_cmd: str | None = None
    rate_limit: RateLimitConfig | None = None


class ProxyConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    namespace_separator: str = "."
    destructive_tools: list[str] = Field(default_factory=list)
    target_allowlists: dict[str, TargetAllowlist] = Field(default_factory=dict)
    approval_token_env: str = "CATCHATTACK_APPROVAL_TOKEN"  # noqa: S105 — env-var name, not a secret
    audit_log_path: str = "./audit.jsonl"
    rate_limit_default: RateLimitConfig = Field(default_factory=RateLimitConfig)
    upstreams: dict[str, Upstream] = Field(default_factory=dict)


def load_config(path: str | Path) -> ProxyConfig:
    """Read and validate an `upstreams.yaml`-style file."""
    raw = yaml.safe_load(Path(path).read_text(encoding="utf-8"))
    if not isinstance(raw, dict):
        raise TypeError(f"Config root must be a mapping, got {type(raw).__name__}")
    return ProxyConfig.model_validate(raw)
