import asyncio
import json
import logging
import os
import uuid
import contextlib
from datetime import datetime
from pathlib import Path as FilePath

from fastapi import Depends, FastAPI, HTTPException, Path, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from . import schemas
from .database import (
    AuditEvent,
    Emulation,
    SessionLocal,
    add_audit_event,
    init_db,
)
from .services import emulator, mitre, sigma, yaml_generator, vm_manager

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
    bootstrap = os.getenv("KAFKA_BOOTSTRAP")
    if not bootstrap:
        return
    try:
        from aiokafka import AIOKafkaConsumer
    except Exception as e:  # pragma: no cover - import error
        logging.warning("aiokafka unavailable: %s", e)
        return
    loop = asyncio.get_event_loop()
    consumer = AIOKafkaConsumer(
        "audit.events",
        bootstrap_servers=bootstrap,
        value_deserializer=lambda m: m.decode("utf-8"),
    )

    async def consume() -> None:
        await consumer.start()
        try:
            while True:
                msg = await consumer.getone()
                try:
                    payload = json.loads(msg.value)
                except json.JSONDecodeError:
                    continue
                db = SessionLocal()
                try:
                    add_audit_event(
                        db_session=db,
                        tenant_id=payload.get("tenant_id"),
                        type=payload.get("type", ""),
                        title=payload.get("title", ""),
                        description=payload.get("description", ""),
                    )
                finally:
                    db.close()
        except asyncio.CancelledError:
            pass
        finally:
            await consumer.stop()

    app.state.audit_task = loop.create_task(consume())


@app.on_event("shutdown")
async def shutdown_event() -> None:
    task = getattr(app.state, "audit_task", None)
    if task:
        task.cancel()
        with contextlib.suppress(Exception):
            await task


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


@app.get("/status")
def status_summary(db: Session = Depends(get_db)):
    emulations = db.query(Emulation).count()
    rules_generated = db.query(AuditEvent).filter(AuditEvent.type == "rule-generated").count()
    rules_deployed = db.query(AuditEvent).filter(AuditEvent.type == "rule-deployed").count()
    anomalies_detected = db.query(AuditEvent).filter(AuditEvent.type == "anomaly-detected").count()
    recent = (
        db.query(AuditEvent)
        .order_by(AuditEvent.timestamp.desc())
        .limit(5)
        .all()
    )
    last_5 = [
        {
            "id": e.id,
            "type": e.type,
            "title": e.title,
            "description": e.description,
            "timestamp": e.timestamp.isoformat(),
        }
        for e in recent
    ]
    return {
        "emulations": emulations,
        "rules_generated": rules_generated,
        "rules_deployed": rules_deployed,
        "anomalies_detected": anomalies_detected,
        "last_5_events": last_5,
    }
