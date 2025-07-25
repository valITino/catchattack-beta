from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session

from .database import SessionLocal, init_db, Emulation
from . import schemas
from pathlib import Path
from .services import emulator, mitre, sigma, yaml_generator

app = FastAPI(title="CatchAttack Backend")


@app.on_event("startup")
def startup_event() -> None:
    init_db()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.post("/emulate", response_model=schemas.Emulation)
def start_emulation(payload: schemas.EmulationCreate, db: Session = Depends(get_db)):
    result = emulator.run_emulation(payload.technique_id)
    emu = Emulation(technique_id=result["technique"], status=result["status"])
    db.add(emu)
    db.commit()
    db.refresh(emu)
    return emu


@app.get("/techniques", response_model=schemas.TechniqueList)
def list_techniques():
    try:
        data = mitre.fetch_techniques()
    except Exception as e:  # network or parsing errors
        raise HTTPException(status_code=502, detail=str(e))
    techniques = [
        schemas.Technique(id=obj.get("id"), name=obj.get("name", ""), description=obj.get("description"))
        for obj in data
    ]
    return {"techniques": techniques}


@app.post("/sigma/{technique_id}")
def create_sigma(technique_id: str):
    return sigma.generate_sigma_rule(technique_id)


@app.post("/yaml/{technique_id}")
def generate_yaml(technique_id: str):
    config = {"technique": technique_id, "vm": {"image": "ubuntu", "version": "22.04"}}
    yaml_path = Path("generated") / f"{technique_id}.yaml"
    yaml_generator.generate_vm_yaml(config, yaml_path)
    return {"path": str(yaml_path)}
