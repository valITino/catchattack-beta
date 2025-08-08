from fastapi import FastAPI
from .core.config import settings

app = FastAPI(title="catchattack-beta API", version="0.1.0")

@app.get("/api/v1/healthz")
def healthz():
    return {"status": "ok", "env": settings.env}
