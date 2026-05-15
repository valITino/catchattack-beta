"""Named workflows. Each one is a coroutine accepting (run, inputs, deps)."""

from __future__ import annotations

from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from typing import Any

from conductor.runs import Run

WorkflowFn = Callable[[Run, dict[str, Any], "WorkflowDeps"], Awaitable[dict[str, Any]]]


@dataclass(slots=True)
class WorkflowDeps:
    """Dependency bag passed to every workflow.

    Concrete types are imported lazily so test fixtures can construct the
    bag without dragging the production clients into the import graph.
    """

    mcp: Any
    llm: Any
    pr: Any
    system_prompt: str
    fp_threshold_per_day: int = 5
    dedupe_threshold: float = 0.85
    max_refinement_loops: int = 3
    dedupe_corpus_path: str = "detections"


_REGISTRY: dict[str, WorkflowFn] = {}


def register(name: str) -> Callable[[WorkflowFn], WorkflowFn]:
    def wrap(fn: WorkflowFn) -> WorkflowFn:
        _REGISTRY[name] = fn
        return fn

    return wrap


def get(name: str) -> WorkflowFn | None:
    return _REGISTRY.get(name)


def names() -> list[str]:
    return sorted(_REGISTRY.keys())


# Side-effect: registers workflows on import.
from . import closed_loop_rule_synthesis  # noqa: E402,F401
