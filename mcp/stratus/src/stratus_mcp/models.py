"""Pydantic models for the Stratus Red Team MCP."""

from __future__ import annotations

from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field


class Platform(StrEnum):
    AWS = "aws"
    AZURE = "azure"
    GCP = "gcp"
    KUBERNETES = "kubernetes"
    ENTRA_ID = "entra-id"
    EKS = "eks"


class TechniqueState(StrEnum):
    """Stratus' per-technique lifecycle state."""

    COLD = "COLD"  # no infrastructure provisioned
    WARM = "WARM"  # infrastructure provisioned, not detonated
    DETONATED = "DETONATED"  # attack executed


class StratusTechnique(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(description="Stratus technique id, e.g. 'aws.execution.ec2-user-data'.")
    platform: Platform
    name: str
    mitre_attack: list[str] = Field(
        default_factory=list,
        description="ATT&CK technique IDs the Stratus technique maps to.",
    )
    description: str = ""
    state: TechniqueState = TechniqueState.COLD


class TechniqueList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[StratusTechnique]
    total: int


class DetonateResult(BaseModel):
    """Outcome of a `detonate` call.

    dry_run=true returns the plan (technique + provisioned resources it
    *would* touch) without warming or detonating. A real detonation
    requires dry_run=false AND the proxy's approval token.
    """

    model_config = ConfigDict(extra="forbid")

    technique_id: str
    dry_run: bool
    detonated: bool
    state: TechniqueState
    output: str = ""
    attack_technique: list[str] = Field(default_factory=list)


class RevertResult(BaseModel):
    model_config = ConfigDict(extra="forbid")

    technique_id: str
    reverted: bool
    state: TechniqueState
    output: str = ""


class StatusReport(BaseModel):
    model_config = ConfigDict(extra="forbid")

    technique_id: str
    state: TechniqueState


class ServerError(BaseModel):
    model_config = ConfigDict(extra="forbid")

    error: str
    detail: str | None = None
