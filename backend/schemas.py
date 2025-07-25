from pydantic import BaseModel
from typing import List, Optional


class EmulationCreate(BaseModel):
    technique_id: str


class Emulation(BaseModel):
    id: int
    technique_id: str
    status: str

    class Config:
        orm_mode = True


class Technique(BaseModel):
    id: str
    name: str
    description: Optional[str]


class TechniqueList(BaseModel):
    techniques: List[Technique]
