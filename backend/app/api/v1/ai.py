from fastapi import APIRouter, Depends, HTTPException, Body
from typing import Dict, Any
from pathlib import Path
import orjson
import asyncio

from app.core.security import require_role, get_current_user
from app.core.config import settings
from app.core.rate_limit import rl
from app.services.ai.schemas import (
    RuleGenRequest, RuleGenResponse,
    AttackGenRequest, AttackGenResponse,
    InfraGenRequest, InfraGenResponse
)
from app.services.ai.utils import to_json, sha256_str
from app.services.ai.cache import cache_get, cache_set
from app.services.ai.provider import call_provider
from app.services.ai.safety import sanitize_script

router = APIRouter(prefix="/ai", tags=["ai"])

def _prompt_from_template(tpl: str, payload: dict, extras: dict) -> str:
    s = tpl.replace("{{INPUT_JSON}}", to_json(payload))
    for k,v in extras.items():
        s = s.replace(f"{{{{{k}}}}}", str(v))
    return s

def _load_tpl(name: str) -> str:
    p = Path(__file__).resolve().parents[2] / "services" / "ai" / "prompts" / name
    return p.read_text(encoding="utf-8")

async def _guard_and_cache(user, key: str, call_fn):
    if not rl.allow(f"{user.sub}:{getattr(user, 'jti', '')}:ai"):
        raise HTTPException(429, "Rate limit exceeded. Try again in a minute.")
    cached = cache_get(key)
    if cached is not None:
        return cached
    res = await call_fn()
    cache_set(key, res)
    return res

@router.post("/rules/generate", response_model=RuleGenResponse, summary="AI: generate Sigma rule")
async def ai_rules_generate(payload: RuleGenRequest = Body(...), user=Depends(get_current_user)):
    tpl = _load_tpl("rule_gen.md")
    prompt = _prompt_from_template(tpl, payload.model_dump(), {})
    key = sha256_str("rule_gen:" + prompt + ":" + settings.ai_model)
    result = await _guard_and_cache(user, key, lambda: call_provider(settings.ai_provider, prompt))
    # Validate & coerce to schema
    try:
        out = RuleGenResponse.model_validate(result)
    except Exception as e:
        raise HTTPException(502, f"Provider returned invalid schema: {e}")
    return out

@router.post("/attacks/generate", response_model=AttackGenResponse, summary="AI: generate safe attack script")
async def ai_attacks_generate(payload: AttackGenRequest = Body(...), user=Depends(get_current_user)):
    extras = {"STYLE": payload.style}
    tpl = _load_tpl("attack_gen.md")
    prompt = _prompt_from_template(tpl, payload.model_dump(), extras)
    key = sha256_str("attack_gen:" + prompt + ":" + settings.ai_model)
    result = await _guard_and_cache(user, key, lambda: call_provider(settings.ai_provider, prompt))
    try:
        out = AttackGenResponse.model_validate(result)
    except Exception as e:
        raise HTTPException(502, f"Provider returned invalid schema: {e}")

    # Safety pass
    cleaned, notes = sanitize_script(out.script)
    if notes:
        out.opsec_notes = list(set(out.opsec_notes + [f"sanitizer: {n}" for n in notes]))
    out.script = cleaned
    return out

@router.post("/infra/generate", response_model=InfraGenResponse, summary="AI: generate lab blueprint")
async def ai_infra_generate(payload: InfraGenRequest = Body(...), user=Depends(get_current_user)):
    tpl = _load_tpl("infra_gen.md")
    prompt = _prompt_from_template(tpl, payload.model_dump(), {})
    key = sha256_str("infra_gen:" + prompt + ":" + settings.ai_model)
    result = await _guard_and_cache(user, key, lambda: call_provider(settings.ai_provider, prompt))
    try:
        out = InfraGenResponse.model_validate(result)
    except Exception as e:
        raise HTTPException(502, f"Provider returned invalid schema: {e}")
    return out
