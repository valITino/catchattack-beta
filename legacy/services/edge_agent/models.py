from pydantic import BaseModel

class Vuln(BaseModel):
    id: str
    cvss: float

class Asset(BaseModel):
    hostname: str
    ip: str
    os: str

class Health(BaseModel):
    cpu: float
    mem: float
    disk: float

class AssetEvent(BaseModel):
    tenant_id: str
    timestamp: int
    asset: Asset
    vulnerabilities: list[Vuln]
    health: Health
