"""FastAPI surface for the Conductor.

Endpoints:
- POST /workflows/{name}/run     — queue a workflow with JSON inputs.
- GET  /workflows/runs/{id}      — fetch the run record.
- GET  /workflows/runs/{id}/sse  — stream `StepEvent`s as Server-Sent Events.
- GET  /workflows                — list registered workflow names.
- GET  /health                   — liveness.
"""

from __future__ import annotations

import asyncio
import json
from collections.abc import AsyncIterator
from typing import Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, ConfigDict
from sse_starlette.sse import EventSourceResponse

from . import workflows
from .runner import execute
from .runs import Run, RunRegistry, StepEvent
from .workflows import WorkflowDeps


class RunRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    inputs: dict[str, Any]


_background_tasks: set[asyncio.Task[Any]] = set()


def create_app(registry: RunRegistry, deps: WorkflowDeps) -> FastAPI:
    app = FastAPI(
        title="CatchAttack Conductor",
        version="0.1.0",
        description="Autonomous detection-engineering workflows.",
    )

    @app.get("/health")
    def health() -> dict[str, Any]:
        return {"status": "ok", "workflows": workflows.names()}

    @app.get("/workflows")
    def list_workflows() -> dict[str, Any]:
        return {"items": workflows.names()}

    @app.post("/workflows/{name}/run", status_code=202)
    async def start_run(name: str, request: RunRequest) -> dict[str, Any]:
        if workflows.get(name) is None:
            raise HTTPException(404, detail=f"unknown workflow: {name}")
        run = registry.create(workflow=name, inputs=request.inputs)
        # Fire and forget — the SSE endpoint streams progress, the GET
        # endpoint returns the final state. Hold a reference so the task is
        # not garbage-collected before completion.
        task = asyncio.create_task(execute(run, deps))
        _background_tasks.add(task)
        task.add_done_callback(_background_tasks.discard)
        return {"run_id": run.id, "status": run.status.value}

    @app.get("/workflows/runs/{run_id}")
    def get_run(run_id: str) -> dict[str, Any]:
        run = registry.get(run_id)
        if run is None:
            raise HTTPException(404, detail="run not found")
        return _serialise(run)

    @app.get("/workflows/runs/{run_id}/sse")
    async def stream_run(run_id: str) -> EventSourceResponse:
        run = registry.get(run_id)
        if run is None:
            raise HTTPException(404, detail="run not found")
        return EventSourceResponse(_event_stream(run))

    return app


def _serialise(run: Run) -> dict[str, Any]:
    return {
        "id": run.id,
        "workflow": run.workflow,
        "status": run.status.value,
        "created_at": run.created_at.isoformat(),
        "inputs": run.inputs,
        "events": [_event(e) for e in run.events],
        "result": run.result,
        "error": run.error,
    }


def _event(e: StepEvent) -> dict[str, Any]:
    return {
        "ts": e.ts.isoformat(),
        "step": e.step,
        "total": e.total,
        "verb": e.verb,
        "tool": e.tool,
        "params": e.params,
        "summary": e.summary,
        "level": e.level,
    }


async def _event_stream(run: Run) -> AsyncIterator[dict[str, str]]:
    # Replay any events already recorded.
    for e in list(run.events):
        yield {"event": "step", "data": json.dumps(_event(e))}
    # Then live-stream until close().
    queue = await run.subscribe()
    while True:
        ev = await queue.get()
        if ev is None:
            yield {"event": "done", "data": json.dumps({"status": run.status.value})}
            return
        yield {"event": "step", "data": json.dumps(_event(ev))}
