"""FastAPI edge agent service.

This service publishes AssetEvent messages to Kafka either from externally
provided EDR/XDR and vulnerability scanner APIs or via self-managed discovery
on the host."""

from __future__ import annotations

import asyncio
import json
import logging
import os
import time
from io import BytesIO
from typing import Any

from aiokafka import AIOKafkaProducer
from fastapi import FastAPI, HTTPException
from fastavro import schemaless_writer

from .discovery import collect_asset_event
from .models import AssetEvent

app = FastAPI(title="CatchAttack Edge Agent")

_schema: dict[str, Any] | None = None

TENANT_ID = os.getenv("EDGE_TENANT_ID", "default")
ENABLE_SELF_DISCOVERY = os.getenv("EDGE_SELF_DISCOVERY", "true").lower() not in (
    "false",
    "0",
)
DISCOVERY_INTERVAL_SECONDS = int(os.getenv("DISCOVERY_INTERVAL_SECONDS", "3600"))


def _load_avro_schema() -> dict[str, Any]:
    global _schema
    if _schema is None:
        with open("contracts/asset_event.avsc", "rb") as f:
            _schema = json.load(f)
    return _schema


async def periodic_discovery() -> None:
    producer: AIOKafkaProducer = app.state.producer
    while True:
        try:
            event = collect_asset_event(TENANT_ID)
            buffer = BytesIO()
            schemaless_writer(buffer, _load_avro_schema(), event.dict())
            await producer.send_and_wait("asset.events", buffer.getvalue())
        except Exception as exc:
            logging.exception("Periodic discovery failed: %s", exc)
        await asyncio.sleep(DISCOVERY_INTERVAL_SECONDS)


@app.on_event("startup")
async def startup() -> None:
    bootstrap = os.getenv("KAFKA_BOOTSTRAP")
    if not bootstrap:
        raise RuntimeError("KAFKA_BOOTSTRAP is not set")
    producer = AIOKafkaProducer(bootstrap_servers=bootstrap)
    await producer.start()
    app.state.producer = producer
    _load_avro_schema()
    if ENABLE_SELF_DISCOVERY or os.getenv("EDR_API_URL") or os.getenv("NESSUS_API_URL"):
        asyncio.create_task(periodic_discovery())


@app.on_event("shutdown")
async def shutdown() -> None:
    producer: AIOKafkaProducer | None = getattr(app.state, "producer", None)
    if producer:
        await producer.stop()


@app.post("/ingest")
async def ingest(event: AssetEvent) -> dict[str, str]:
    if _schema is None:
        raise HTTPException(status_code=500, detail="Schema not loaded")
    buf = BytesIO()
    schemaless_writer(buf, _schema, event.dict())
    data = buf.getvalue()
    producer: AIOKafkaProducer = app.state.producer
    await producer.send_and_wait("asset.events", data)
    return {"status": "queued"}


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
