from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from .models import RuleStatus

class RuleCreate(BaseModel):
    name: str = Field(..., examples=["Suspicious LSASS Access"])
    description: Optional[str] = Field(
        None, examples=["Detects abnormal access to LSASS process"]
    )
    attack_techniques: List[str] = Field(default_factory=list, examples=[["T1003"]])
    sigma_yaml: str = Field(
        ..., examples=["title: Test\nlogsource:\n  category: process_creation\n..."]
    )
    status: RuleStatus = Field(default=RuleStatus.draft, examples=["draft"])


class RuleUpdate(BaseModel):
    name: Optional[str] = Field(None, examples=["Updated name"])
    description: Optional[str] = Field(None, examples=["Updated description"])
    attack_techniques: Optional[List[str]] = Field(None, examples=[["T1003"]])
    sigma_yaml: Optional[str] = Field(None, examples=["title: Updated\n..."])
    status: Optional[RuleStatus] = Field(None, examples=["active"])

class RuleOut(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    attack_techniques: List[str]
    status: RuleStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ThreatProfilePayload(BaseModel):
    organization: str = Field(..., examples=["ACME Corp"])
    industry: Optional[str] = Field(None, examples=["finance"])
    tech_stack: List[str] = Field(default_factory=list, examples=[["windows", "linux"]])
    intel_tags: List[str] = Field(default_factory=list, examples=[["ransomware"]])
    weights: Optional[dict] = Field(None, examples=[{"T1059": 1.5}])


class ThreatProfileOut(ThreatProfilePayload):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CoverageItem(BaseModel):
    technique_id: str
    rules_count: int
    validated_count: int
    rule_ids: List[str]


class PriorityItem(BaseModel):
    technique_id: str
    rules_count: int
    validated_count: int
    validated_ratio: float
    priority_score: float
