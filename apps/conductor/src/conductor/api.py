"""FastAPI surface for the Conductor.

Endpoints:
- POST /workflows/{name}/run        — queue a workflow with JSON inputs.
- GET  /workflows/runs/{id}         — fetch the run record.
- GET  /workflows/runs/{id}/sse     — stream `StepEvent`s as Server-Sent Events.
- GET  /workflows                   — list registered workflow names.
- GET  /live/{run_id}/token         — mint a LiveKit viewer token (Phase 6).
- WS   /live/{run_id}/markers       — live marker stream (Phase 6).
- GET  /health                      — liveness.
"""

from __future__ import annotations

import asyncio
import contextlib
import json
from collections.abc import AsyncIterator
from typing import Any

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, ConfigDict
from sse_starlette.sse import EventSourceResponse

from . import workflows
from .livekit import LiveKitConfig, mint_viewer_token, room_name
from .runner import execute
from .runs import Run, RunRegistry, StepEvent
from .workflows import WorkflowDeps


class RunRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    inputs: dict[str, Any]


_background_tasks: set[asyncio.Task[Any]] = set()


def create_app(  # noqa: PLR0915 — one nested def per route; splitting hides the surface
    registry: RunRegistry, deps: WorkflowDeps
) -> FastAPI:
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

    # ---- Phase 6: live mode ------------------------------------------------

    @app.get("/live/{run_id}/token")
    def live_token(run_id: str, identity: str = "viewer") -> dict[str, Any]:
        """Mint a subscribe-only LiveKit token for the run's room.

        The web BFF calls this; the browser never sees the LiveKit secret.
        """
        config = LiveKitConfig.from_env()
        if not config.configured:
            raise HTTPException(503, detail="LiveKit is not configured")
        token = mint_viewer_token(config, run_id, identity)
        return {
            "url": config.url,
            "room": room_name(run_id),
            "token": token,
        }

    @app.websocket("/live/{run_id}/markers")
    async def live_markers(websocket: WebSocket, run_id: str) -> None:
        """Stream live markers for a run over a WebSocket (non-browser
        consumers and direct connections)."""
        await websocket.accept()
        hub = deps.marker_hub
        if hub is None:
            await websocket.send_json({"type": "error", "detail": "marker hub disabled"})
            await websocket.close()
            return
        queue = hub.subscribe(run_id)
        try:
            while True:
                marker = await queue.get()
                if marker is None:
                    await websocket.send_json({"type": "done"})
                    break
                await websocket.send_json({"type": "marker", "marker": marker})
        except WebSocketDisconnect:
            pass
        finally:
            hub.unsubscribe(run_id, queue)
            with contextlib.suppress(RuntimeError):
                await websocket.close()

    @app.get("/live/{run_id}/markers/sse")
    async def live_markers_sse(run_id: str) -> EventSourceResponse:
        """SSE form of the marker stream. The web BFF proxies this because
        Next.js route handlers cannot proxy a WebSocket upgrade."""
        hub = deps.marker_hub
        if hub is None:
            raise HTTPException(503, detail="marker hub disabled")
        return EventSourceResponse(_marker_stream(hub, run_id))

    return app


async def _marker_stream(hub: Any, run_id: str) -> AsyncIterator[dict[str, str]]:
    queue = hub.subscribe(run_id)
    try:
        while True:
            marker = await queue.get()
            if marker is None:
                yield {"event": "done", "data": "{}"}
                return
            yield {"event": "marker", "data": json.dumps(marker)}
    finally:
        hub.unsubscribe(run_id, queue)


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
