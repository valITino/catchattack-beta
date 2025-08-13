from __future__ import annotations

import asyncio
import json
import os
import time

# Delay aiokafka imports until runtime.  ``aiokafka`` is an optional
# dependency; if it's not installed, the service will emit a clear error
# message instead of failing at import time.
try:
    from aiokafka import AIOKafkaConsumer, AIOKafkaProducer  # type: ignore[import]
except Exception:
    AIOKafkaConsumer = None  # type: ignore[assignment]
    AIOKafkaProducer = None  # type: ignore[assignment]

from .clients.edr import push_rule as push_edr
from .clients.nessus import push_rule as push_nessus

async def main() -> None:
    if AIOKafkaConsumer is None or AIOKafkaProducer is None:
        raise RuntimeError(
            "aiokafka library is not available; install 'aiokafka' to run the deployer service."
        )
    bootstrap = os.getenv("KAFKA_BOOTSTRAP")
    if not bootstrap:
        raise RuntimeError("KAFKA_BOOTSTRAP is not set")
    consumer = AIOKafkaConsumer(
        "rules.draft",
        bootstrap_servers=bootstrap,
        value_deserializer=lambda m: json.loads(m.decode("utf-8")),
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
            rule = msg.value
            score = rule.get("score", 0.0)
            tenant_id = rule.get("tenant_id")
            if score < 0.8:
                await producer.send_and_wait(
                    "audit.events",
                    {
                        "tenant_id": tenant_id,
                        "timestamp": int(time.time() * 1000),
                        "type": "rule-rejected",
                        "title": "Rule deployment",
                        "description": f"Rule rejected due to low score {score:.2f}",
                    },
                )
                continue
            edr_ok = push_edr(
                rule.get("sigma", ""),
                os.getenv("EDR_URL", ""),
                os.getenv("EDR_TOKEN", ""),
            )
            nessus_ok = push_nessus(
                rule.get("sigma", ""),
                os.getenv("NESSUS_URL", ""),
                os.getenv("NESSUS_TOKEN", ""),
            )
            event_type = "rule-deployed" if edr_ok and nessus_ok else "rule-deploy-failed"
            desc = (
                "Rule deployed to EDR and Nessus"
                if event_type == "rule-deployed"
                else "Deployment to EDR or Nessus failed"
            )
            await producer.send_and_wait(
                "audit.events",
                {
                    "tenant_id": tenant_id,
                    "timestamp": int(time.time() * 1000),
                    "type": event_type,
                    "title": "Rule deployment",
                    "description": desc,
                },
            )
    finally:
        await consumer.stop()
        await producer.stop()

if __name__ == "__main__":
    asyncio.run(main())
