from __future__ import annotations

import json
import os
from typing import Any

# ``aiokafka`` is optional; delay import until startup to avoid module import
# failures on systems where the dependency is missing.
try:
    from aiokafka import AIOKafkaProducer  # type: ignore[import]
except Exception:
    AIOKafkaProducer = None  # type: ignore[assignment]
from fastapi import FastAPI
from jinja2 import Template

from services.edge_agent.models import AssetEvent
from .prompt_templates import DEFAULT_PROMPT

app = FastAPI(title="RT Script Generator")

producer: AIOKafkaProducer | None = None
# Precompile prompt template once at import time
PROMPT_TEMPLATE = Template(DEFAULT_PROMPT)


@app.on_event("startup")
async def _startup() -> None:
    global producer
    if AIOKafkaProducer is None:
        raise RuntimeError(
            "aiokafka library is not available; install 'aiokafka' to enable real-time script generation notifications."
        )
    bootstrap = os.getenv("KAFKA_BOOTSTRAP")
    if not bootstrap:
        raise RuntimeError("KAFKA_BOOTSTRAP is not set")
    producer = AIOKafkaProducer(
        bootstrap_servers=bootstrap,
        value_serializer=lambda v: json.dumps(v).encode("utf-8"),
    )
    await producer.start()


@app.on_event("shutdown")
async def _shutdown() -> None:
    if producer:
        await producer.stop()


def _render_prompt(event: AssetEvent) -> str:
    """Render LLM prompt using top CVEs sorted by CVSS score."""
    cves = sorted(event.vulnerabilities, key=lambda v: v.cvss, reverse=True)[:5]
    return PROMPT_TEMPLATE.render(os=event.asset.os, cves=[v.id for v in cves])


@app.post("/generate")
async def generate(event: AssetEvent) -> dict[str, Any]:
    prompt = _render_prompt(event)
    script = "# TODO: generate script"
    if producer:
        audit = {
            "tenant_id": event.tenant_id,
            "timestamp": event.timestamp,
            "type": "rt-script-generated",
            "title": f"Script generated for {event.asset.hostname}",
            "description": f"Stub script generated for {event.asset.hostname}",
        }
        await producer.send_and_wait("audit.events", audit)
    return {"prompt": prompt, "script": script}


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
