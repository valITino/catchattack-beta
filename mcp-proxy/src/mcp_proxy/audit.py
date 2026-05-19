"""Append-only JSONL audit log for every proxy decision.

Each line is one tool call. Secrets are redacted before serialisation.
"""

from __future__ import annotations

import hashlib
import json
import time
from collections.abc import Iterable, Mapping
from pathlib import Path
from threading import Lock
from typing import Any

_REDACTED = "***redacted***"

_SECRET_KEY_HINTS: tuple[str, ...] = (
    "token",
    "secret",
    "password",
    "passwd",
    "api_key",
    "apikey",
    "authorization",
    "bearer",
    "client_secret",
    "private_key",
)


def _redact(value: Any) -> Any:
    if isinstance(value, Mapping):
        return {k: (_REDACTED if _looks_secret(k) else _redact(v)) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [_redact(v) for v in value]
    return value


def _looks_secret(key: str) -> bool:
    lowered = key.lower()
    return any(hint in lowered for hint in _SECRET_KEY_HINTS)


def _hash_result(result: Any) -> str:
    payload = json.dumps(result, sort_keys=True, default=str).encode()
    return hashlib.sha256(payload).hexdigest()[:16]


class AuditLog:
    """Thread-safe JSONL writer. Process-local — no cross-process locking."""

    def __init__(self, path: str | Path) -> None:
        self._path = Path(path)
        self._path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = Lock()

    def record(
        self,
        *,
        caller: str,
        tool: str,
        params: Mapping[str, Any],
        result: Any,
        latency_ms: int,
        dry_run: bool,
        approval_token_id: str | None,
        decision: str,
    ) -> None:
        entry = {
            "ts": time.time(),
            "caller": caller,
            "tool": tool,
            "params": _redact(dict(params)),
            "result_hash": _hash_result(result),
            "latency_ms": latency_ms,
            "dry_run": dry_run,
            "approval_token_id": approval_token_id,
            "decision": decision,
        }
        line = json.dumps(entry, separators=(",", ":")) + "\n"
        with self._lock, self._path.open("a", encoding="utf-8") as fh:
            fh.write(line)

    def read_all(self) -> Iterable[dict[str, Any]]:
        """Test helper — iterates entries currently on disk."""
        if not self._path.exists():
            return []
        return [json.loads(line) for line in self._path.read_text().splitlines() if line]
