from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import settings
from .api import auth, rules

app = FastAPI(title="catchattack-beta API", version="0.1.0")

app.add_middleware(
    CORSMiddleware, allow_origins=settings.cors_origins,
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(rules.router)

@app.get("/api/v1/healthz")
def healthz():
    return {"status": "ok", "env": settings.env}
