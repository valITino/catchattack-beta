from pydantic import BaseModel, Field, field_validator
from typing import List, Dict


class RuleGenRequest(BaseModel):
    signals: Dict
    constraints: Dict = Field(default_factory=dict)


class RuleGenResponse(BaseModel):
    sigma_yaml: str
    rationale: str
    test_events: List[Dict]


class AttackGenRequest(BaseModel):
    goals: List[str]
    techniques: List[str] = Field(default_factory=list)
    environment: Dict = Field(default_factory=dict)
    style: str = "bash"  # bash|powershell|python
    safety: Dict = Field(default_factory=dict)


class AttackGenResponse(BaseModel):
    script: str
    steps: List[str]
    opsec_notes: List[str]


class InfraGenRequest(BaseModel):
    topology: Dict
    constraints: Dict = Field(default_factory=dict)
    telemetry: Dict = Field(default_factory=dict)


class InfraGenResponse(BaseModel):
    blueprint: Dict  # {compose_yaml, provisioning_steps[], seeds[]}
    assumptions: List[str]

    @field_validator("blueprint")
    def has_compose(cls, v):
        if "compose_yaml" not in v:
            raise ValueError("compose_yaml required")
        return v
