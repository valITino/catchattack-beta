from __future__ import annotations

import asyncio
import io
import json
import os
from pathlib import Path
from typing import Any

# ``aiokafka`` is optional; defer import until runtime.  If the dependency
# isn't available, the service will emit a clear error message.
try:
    from aiokafka import AIOKafkaConsumer, AIOKafkaProducer  # type: ignore[import]
except Exception:
    AIOKafkaConsumer = None  # type: ignore[assignment]
    AIOKafkaProducer = None  # type: ignore[assignment]
from fastavro import schemaless_reader
from jinja2 import Environment, FileSystemLoader

PROCESSED: set[str] = set()

def _load_schema() -> dict[str, Any]:
    with open("contracts/asset_event.avsc", "rb") as f:
        return json.load(f)

SCHEMA = _load_schema()
TEMPLATE_ENV = Environment(loader=FileSystemLoader(Path(__file__).parent / "templates"))

def _render_vm(hostname: str, cpu: float, mem: float, disk: float) -> str:
    tpl = TEMPLATE_ENV.get_template("vm.tpl.tf.j2")
    return tpl.render(name=hostname, cpu=cpu, mem=mem, disk=disk)

async def main() -> None:
    if AIOKafkaConsumer is None or AIOKafkaProducer is None:
        raise RuntimeError(
            "aiokafka library is not available; install 'aiokafka' to run the infra builder service."
        )
    bootstrap = os.getenv("KAFKA_BOOTSTRAP")
    if not bootstrap:
        raise RuntimeError("KAFKA_BOOTSTRAP is not set")
    consumer = AIOKafkaConsumer(
        "asset.events",
        bootstrap_servers=bootstrap,
        value_deserializer=lambda m: m,
    )
    producer = AIOKafkaProducer(
        bootstrap_servers=bootstrap,
        value_serializer=lambda v: json.dumps(v).encode("utf-8"),
    )
    await consumer.start()
    await producer.start()
    try:
        while True:
            msg = await consumer.getone()
            buf = io.BytesIO(msg.value)
            event = schemaless_reader(buf, SCHEMA)
            hostname = event["asset"]["hostname"]
            if hostname in PROCESSED:
                continue
            PROCESSED.add(hostname)
            tf = _render_vm(hostname, event["health"]["cpu"], event["health"]["mem"], event["health"]["disk"])
            out_dir = Path("generated")
            out_dir.mkdir(exist_ok=True)
            (out_dir / f"{hostname}.tf").write_text(tf)
            audit = {
                "tenant_id": event["tenant_id"],
                "timestamp": event["timestamp"],
                "type": "lab-created",
                "title": f"Lab created for host {hostname}",
                "description": f"Terraform template generated for host {hostname}",
            }
            await producer.send_and_wait("audit.events", audit)
    finally:
        await consumer.stop()
        await producer.stop()

if __name__ == "__main__":
    asyncio.run(main())
