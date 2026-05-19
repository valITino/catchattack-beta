"""closed_loop_rule_synthesis — the flagship Phase 4 workflow.

End-to-end:
  trigger emulation → summarise evidence → draft Sigma → lint → dedupe →
  convert to SPL → FP estimate → dry-run deploy → re-emulate → validate
  the new rule hits in the fresh capture → open a PR.

Each gate is named so the run record (and the eventual web UI) can show
exactly where things stopped. The Conductor never executes
`splunk.deploy_rule(dry_run=false)`; human review is mandatory.
"""

from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta
from typing import Any

from conductor.clients.pr import PRArtifacts
from conductor.runs import EventLevel, Run, StepEvent
from conductor.workflows import WorkflowDeps, register

TOTAL_STEPS = 11
_PARAM_TRUNCATE_AT = 200
# The validation search brackets the re-emulation capture by ±1 minute.
_VALIDATION_WINDOW = timedelta(minutes=1)
# Marker kinds/colours — mirror evidence_mcp.models so the live timeline
# and the recorded timeline render identically. Kept as local constants
# (rather than importing evidence_mcp) so the Conductor does not depend on
# the evidence package just for two string literals.
_MARKER_ATOMIC_START = "atomic_step_start"
_MARKER_DETECTION_HIT = "detection_hit"
_COLOR_ATTACKER = "red"
_COLOR_DEFENDER = "blue"


def _siem_query_params(target_siem: str, query: str, **extra: Any) -> dict[str, Any]:
    """Build the query-tool params for a SIEM target.

    Splunk's tools take the query as `spl`; every other backend takes it as
    `query`. This one-liner keeps that quirk out of the workflow body.
    """
    key = "spl" if target_siem == "splunk" else "query"
    return {key: query, **extra}


class GateFailedError(Exception):
    """Raised when a workflow gate refuses to pass.

    The `code` is the named exit code the brief asks for; the UI maps it to
    a remediation hint.
    """

    def __init__(self, code: str, message: str, detail: dict[str, Any] | None = None) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.detail = detail or {}


def _emit(
    run: Run,
    step: int,
    verb: str,
    tool: str | None = None,
    params: dict[str, Any] | None = None,
    summary: str | None = None,
    *,
    level: EventLevel = EventLevel.INFO,
) -> None:
    run.record(
        StepEvent(
            ts=datetime.now(tz=UTC),
            step=step,
            total=TOTAL_STEPS,
            verb=verb,
            tool=tool,
            params=params,
            summary=summary,
            level=level,
        )
    )


def _detail(payload: dict[str, Any]) -> str:
    return json.dumps({k: v for k, v in payload.items() if k != "raw"}, default=str)[:240]


def _marker(
    deps: WorkflowDeps,
    run: Run,
    *,
    kind: str,
    label: str,
    color: str,
    filled: bool,
    t_ms: int = 0,
) -> None:
    """Publish a live marker to the MarkerHub.

    No-op when `deps.marker_hub` is None (unit tests, headless runs). The
    marker shape matches the capture-bundle Marker so the live timeline
    and the recorded timeline render identically.
    """
    if deps.marker_hub is None:
        return
    deps.marker_hub.publish(
        run.id,
        {
            "t_ms": t_ms,
            "kind": kind,
            "label": label,
            "color": color,
            "filled": filled,
        },
    )


async def _call(
    deps: WorkflowDeps,
    run: Run,
    step: int,
    verb: str,
    tool: str,
    params: dict[str, Any],
    error_code: str,
) -> dict[str, Any]:
    _emit(run, step, verb, tool=tool, params={k: _truncate(v) for k, v in params.items()})
    result = await deps.mcp.call(tool, params)
    if isinstance(result, dict) and "error" in result:
        _emit(run, step, "errored", tool=tool, summary=_detail(result), level=EventLevel.ERROR)
        msg = result.get("detail") or result.get("error", "unknown")
        raise GateFailedError(error_code, msg, result)
    _emit(run, step, "ok", tool=tool, summary=_detail(result))
    assert isinstance(result, dict)
    return result


def _truncate(value: Any) -> Any:
    if isinstance(value, str) and len(value) > _PARAM_TRUNCATE_AT:
        return value[:_PARAM_TRUNCATE_AT] + "…"
    return value


@register("closed_loop_rule_synthesis")
async def closed_loop_rule_synthesis(  # noqa: PLR0915 — 11-step linear workflow; collapsing would obscure brief alignment
    run: Run,
    inputs: dict[str, Any],
    deps: WorkflowDeps,
) -> dict[str, Any]:
    """Run the closed loop against `agent_id`, `technique`, `test_number`."""
    agent_id = inputs["agent_id"]
    technique = inputs["technique"]
    test_number = int(inputs.get("test_number", 1))
    target_siem = inputs.get("target_siem", "splunk")
    index_target = inputs.get("index_target", "test")

    # ---- Step 1: pre-flight, list agents + confirm technique exists --------
    agents = await _call(
        deps, run, 1, "Pre-flight: listing agents", "agents.list_agents", {}, "preflight"
    )
    known_ids = {a["agent_id"] for a in agents.get("items", [])}
    if agent_id not in known_ids:
        raise GateFailedError(
            "preflight.unknown_agent",
            f"agent_id {agent_id!r} is not connected (known: {sorted(known_ids)})",
        )

    # ---- Step 2: first emulation -------------------------------------------
    receipt = await _call(
        deps,
        run,
        2,
        "Running atomic test (first emulation)",
        "agents.run_atomic",
        {
            "agent_id": agent_id,
            "technique": technique,
            "test_number": test_number,
            "dry_run": False,
        },
        "emulation.run_failed",
    )
    capture_id_1 = receipt["capture_id"]
    _marker(
        deps,
        run,
        kind=_MARKER_ATOMIC_START,
        label=f"{technique} test {test_number} executing",
        color=_COLOR_ATTACKER,
        filled=True,
    )

    # ---- Step 3: summarise evidence ----------------------------------------
    evidence = await _call(
        deps,
        run,
        3,
        "Summarising evidence",
        "evidence.summarize_capture",
        {"capture_id": capture_id_1},
        "evidence.summary_failed",
    )
    notable = evidence.get("notable_marker_count", 0)
    if notable == 0:
        raise GateFailedError(
            "evidence.empty",
            "evidence summary returned no notable markers — the atomic test may have failed",
            {"capture_id": capture_id_1, "summary": evidence},
        )

    # ---- Step 4: draft Sigma rule via LLM ----------------------------------
    _emit(run, 4, "Drafting Sigma rule from evidence", tool="llm.draft_sigma_rule")
    rule_yaml = await deps.llm.draft_sigma_rule(
        technique=technique,
        evidence=evidence,
        system_prompt=deps.system_prompt,
    )
    _emit(run, 4, "ok", summary=f"drafted {len(rule_yaml)} chars of YAML")

    # ---- Step 5: lint + dedupe gates ---------------------------------------
    lint = await _call(
        deps,
        run,
        5,
        "Linting drafted rule",
        "sigma.lint_sigma",
        {"yaml_text": rule_yaml},
        "lint.failed",
    )
    if not lint.get("ok", False):
        raise GateFailedError(
            "lint.errors",
            f"sigma.lint_sigma returned {len(lint.get('errors', []))} errors",
            {"errors": lint.get("errors", [])},
        )

    dedupe = await _call(
        deps,
        run,
        5,
        "Checking corpus for duplicates",
        "sigma.dedupe_against_corpus",
        {
            "yaml_text": rule_yaml,
            "corpus_path": deps.dedupe_corpus_path,
            "threshold": deps.dedupe_threshold,
        },
        "dedupe.failed",
    )
    if dedupe.get("is_duplicate", False):
        raise GateFailedError(
            "dedupe.near_duplicate",
            f"rule resembles existing rule (max_score={dedupe['max_score']})",
            {"matches": dedupe.get("matches", [])},
        )

    # ---- Step 6: convert to target SIEM ------------------------------------
    convert = await _call(
        deps,
        run,
        6,
        "Converting to SPL",
        "sigma.convert_sigma",
        {"yaml_text": rule_yaml, "target": target_siem},
        "convert.failed",
    )
    queries = convert.get("queries", [])
    if not queries:
        raise GateFailedError("convert.empty", "convert_sigma returned no queries")
    spl = queries[0]

    # ---- Step 7: FP estimate -----------------------------------------------
    fp = await _call(
        deps,
        run,
        7,
        "Estimating false-positive rate",
        f"{target_siem}.estimate_fp_rate",
        _siem_query_params(target_siem, spl, lookback_days=7),
        "fp.failed",
    )
    p95 = fp.get("p95_hits_per_day", 0)
    if p95 >= deps.fp_threshold_per_day:
        raise GateFailedError(
            "fp.too_high",
            f"p95={p95}/day exceeds threshold {deps.fp_threshold_per_day}",
            {"report": fp},
        )

    # ---- Step 8: dry-run deploy --------------------------------------------
    rule_name = f"catchattack_{technique.lower()}_{capture_id_1[:8]}"
    _deploy = await _call(
        deps,
        run,
        8,
        "Dry-run deploying",
        f"{target_siem}.deploy_rule",
        {
            "name": rule_name,
            "spl": spl,
            "schedule": "*/15 * * * *",
            "index_target": index_target,
            "dry_run": True,
        },
        "deploy.failed",
    )

    # ---- Step 9: second emulation ------------------------------------------
    receipt_2 = await _call(
        deps,
        run,
        9,
        "Running atomic test (validation)",
        "agents.run_atomic",
        {
            "agent_id": agent_id,
            "technique": technique,
            "test_number": test_number,
            "dry_run": False,
        },
        "validation.run_failed",
    )
    capture_id_2 = receipt_2["capture_id"]
    now = datetime.now(tz=UTC)
    second_started = now - _VALIDATION_WINDOW
    second_ended = now + _VALIDATION_WINDOW
    _marker(
        deps,
        run,
        kind=_MARKER_ATOMIC_START,
        label=f"{technique} re-emulation (validation)",
        color=_COLOR_ATTACKER,
        filled=True,
    )

    # ---- Step 10: validate the rule fires ----------------------------------
    search = await _call(
        deps,
        run,
        10,
        "Validating rule fires on second capture",
        f"{target_siem}.search",
        _siem_query_params(
            target_siem,
            spl,
            earliest=second_started.isoformat(),
            latest=second_ended.isoformat(),
            max_results=10,
        ),
        "validation.search_failed",
    )
    # Splunk's search returns `count`; Wazuh's returns `total_hits`. Use the
    # key that is present so a legitimate zero is not mistaken for "absent".
    hits = search["count"] if "count" in search else search.get("total_hits", 0)
    if hits < 1:
        raise GateFailedError(
            "validation.no_hits",
            "rule did not fire on the re-emulation capture",
            {"capture_id": capture_id_2, "spl": spl},
        )
    _marker(
        deps,
        run,
        kind=_MARKER_DETECTION_HIT,
        label=f"rule fired ({hits} hit(s)) on validation capture",
        color=_COLOR_DEFENDER,
        filled=True,
    )

    # ---- Step 11: open PR --------------------------------------------------
    fp_md = _fp_report_md(fp)
    reasoning = (
        f"Evidence summary noted {notable} notable markers across capture "
        f"{capture_id_1}. Drafted rule passes lint + dedupe (score "
        f"{dedupe.get('max_score', 0):.2f} < {deps.dedupe_threshold:.2f}); "
        f"p95 FP {p95}/day < {deps.fp_threshold_per_day}; re-emulation in "
        f"capture {capture_id_2} fired the rule {hits} time(s)."
    )
    rule_path = _rule_path_for(rule_yaml, technique)
    body = _pr_body(
        title=rule_name,
        rule_path=rule_path,
        rule_yaml=rule_yaml,
        capture_id_1=capture_id_1,
        capture_id_2=capture_id_2,
        spl=spl,
        fp_md=fp_md,
        hits=hits,
        reasoning=reasoning,
    )
    artifacts = PRArtifacts(
        rule_path=rule_path,
        rule_yaml=rule_yaml,
        capture_id=capture_id_1,
        second_capture_id=capture_id_2,
        spl=spl,
        fp_report_md=fp_md,
        validation_hit_count=int(hits),
        reasoning_trace=reasoning,
        title=f"[detection] {rule_name}",
        body=body,
        labels=("conductor", "needs-review", f"technique:{technique}"),
    )
    _emit(run, 11, "Opening PR", tool="pr.open", params={"rule_path": rule_path})
    pr = await deps.pr.open(artifacts)
    _emit(run, 11, "ok", summary=f"PR via {pr.backend}: {pr.branch}")

    return {
        "rule_path": rule_path,
        "capture_id_1": capture_id_1,
        "capture_id_2": capture_id_2,
        "fp_p95_per_day": p95,
        "validation_hits": int(hits),
        "pr_backend": pr.backend,
        "pr_url": pr.pr_url,
        "branch": pr.branch,
    }


def _rule_path_for(rule_yaml: str, technique: str) -> str:
    """Derive a sensible path under detections/enterprise/."""
    # Parse minimally — pull the title for the filename slug.
    title = ""
    for line in rule_yaml.splitlines():
        if line.lower().startswith("title:"):
            title = line.split(":", 1)[1].strip().strip("'\"")
            break
    slug = "".join(c.lower() if c.isalnum() else "_" for c in title).strip("_") or technique.lower()
    return f"detections/enterprise/windows/execution/{slug}.yml"


def _fp_report_md(fp: dict[str, Any]) -> str:
    bands = fp.get("hits_per_day") or []
    rows = "\n".join(f"| {b.get('date')} | {b.get('hits')} |" for b in bands)
    return (
        f"### FP estimate\n\n"
        f"- verdict: **{fp.get('verdict', 'unknown')}**\n"
        f"- p95 hits/day: **{fp.get('p95_hits_per_day', 0)}**\n"
        f"- total hits: {fp.get('total_hits', 0)}\n"
        f"- unique hosts/agents: {fp.get('unique_hosts') or fp.get('unique_agents') or 0}\n\n"
        f"| Date | Hits |\n|---|---|\n{rows}\n"
    )


def _pr_body(
    *,
    title: str,
    rule_path: str,
    rule_yaml: str,
    capture_id_1: str,
    capture_id_2: str,
    spl: str,
    fp_md: str,
    hits: int,
    reasoning: str,
) -> str:
    return (
        f"## {title}\n\n"
        f"Auto-drafted by the CatchAttack Conductor.\n\n"
        f"### Rule\n\n"
        f"`{rule_path}`\n\n"
        f"```yaml\n{rule_yaml}\n```\n\n"
        f"### Captures\n\n"
        f"- First (training): `evidence://{capture_id_1}/manifest`\n"
        f"- Second (validation): `evidence://{capture_id_2}/manifest`\n\n"
        f"### Converted query (Splunk SPL)\n\n"
        f"```\n{spl}\n```\n\n"
        f"{fp_md}\n\n"
        f"### Validation\n\n"
        f"Re-running the test fired the rule **{hits} time(s)** in the new capture window.\n\n"
        f"### Conductor reasoning\n\n"
        f"{reasoning}\n\n"
        f"---\n"
        f"_The Conductor cannot self-approve. A human reviewer must merge._\n"
    )
