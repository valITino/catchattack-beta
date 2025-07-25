from pydantic import BaseModel, constr
from typing import List, Optional, Dict, Any


class EmulationCreate(BaseModel):
    technique_id: constr(min_length=1)


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


class VMConfig(BaseModel):
    image: str
    version: str
    cpu: int
    ram: int
    network: Optional[Dict[str, Any]] = None
