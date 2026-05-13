from pathlib import Path
import orjson
from app.core.config import settings

CACHE_DIR = Path(settings.artifacts_dir) / "ai_cache"


def cache_get(key: str):
    p = CACHE_DIR / f"{key}.json"
    if p.exists():
        return orjson.loads(p.read_bytes())
    return None


def cache_set(key: str, value: dict):
    p = CACHE_DIR / f"{key}.json"
    p.write_bytes(orjson.dumps(value))
    return True
