from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from .core.config import settings
from .api.v1.auth import router as auth_router
from .api.v1.rules import router as rules_router

os.makedirs(settings.artifacts_dir, exist_ok=True)

app = FastAPI(title="catchattack-beta API", version="0.2.0")

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

app.include_router(auth_router, prefix="/api/v1")
app.include_router(rules_router, prefix="/api/v1")
