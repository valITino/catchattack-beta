"""I/O models for the agents-bridge MCP tools."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AgentInfo(BaseModel):
    model_config = ConfigDict(extra="forbid")

    agent_id: str
    hostname: str
    os: str
    arch: str
    status: str = Field(description="connected|disconnected")
    last_seen: datetime
    tags: list[str] = Field(default_factory=list)


class AgentList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[AgentInfo]


class Inventory(BaseModel):
    model_config = ConfigDict(extra="forbid")

    agent_id: str
    hostname: str
    os: str
    os_version: str
    arch: str
    ip_addresses: list[str] = Field(default_factory=list)
    process_count: int = 0
    edr_detected: list[str] = Field(default_factory=list)
    captured_at: datetime


class RunReceipt(BaseModel):
    model_config = ConfigDict(extra="forbid")

    run_id: str
    capture_id: str
    agent_id: str
    technique: str
    test_number: int
    dry_run: bool
    started_at: datetime


class CaptureHandle(BaseModel):
    model_config = ConfigDict(extra="forbid")

    capture_id: str
    agent_id: str
    started_at: datetime


class CaptureBundleSummary(BaseModel):
    """Returned by stop_capture — the abbreviated bundle metadata."""

    model_config = ConfigDict(extra="forbid")

    capture_id: str
    agent_id: str
    started_at: datetime
    ended_at: datetime
    event_count: int


class ServerError(BaseModel):
    model_config = ConfigDict(extra="forbid")

    error: str
    detail: str | None = None
