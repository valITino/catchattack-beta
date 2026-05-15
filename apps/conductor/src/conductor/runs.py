"""Workflow run state and progress events.

Phase 4 ships an in-memory registry. Each run is a `Run` with a status, a
list of `StepEvent`s, and a final result. SSE consumers subscribe to a run
and receive events as they arrive.

Phase 5+ moves persistence to Postgres; the API doesn't change.
"""

from __future__ import annotations

import asyncio
import contextlib
import uuid
from collections import deque
from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import StrEnum
from typing import Any


class RunStatus(StrEnum):
    QUEUED = "queued"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    ABORTED = "aborted"


@dataclass(frozen=True, slots=True)
class StepEvent:
    """One status update emitted by a workflow step."""

    ts: datetime
    step: int
    total: int
    verb: str
    tool: str | None = None
    params: dict[str, Any] | None = None
    summary: str | None = None
    level: str = "info"  # info|warn|error


@dataclass(slots=True)
class Run:
    id: str
    workflow: str
    status: RunStatus
    created_at: datetime
    inputs: dict[str, Any]
    events: list[StepEvent] = field(default_factory=list)
    result: dict[str, Any] | None = None
    error: dict[str, Any] | None = None
    _queue: asyncio.Queue[StepEvent | None] = field(
        default_factory=lambda: asyncio.Queue(maxsize=1024)
    )

    def record(self, event: StepEvent) -> None:
        self.events.append(event)
        try:
            self._queue.put_nowait(event)
        except asyncio.QueueFull:
            # Drop oldest to make space — workflow correctness is independent
            # of SSE delivery.
            with contextlib.suppress(asyncio.QueueEmpty):
                _ = self._queue.get_nowait()
            self._queue.put_nowait(event)

    def close(self) -> None:
        # Sentinel — SSE consumers stop iterating.
        with contextlib.suppress(asyncio.QueueFull):
            self._queue.put_nowait(None)

    async def subscribe(self) -> asyncio.Queue[StepEvent | None]:
        return self._queue


class RunRegistry:
    """In-memory run registry. Single-process; tests use it directly."""

    def __init__(self) -> None:
        self._runs: dict[str, Run] = {}
        self._recent: deque[str] = deque(maxlen=200)

    def create(self, workflow: str, inputs: dict[str, Any]) -> Run:
        rid = str(uuid.uuid4())
        run = Run(
            id=rid,
            workflow=workflow,
            status=RunStatus.QUEUED,
            created_at=datetime.now(tz=UTC),
            inputs=inputs,
        )
        self._runs[rid] = run
        self._recent.append(rid)
        return run

    def get(self, run_id: str) -> Run | None:
        return self._runs.get(run_id)

    def list_recent(self) -> list[Run]:
        return [self._runs[rid] for rid in reversed(self._recent) if rid in self._runs]
