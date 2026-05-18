"""In-process workflow runner.

Wraps a `WorkflowFn` in error handling that converts `GateFailedError` into a
structured `error` payload on the Run, and any other exception into a
`run.failed.unhandled` event so the SSE consumer sees something coherent.
"""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from conductor import workflows
from conductor.runs import EventLevel, Run, RunStatus, StepEvent
from conductor.workflows import WorkflowDeps
from conductor.workflows.closed_loop_rule_synthesis import GateFailedError


async def execute(run: Run, deps: WorkflowDeps) -> dict[str, Any]:
    fn = workflows.get(run.workflow)
    if fn is None:
        run.status = RunStatus.FAILED
        run.error = {"code": "unknown_workflow", "message": run.workflow}
        run.close()
        return run.error
    run.status = RunStatus.RUNNING
    try:
        result = await fn(run, run.inputs, deps)
    except GateFailedError as exc:
        run.status = RunStatus.FAILED
        run.error = {"code": exc.code, "message": exc.message, "detail": exc.detail}
        run.record(
            StepEvent(
                ts=datetime.now(tz=UTC),
                step=-1,
                total=-1,
                verb="gate failed",
                summary=f"{exc.code}: {exc.message}",
                level=EventLevel.ERROR,
            )
        )
    except Exception as exc:
        run.status = RunStatus.FAILED
        run.error = {"code": "run.failed.unhandled", "message": str(exc), "detail": {}}
        run.record(
            StepEvent(
                ts=datetime.now(tz=UTC),
                step=-1,
                total=-1,
                verb="unhandled error",
                summary=str(exc),
                level=EventLevel.ERROR,
            )
        )
    else:
        run.status = RunStatus.SUCCEEDED
        run.result = result
    finally:
        run.close()
        # Signal end-of-run to any /live/{run_id}/markers WebSocket clients.
        if deps.marker_hub is not None:
            deps.marker_hub.close(run.id)
    if run.status == RunStatus.SUCCEEDED:
        return run.result or {}
    return run.error or {}
