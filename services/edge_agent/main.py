"""FastAPI edge agent service."""

from __future__ import annotations

import asyncio
from .discovery import collect_asset_event
import json
import os
from io import BytesIO
from typing import Any

from aiokafka import AIOKafkaProducer
from fastapi import FastAPI, HTTPException
from fastavro import schemaless_writer

from .models import AssetEvent


app = FastAPI(title="CatchAttack Edge Agent")

producer: AIOKafkaProducer | None = None
_schema: dict[str, Any] | None = None


def _load_avro_schema() -> dict[str, Any]:
    global _schema
    if _schema is None:
        with open("contracts/asset_event.avsc", "rb") as f:
            _schema = json.load(f)
    return _schema


@app.on_event("startup")
async def startup() -> None:
    bootstrap = os.getenv("KAFKA_BOOTSTRAP")
    if not bootstrap:
        raise RuntimeError("KAFKA_BOOTSTRAP is not set")
    global producer
    producer = AIOKafkaProducer(bootstrap_servers=bootstrap)
    await producer.start()
    _load_avro_schema()
    tenant_id = os.getenv("EDGE_TENANT_ID", "default")
    enable_discovery = os.getenv("EDGE_SELF_DISCOVERY", "true").lower() not in (
        "false",
        "0",
    )
    interval = int(os.getenv("DISCOVERY_INTERVAL_SECONDS", "3600"))

    if enable_discovery:
        async def periodic_discovery():
            global producer
            while True:
                try:
                    event = collect_asset_event(tenant_id)
                    schema = _load_avro_schema()
                    buffer = BytesIO()
                    schemaless_writer(buffer, schema, event.dict())
                    await producer.send_and_wait("asset.events", buffer.getvalue())
                except Exception as exc:
                    import logging
                    logging.exception("Failed to collect or send asset event: %s", exc)
                await asyncio.sleep(interval)

        asyncio.create_task(periodic_discovery())


@app.on_event("shutdown")
async def shutdown() -> None:
    if producer:
        await producer.stop()


@app.post("/ingest")
async def ingest(event: AssetEvent) -> dict[str, str]:
    if _schema is None:
        raise HTTPException(status_code=500, detail="Schema not loaded")
    buf = BytesIO()
    schemaless_writer(buf, _schema, event.dict())
    await producer.send_and_wait("asset.events", buf.getvalue())
    return {"status": "queued"}


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}

