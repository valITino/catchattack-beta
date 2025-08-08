from typing import Literal, Dict, Any
import httpx, os
from app.core.config import settings
from .utils import to_json, extract_json_block
from tenacity import retry, stop_after_attempt, wait_fixed

Provider = Literal["local","openai","ollama"]


@retry(stop=stop_after_attempt(2), wait=wait_fixed(1))
async def _openai_call(prompt: str) -> str:
    if not settings.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY missing")
    headers = {"Authorization": f"Bearer {settings.openai_api_key}"}
    payload = {
        "model": settings.ai_model,
        "messages": [
            {"role":"system","content":"You MUST respond with JSON only. No prose."},
            {"role":"user","content": prompt}
        ],
        "temperature": 0.2,
        "max_tokens": 1200,
    }
    async with httpx.AsyncClient(timeout=settings.ai_timeout_s) as client:
        r = await client.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"]


@retry(stop=stop_after_attempt(2), wait=wait_fixed(1))
async def _ollama_call(prompt: str) -> str:
    url = settings.ollama_base_url.rstrip("/") + "/api/generate"
    payload = {"model": settings.ai_model, "prompt": prompt, "options": {"temperature": 0.2}}
    async with httpx.AsyncClient(timeout=settings.ai_timeout_s) as client:
        r = await client.post(url, json=payload)
        r.raise_for_status()
        # streaming or json? Assume full json with "response"
        data = r.json()
        return data.get("response") or data  # fallback


async def call_provider(provider: Provider, prompt: str) -> Dict[str, Any]:
    if provider == "openai":
        txt = await _openai_call(prompt)
        return extract_json_block(txt)
    if provider == "ollama":
        txt = await _ollama_call(prompt)
        if isinstance(txt, dict): return txt
        return extract_json_block(txt)
    # local heuristic mock (deterministic)
    # Produces minimal viable outputs for tests/offline dev
    import uuid
    if '"sigma_yaml"' in prompt:
        return {
            "sigma_yaml": f"title: AI Rule\nid: {uuid.uuid4()}\nlogsource: {{ product: windows }}\ndetection:\n  sel:\n    process.command_line|contains: \"-EncodedCommand\"\n  condition: sel\nlevel: medium\n",
            "rationale":"Heuristic local provider",
            "test_events":[{"process":{"command_line":"powershell -EncodedCommand AAA"}},{"process":{"command_line":"pwsh -enc BBB"}}]
        }
    if '"script"' in prompt or '"steps"' in prompt:
        return {
            "script": "# simulated\n echo 'emulation only'\n # cleanup\n echo 'done'",
            "steps": ["simulate action","cleanup"],
            "opsec_notes": ["no external network"]
        }
    # infra
    return {
        "blueprint":{
            "compose_yaml":"version: '3'\nservices:\n  es:\n    image: docker.elastic.co/elasticsearch/elasticsearch:8.14.1\n    environment:\n      - discovery.type=single-node\n",
            "provisioning_steps":["docker compose up -d"],
            "seeds":[{"file":"events.ndjson","desc":"sample events"}]
        },
        "assumptions":["local provider defaults"]
    }
