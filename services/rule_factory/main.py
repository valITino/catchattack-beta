from __future__ import annotations

import asyncio
import json
import os
import time

from aiokafka import AIOKafkaConsumer, AIOKafkaProducer

from .sigma_model import sigma_from_logs

async def main() -> None:
    bootstrap = os.getenv("KAFKA_BOOTSTRAP")
    if not bootstrap:
        raise RuntimeError("KAFKA_BOOTSTRAP is not set")
    consumer = AIOKafkaConsumer(
        "lab.findings",
        bootstrap_servers=bootstrap,
        value_deserializer=lambda m: m.decode("utf-8"),
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
            sigma_yaml, score = sigma_from_logs(msg.value)
            await producer.send_and_wait(
                "rules.draft",
                {"sigma": sigma_yaml, "score": score, "tenant_id": None},
            )
            await producer.send_and_wait(
                "audit.events",
                {
                    "tenant_id": None,
                    "timestamp": int(time.time() * 1000),
                    "type": "rule-generated",
                    "title": "Sigma rule generated",
                    "description": "A Sigma rule has been generated from lab findings",
                },
            )
    finally:
        await consumer.stop()
        await producer.stop()

if __name__ == "__main__":
    asyncio.run(main())
