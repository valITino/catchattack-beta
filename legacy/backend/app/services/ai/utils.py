import orjson
import hashlib


def to_json(obj) -> str:
    return orjson.dumps(obj, option=orjson.OPT_INDENT_2).decode()


def sha256_str(s: str) -> str:
    return hashlib.sha256(s.encode()).hexdigest()


def extract_json_block(text: str) -> dict:
    # Attempt to parse as pure JSON; if model returns extra text, find first {...} block.
    try:
        return orjson.loads(text)
    except Exception:
        # naive fallback
        start = text.find("{")
        end = text.rfind("}")
        if start >=0 and end>start:
            return orjson.loads(text[start:end+1])
        raise
