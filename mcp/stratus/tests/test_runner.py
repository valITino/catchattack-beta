from __future__ import annotations

import pytest
from stratus_mcp.models import TechniqueState
from stratus_mcp.runner import (
    CLIStratusRunner,
    InMemoryStratusRunner,
    UnknownTechniqueError,
)


def test_seeded_runner_lists_techniques(runner: InMemoryStratusRunner) -> None:
    techs = runner.list_techniques(None)
    assert len(techs) >= 5
    assert all(t.state == TechniqueState.COLD for t in techs)


def test_list_filters_by_platform(runner: InMemoryStratusRunner) -> None:
    aws = runner.list_techniques("aws")
    assert aws
    assert all(t.platform.value == "aws" for t in aws)
    k8s = runner.list_techniques("kubernetes")
    assert all(t.platform.value == "kubernetes" for t in k8s)


def test_detonate_revert_cleanup_lifecycle(runner: InMemoryStratusRunner) -> None:
    tid = "aws.execution.ec2-user-data"
    assert runner.status(tid) == TechniqueState.COLD

    state, _ = runner.detonate(tid)
    assert state == TechniqueState.DETONATED
    assert runner.status(tid) == TechniqueState.DETONATED

    state, _ = runner.revert(tid)
    assert state == TechniqueState.WARM

    state, _ = runner.cleanup(tid)
    assert state == TechniqueState.COLD


def test_unknown_technique_raises(runner: InMemoryStratusRunner) -> None:
    with pytest.raises(UnknownTechniqueError):
        runner.status("aws.not.a.real.technique")


def test_techniques_carry_attack_mapping(runner: InMemoryStratusRunner) -> None:
    techs = {t.id: t for t in runner.list_techniques(None)}
    assert techs["aws.defense-evasion.cloudtrail-stop"].mitre_attack == ["T1562.008"]


def test_cli_runner_is_integration_point() -> None:
    cli = CLIStratusRunner()
    with pytest.raises(NotImplementedError):
        cli.list_techniques(None)
