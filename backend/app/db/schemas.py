from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from .models import RuleStatus, RunSource, RunStatus, DeployTarget, JobStatus, DeployVersionStatus

class RuleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    attack_techniques: List[str] = []
    sigma_yaml: str
    status: RuleStatus = RuleStatus.draft

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
