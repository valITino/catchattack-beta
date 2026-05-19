"""Convert a Sigma rule to a target backend query language.

Targets map to specific pySigma backends:
    splunk    -> sigma.backends.splunk.SplunkBackend
    sentinel  -> sigma.backends.kusto.KustoBackend
    chronicle -> sigma.backends.secops.SecOpsBackend (Google SecOps UDM-search)
    elastic   -> sigma.backends.elasticsearch.LuceneBackend
    falcon    -> sigma.backends.crowdstrike.LogScaleBackend

Pipelines are configurable per call (`pipeline` parameter). When None, the
backend default is used; the trace records that fact.
"""

from __future__ import annotations

from typing import Any

import yaml
from sigma.collection import SigmaCollection
from sigma.exceptions import SigmaError

from .models import ConvertResult, ConvertTarget, ServerError


def _make_backend(target: ConvertTarget) -> Any:
    """Import and instantiate the backend for the given target.

    Imports are local so a missing optional backend only breaks its own
    target, not the whole module.
    """
    # Lazy imports — keeping each backend hidden behind its branch lets the
    # module load even if one backend's wheel fails to install.
    if target is ConvertTarget.SPLUNK:
        from sigma.backends.splunk import SplunkBackend  # noqa: PLC0415

        return SplunkBackend()
    if target is ConvertTarget.SENTINEL:
        from sigma.backends.kusto import KustoBackend  # noqa: PLC0415

        return KustoBackend()
    if target is ConvertTarget.CHRONICLE:
        from sigma.backends.secops import SecOpsBackend  # noqa: PLC0415

        return SecOpsBackend()  # type: ignore[no-untyped-call]
    if target is ConvertTarget.ELASTIC:
        from sigma.backends.elasticsearch import LuceneBackend  # noqa: PLC0415

        return LuceneBackend()
    if target is ConvertTarget.FALCON:
        from sigma.backends.crowdstrike import LogScaleBackend  # noqa: PLC0415

        return LogScaleBackend()
    raise ValueError(f"Unsupported target: {target!r}")  # pragma: no cover


def convert_sigma(
    yaml_text: str,
    target: ConvertTarget,
    pipeline: str | None = None,
) -> ConvertResult | ServerError:
    """Convert a Sigma rule's YAML to the target query language.

    Returns ConvertResult on success, ServerError on validation failure.
    Never raises on bad input.
    """
    if not yaml_text or not yaml_text.strip():
        return ServerError(error="empty_input", detail="yaml_text is empty.")

    try:
        collection = SigmaCollection.from_yaml(yaml_text)
    except yaml.YAMLError as exc:
        return ServerError(
            error="invalid_yaml",
            detail=str(exc),
            suggestions=["Run lint_sigma first to identify schema issues."],
        )
    except SigmaError as exc:
        return ServerError(
            error="invalid_sigma",
            detail=str(exc),
            suggestions=["Run lint_sigma first to identify schema issues."],
        )

    try:
        backend = _make_backend(target)
    except ImportError as exc:
        return ServerError(
            error="missing_backend",
            detail=f"Backend for target '{target.value}' is not installed: {exc}",
        )

    trace: list[str] = []
    if pipeline:
        trace.append(f"pipeline={pipeline} (requested; not yet wired in Phase 1)")
    else:
        trace.append("pipeline=<backend default>")
    trace.append(f"backend={type(backend).__name__}")
    trace.append(f"rules={len(collection)}")

    try:
        result = backend.convert(collection)
    except SigmaError as exc:
        return ServerError(
            error="conversion_failed",
            detail=str(exc),
            suggestions=[
                "The rule parses but the target backend cannot express it. "
                "Try a different target or simplify the detection logic.",
            ],
        )

    queries: list[str] = [str(q) for q in result] if isinstance(result, list) else [str(result)]

    return ConvertResult(
        target=target,
        pipeline=pipeline,
        queries=queries,
        pipeline_trace=trace,
        backend=type(backend).__name__,
        warnings=[],
    )
