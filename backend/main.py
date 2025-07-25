from fastapi import FastAPI, Depends, HTTPException, Path, Request
from fastapi.responses import JSONResponse
import uuid
import logging
from sqlalchemy.orm import Session

from .database import SessionLocal, init_db, Emulation
from . import schemas
from pathlib import Path as FilePath
from .services import emulator, mitre, sigma, yaml_generator, vm_manager
from datetime import datetime

app = FastAPI(title="CatchAttack Backend")


@app.exception_handler(Exception)
async def _oops(request: Request, exc: Exception):
    error_id = uuid.uuid4()
    logging.exception("Unhandled error %s @ %s", error_id, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"error": "internal_server_error", "id": str(error_id)},
    )


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
        "technique": {
            "id": technique_id,
            "name": technique.get("name"),
            "description": technique.get("description"),
            "platforms": technique.get("x_mitre_platforms", []),
            "data_sources": technique.get("x_mitre_data_sources", []),
        },
        "vm": {
            "image": config.image,
            "version": config.version,
            "cpu": config.cpu,
            "ram": config.ram,
            "network": config.network or {},
        },
        "generated_at": datetime.utcnow().isoformat(),
    }

    yaml_path = FilePath("generated") / f"{technique_id}.yaml"
    try:
        yaml_generator.generate_vm_yaml(merged, yaml_path)
        yaml_text = yaml_path.read_text()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {"path": str(yaml_path), "yaml": yaml_text}


@app.post("/vm/start")
def start_vm_endpoint(config: schemas.VMConfig):
    return vm_manager.start_vm(config.dict())


@app.get("/emulations", response_model=list[schemas.Emulation])
def list_emulations(db: Session = Depends(get_db)):
    return db.query(Emulation).order_by(Emulation.id.desc()).all()
