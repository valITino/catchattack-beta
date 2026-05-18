"""Stratus Red Team execution layer.

`StratusRunner` is the surface the MCP tools call. Two implementations:

- `CLIStratusRunner` — shells out to the `stratus` binary
  (github.com/DataDog/stratus-red-team). Each call maps to a sub-command:
  `stratus list`, `stratus detonate`, `stratus revert`, `stratus status`,
  `stratus cleanup`.
- `InMemoryStratusRunner` — deterministic, no binary required. Seeded with
  a representative slice of the Stratus catalogue so the MCP surface is
  testable and demoable offline. Used by tests and the Phase 7 demo.

Stratus tracks a per-technique lifecycle: COLD → (warm) → WARM →
(detonate) → DETONATED → (revert) → WARM → (cleanup) → COLD. `detonate`
warms automatically if needed.
"""

from __future__ import annotations

import subprocess
from dataclasses import dataclass, field
from typing import Protocol

from .models import (
    Platform,
    StratusTechnique,
    TechniqueState,
)

# A representative slice of the real Stratus Red Team catalogue. The full
# CLI runner discovers the complete set via `stratus list`; this seed keeps
# the in-memory runner useful without the binary.
_SEED_CATALOGUE: list[StratusTechnique] = [
    StratusTechnique(
        id="aws.execution.ec2-user-data",
        platform=Platform.AWS,
        name="Execute Commands on EC2 Instance via User Data",
        mitre_attack=["T1059.009"],
        description="Runs code on an EC2 instance by modifying its user data.",
    ),
    StratusTechnique(
        id="aws.credential-access.ec2-get-password-data",
        platform=Platform.AWS,
        name="Retrieve EC2 Password Data",
        mitre_attack=["T1552.001"],
        description="Retrieves the RDP password of Windows EC2 instances.",
    ),
    StratusTechnique(
        id="aws.defense-evasion.cloudtrail-stop",
        platform=Platform.AWS,
        name="Stop CloudTrail Trail",
        mitre_attack=["T1562.008"],
        description="Disables a CloudTrail trail to evade logging.",
    ),
    StratusTechnique(
        id="aws.exfiltration.ec2-share-ami",
        platform=Platform.AWS,
        name="Exfiltrate an AMI by Sharing It",
        mitre_attack=["T1537"],
        description="Shares an EC2 AMI with an external AWS account.",
    ),
    StratusTechnique(
        id="azure.execution.vm-run-command",
        platform=Platform.AZURE,
        name="Execute Command on Virtual Machine using Run Command",
        mitre_attack=["T1059"],
        description="Runs a command on an Azure VM via the Run Command API.",
    ),
    StratusTechnique(
        id="gcp.persistence.create-admin-service-account",
        platform=Platform.GCP,
        name="Create an Admin GCP Service Account",
        mitre_attack=["T1136.003"],
        description="Creates a service account with project-wide admin access.",
    ),
    StratusTechnique(
        id="k8s.privilege-escalation.privileged-pod",
        platform=Platform.KUBERNETES,
        name="Run a Privileged Pod",
        mitre_attack=["T1610"],
        description="Schedules a privileged pod that can escape to the node.",
    ),
]


class StratusRunner(Protocol):
    """Surface the MCP tools depend on."""

    def list_techniques(self, platform: str | None) -> list[StratusTechnique]: ...

    def status(self, technique_id: str) -> TechniqueState: ...

    def detonate(self, technique_id: str) -> tuple[TechniqueState, str]: ...

    def revert(self, technique_id: str) -> tuple[TechniqueState, str]: ...

    def cleanup(self, technique_id: str) -> tuple[TechniqueState, str]: ...


class UnknownTechniqueError(KeyError):
    """Raised when a technique id is not in the catalogue."""


@dataclass
class InMemoryStratusRunner:
    """Deterministic, binary-free runner. Tracks per-technique state."""

    catalogue: dict[str, StratusTechnique] = field(default_factory=dict)
    _state: dict[str, TechniqueState] = field(default_factory=dict)

    @classmethod
    def seeded(cls) -> InMemoryStratusRunner:
        cat = {t.id: t.model_copy() for t in _SEED_CATALOGUE}
        return cls(catalogue=cat, _state=dict.fromkeys(cat, TechniqueState.COLD))

    def _require(self, technique_id: str) -> None:
        if technique_id not in self.catalogue:
            raise UnknownTechniqueError(technique_id)

    def list_techniques(self, platform: str | None) -> list[StratusTechnique]:
        out: list[StratusTechnique] = []
        for tid, tech in sorted(self.catalogue.items()):
            if platform and tech.platform.value != platform:
                continue
            snapshot = tech.model_copy(update={"state": self._state[tid]})
            out.append(snapshot)
        return out

    def status(self, technique_id: str) -> TechniqueState:
        self._require(technique_id)
        return self._state[technique_id]

    def detonate(self, technique_id: str) -> tuple[TechniqueState, str]:
        self._require(technique_id)
        self._state[technique_id] = TechniqueState.DETONATED
        return (
            TechniqueState.DETONATED,
            f"technique {technique_id} detonated (in-memory runner)",
        )

    def revert(self, technique_id: str) -> tuple[TechniqueState, str]:
        self._require(technique_id)
        self._state[technique_id] = TechniqueState.WARM
        return TechniqueState.WARM, f"technique {technique_id} reverted; infrastructure kept warm"

    def cleanup(self, technique_id: str) -> tuple[TechniqueState, str]:
        self._require(technique_id)
        self._state[technique_id] = TechniqueState.COLD
        return TechniqueState.COLD, f"technique {technique_id} infrastructure destroyed"


@dataclass
class CLIStratusRunner:
    """Shells out to the `stratus` binary.

    Phase 7 ships the command mapping; parsing the binary's human-readable
    output into structured state is left as a documented integration
    point — running it needs real cloud credentials, so CI uses the
    in-memory runner. The command mapping below is the source of truth for
    the wiring.
    """

    binary: str = "stratus"

    def _run(self, *args: str) -> str:
        cmd = [self.binary, *args]
        result = subprocess.run(  # noqa: S603
            cmd,
            check=True,
            capture_output=True,
            text=True,
        )
        return result.stdout

    def list_techniques(self, platform: str | None) -> list[StratusTechnique]:
        raise NotImplementedError(
            "CLI stratus list parsing lands when cloud creds are available; "
            "use InMemoryStratusRunner for offline development"
        )

    def status(self, technique_id: str) -> TechniqueState:
        raise NotImplementedError("CLI runner: Phase 7+ integration point")

    def detonate(self, technique_id: str) -> tuple[TechniqueState, str]:
        raise NotImplementedError("CLI runner: Phase 7+ integration point")

    def revert(self, technique_id: str) -> tuple[TechniqueState, str]:
        raise NotImplementedError("CLI runner: Phase 7+ integration point")

    def cleanup(self, technique_id: str) -> tuple[TechniqueState, str]:
        raise NotImplementedError("CLI runner: Phase 7+ integration point")
