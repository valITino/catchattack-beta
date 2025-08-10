from __future__ import annotations
from pydantic import BaseModel, Field
from typing import List, Literal, Optional, Any, Dict

# Supported operators (MVP)
Operator = Literal[
    "equals", "contains", "startswith", "endswith", "in", "regex", "gt", "gte", "lt", "lte"
]


class Predicate(BaseModel):
    field: str
    op: Operator
    value: Any  # string | number | list


class LogSource(BaseModel):
    product: Optional[str] = None
    service: Optional[str] = None
    category: Optional[str] = None


class RuleDraft(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = None
    logsource: LogSource
    technique_ids: List[str] = Field(default_factory=list)  # e.g., ["T1059.001"]
    predicates: List[Predicate] = Field(default_factory=list)
    # combine predicates with 'any' (OR) or 'all' (AND)
    combine: Literal["any", "all"] = "any"
    level: Literal["low", "medium", "high", "critical"] = "medium"
    falsepositives: List[str] = Field(default_factory=list)
    fields: List[str] = Field(default_factory=lambda: ["host.name", "process.command_line"])


class PreviewPayload(BaseModel):
    rule: RuleDraft
    dataset_uri: Optional[str] = None
    inline_events: Optional[List[Dict[str, Any]]] = None
    sample_limit: int = 10
