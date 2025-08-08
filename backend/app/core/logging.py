import logging
import structlog
import os

from opentelemetry import trace
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor


def configure(service_name: str = "catchattack-api"):
    # structlog
    structlog.configure(
        processors=[
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.add_log_level,
            structlog.processors.JSONRenderer(),
        ]
    )
    logging.basicConfig(level=logging.INFO)

    # OpenTelemetry
    otlp_endpoint = os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://otel:4318")
    resource = Resource.create({"service.name": service_name})
    provider = TracerProvider(resource=resource)
    processor = BatchSpanProcessor(
        OTLPSpanExporter(endpoint=f"{otlp_endpoint}/v1/traces")
    )
    provider.add_span_processor(processor)
    trace.set_tracer_provider(provider)


def instrument_fastapi(app):
    FastAPIInstrumentor.instrument_app(app)
    RequestsInstrumentor().instrument()

