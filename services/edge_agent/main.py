"""FastAPI edge agent service.

This on-device agent should integrate with existing EDR/XDR or vulnerability
scanner APIs when available. In environments without such tooling the agent must
self-discover system information using utilities like ``osquery``, PowerShell,
or ``/proc`` introspection to gather OS details, installed software, open ports
and CVE scans. These findings should be sent to the management plane via the
``/ingest`` endpoint.
"""

from __future__ import annotations

import asyncio
import io
import json
import os
from typing import Any

from aiokafka import AIOKafkaProducer
from fastapi import FastAPI, HTTPException
from fastavro import schemaless_writer

from .models import AssetEvent

app = FastAPI(title="CatchAttack Edge Agent")

_schema: dict[str, Any] | None = None


@app.on_event("startup")
async def _startup() -> None:
    bootstrap = os.getenv("KAFKA_BOOTSTRAP")
    if not bootstrap:
        raise RuntimeError("KAFKA_BOOTSTRAP is not set")
    producer = AIOKafkaProducer(bootstrap_servers=bootstrap)
    await producer.start()
    app.state.producer = producer
    global _schema
    with open("contracts/asset_event.avsc", "rb") as f:
        _schema = json.load(f)


@app.on_event("shutdown")
async def _shutdown() -> None:
    producer: AIOKafkaProducer | None = getattr(app.state, "producer", None)
    if producer:
        await producer.stop()


@app.post("/ingest")
async def ingest(event: AssetEvent) -> dict[str, str]:
    if _schema is None:
        raise HTTPException(status_code=500, detail="Schema not loaded")
    buf = io.BytesIO()
    schemaless_writer(buf, _schema, event.dict())
    data = buf.getvalue()
    producer: AIOKafkaProducer = app.state.producer
    await producer.send_and_wait("asset.events", data)
    return {"status": "queued"}


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
