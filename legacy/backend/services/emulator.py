from typing import Dict
import os
import logging
import requests


SUPABASE_FUNCTION = "ai-mitre-techniques"


def run_emulation(technique_id: str) -> Dict[str, str]:
    """Kick off an adversary emulation via Supabase edge functions."""
    supabase_url = os.getenv("SUPABASE_URL", "http://localhost:54321")
    anon_key = os.getenv("SUPABASE_ANON_KEY")
    if not anon_key:
        raise RuntimeError("SUPABASE_ANON_KEY not configured")

    url = f"{supabase_url}/functions/v1/{SUPABASE_FUNCTION}"
    headers = {
        "apikey": anon_key,
        "Authorization": f"Bearer {anon_key}",
        "Content-Type": "application/json",
    }

    try:
        response = requests.post(url, json={}, headers=headers, timeout=10)
        response.raise_for_status()
        logging.info("Supabase %s response: %s", SUPABASE_FUNCTION, response.text)
    except Exception:
        logging.exception("Failed to invoke Supabase function")
        raise

    return {"technique": technique_id, "status": "started"}
