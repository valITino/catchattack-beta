from fastapi import FastAPI, Depends, HTTPException, Path
from sqlalchemy.orm import Session

from .database import SessionLocal, init_db, Emulation
from . import schemas
from pathlib import Path as FilePath
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
    try:
        result = emulator.run_emulation(payload.technique_id)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

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
def create_sigma(technique_id: str = Path(..., min_length=1)):
    try:
        return sigma.generate_sigma_rule(technique_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/yaml/{technique_id}")
def generate_yaml(
    config: schemas.VMConfig,
    technique_id: str = Path(..., min_length=1),
):
    try:
        data = mitre.fetch_techniques()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"MITRE fetch failed: {e}")

    technique = next((t for t in data if t.get("id") == technique_id), None)
    if not technique:
        raise HTTPException(status_code=404, detail="Technique not found")

    merged = {
        "technique": {"id": technique_id, "name": technique.get("name")},
        "vm": {
            "image": config.image,
            "version": config.version,
            "cpu": config.cpu,
            "ram": config.ram,
            "network": config.network or {},
        },
    }

    yaml_path = FilePath("generated") / f"{technique_id}.yaml"
    try:
        yaml_generator.generate_vm_yaml(merged, yaml_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {"path": str(yaml_path)}
