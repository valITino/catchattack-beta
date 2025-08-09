from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import logging
from importlib import import_module

from .core.config import settings
from .api.v1.auth import router as auth_router
from .api.v1.ai import router as ai_router
from .api.v1.schedules import router as schedules_router
from .api.v1.health import router as rule_health_router
from .core.logging import configure, instrument_fastapi

os.makedirs(settings.artifacts_dir, exist_ok=True)
os.makedirs(os.path.join(settings.artifacts_dir, "ai_cache"), exist_ok=True)

configure()
app = FastAPI(title="catchattack-beta API", version="0.10.0")
instrument_fastapi(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/v1/healthz")
def healthz():
    return {"status": "ok", "env": settings.env}

@app.get("/api/v1/readyz")
def readyz():
    return {"ready": True}

app.include_router(auth_router, prefix="/api/v1")
app.include_router(ai_router, prefix="/api/v1")
app.include_router(schedules_router, prefix="/api/v1")
app.include_router(rule_health_router, prefix="/api/v1")

OPTIONAL = [
    "app.api.v1.rules",
    "app.api.v1.runs",
    "app.api.v1.profiles",
    "app.api.v1.coverage",
    "app.api.v1.priorities",
    "app.api.v1.tuning",
    "app.api.v1.deploy",
]

for mod_path in OPTIONAL:
    try:
        mod = import_module(mod_path)
        router = getattr(mod, "router")
        app.include_router(router, prefix="/api/v1")
    except Exception as e:  # pragma: no cover - optional deps
        logging.warning("Router %s not loaded: %s", mod_path, e)

from .services.validation.scheduler import start_scheduler

_scheduler = start_scheduler()
