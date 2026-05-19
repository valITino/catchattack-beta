"""Pydantic models for the Evidence MCP.

Mirror the JSON Schema in packages/schemas/capture_bundle.schema.json, plus the
tool-specific I/O shapes from BUILD_BRIEF_ADDENDUM.md §E.2.
"""

from __future__ import annotations

from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field


class TriggerKind(StrEnum):
    ATOMIC = "atomic"
    CALDERA_OPERATION = "caldera_operation"
    MANUAL = "manual"
    SCHEDULED = "scheduled"


class MarkerKind(StrEnum):
    ATOMIC_STEP_START = "atomic_step_start"
    ATOMIC_STEP_END = "atomic_step_end"
    CALDERA_ABILITY_START = "caldera_ability_start"
    CALDERA_ABILITY_END = "caldera_ability_end"
    LABELED_ATTACK = "labeled_attack"
    DETECTION_HIT = "detection_hit"
    SYSMON_EVENT = "sysmon_event"
    PROCESS_SPAWN = "process_spawn"
    NETWORK_CONNECTION = "network_connection"
    OPERATOR_NOTE = "operator_note"


class MarkerColor(StrEnum):
    RED = "red"
    BLUE = "blue"
    NEUTRAL = "neutral"


class Marker(BaseModel):
    model_config = ConfigDict(extra="forbid")

    t_ms: int = Field(ge=0, description="Milliseconds since capture started_at.")
    kind: MarkerKind
    label: str = Field(max_length=256)
    ref: str | None = None
    color: MarkerColor | None = None
    filled: bool | None = None


class Trigger(BaseModel):
    model_config = ConfigDict(extra="forbid")

    kind: TriggerKind
    atomic_technique: str | None = Field(default=None, pattern=r"^T\d{4}(\.\d{3})?$")
    atomic_test_number: int | None = Field(default=None, ge=1)
    caldera_operation_id: str | None = None
    operator_id: str | None = None


class Artifacts(BaseModel):
    model_config = ConfigDict(extra="forbid")

    video_hls: str | None = None
    video_mp4: str | None = None
    sysmon_events: str | None = None
    auditd_events: str | None = None
    esf_events: str | None = None
    pcap: str | None = None
    process_tree: str | None = None
    atomic_output: str | None = None


class TopProcess(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str
    count: int = Field(ge=1)


class Stats(BaseModel):
    model_config = ConfigDict(extra="forbid")

    event_count: int = Field(ge=0)
    duration_ms: int = Field(ge=0)
    size_bytes: int = Field(ge=0)
    top_processes: list[TopProcess] = Field(default_factory=list, max_length=20)


class CaptureBundle(BaseModel):
    """The CaptureBundle manifest — authoritative shape, validated against the
    JSON Schema in packages/schemas/capture_bundle.schema.json."""

    model_config = ConfigDict(extra="forbid")

    id: str
    agent_id: str
    tenant_id: str | None = None
    started_at: datetime
    ended_at: datetime
    trigger: Trigger
    artifacts: Artifacts = Field(default_factory=Artifacts)
    markers: list[Marker] = Field(default_factory=list)
    stats: Stats


# ---------------------------------------------------------------------------
# Tool I/O — addendum §E.2
# ---------------------------------------------------------------------------


class CaptureListItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    agent_id: str
    started_at: datetime
    ended_at: datetime
    trigger: Trigger
    event_count: int


class CaptureList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[CaptureListItem]
    total: int


class ProcessChain(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str
    count: int
    parent_chains: list[str] = Field(default_factory=list)


class CommandLineEntry(BaseModel):
    model_config = ConfigDict(extra="forbid")

    cmd: str
    count: int
    redacted: bool = False


class NetworkDestination(BaseModel):
    model_config = ConfigDict(extra="forbid")

    host: str
    port: int
    proto: str
    count: int


class FileWrite(BaseModel):
    model_config = ConfigDict(extra="forbid")

    path: str
    count: int


class CaptureSummary(BaseModel):
    """Aggregated telemetry returned by `summarize_capture`."""

    model_config = ConfigDict(extra="forbid")

    capture_id: str
    technique: str | None = None
    duration_ms: int
    top_processes: list[ProcessChain] = Field(default_factory=list)
    top_command_lines: list[CommandLineEntry] = Field(default_factory=list)
    network_destinations: list[NetworkDestination] = Field(default_factory=list)
    file_writes: list[FileWrite] = Field(default_factory=list)
    registry_writes: list[FileWrite] = Field(default_factory=list)
    suspicious_score: float = Field(ge=0.0, le=1.0)
    notable_marker_count: int


class Event(BaseModel):
    """Raw event row returned by `query_events`."""

    model_config = ConfigDict(extra="forbid")

    t_ms: int = Field(ge=0)
    event_id: int | None = None
    process_name: str | None = None
    parent_name: str | None = None
    cmd: str | None = None
    user: str | None = None
    raw: str | None = None


class EventQueryResult(BaseModel):
    model_config = ConfigDict(extra="forbid")

    events: list[Event]
    truncated: bool


class ArtifactURL(BaseModel):
    model_config = ConfigDict(extra="forbid")

    url: str
    expires_at: datetime


class ArtifactKind(StrEnum):
    VIDEO_HLS = "video_hls"
    VIDEO_MP4 = "video_mp4"
    SYSMON_EVENTS = "sysmon_events"
    AUDITD_EVENTS = "auditd_events"
    ESF_EVENTS = "esf_events"
    PCAP = "pcap"
    PROCESS_TREE = "process_tree"
    ATOMIC_OUTPUT = "atomic_output"


class HitCount(BaseModel):
    model_config = ConfigDict(extra="forbid")

    total: int = Field(ge=0)
    by_rule: dict[str, int] = Field(default_factory=dict)


class ServerError(BaseModel):
    model_config = ConfigDict(extra="forbid")

    error: str
    detail: str | None = None
