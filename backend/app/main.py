from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from .core.config import settings
from .api.v1.auth import router as auth_router
from .api.v1.rules import router as rules_router
from .api.v1.runs import router as runs_router
from .api.v1.profiles import router as profiles_router
from .api.v1.coverage import router as coverage_router
from .api.v1.priorities import router as priorities_router
from .api.v1.tuning import router as tuning_router
from .api.v1.deploy import router as deploy_router

os.makedirs(settings.artifacts_dir, exist_ok=True)
os.makedirs(os.path.join(settings.artifacts_dir, "ai_cache"), exist_ok=True)

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
app.include_router(runs_router, prefix="/api/v1")
app.include_router(profiles_router, prefix="/api/v1")
app.include_router(coverage_router, prefix="/api/v1")
app.include_router(priorities_router, prefix="/api/v1")
app.include_router(tuning_router, prefix="/api/v1")
app.include_router(deploy_router, prefix="/api/v1")
