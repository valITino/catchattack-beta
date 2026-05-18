"""LiveKit token minting + live-marker hub (BUILD_BRIEF.md Phase 6).

Two concerns:

1. `mint_viewer_token` — issues a subscribe-only JWT so the web UI can
   join a run's LiveKit room and watch the agent's screen track. The web
   BFF calls this; the browser never sees the LiveKit API secret.

2. `MarkerHub` — an in-process pub/sub. The closed-loop workflow publishes
   markers (atomic step started, detection hit, …) as it runs; the
   Conductor's `/live/{run_id}/markers` WebSocket fans them out to
   subscribed browsers.

LiveKit access tokens are HS256 JWTs with a `video` grant claim. We mint
them directly rather than pulling the `livekit-api` SDK — the claim shape
is tiny and stable.
"""

from __future__ import annotations

import asyncio
import base64
import contextlib
import hashlib
import hmac
import json
import os
import time
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Any

VIEWER_TOKEN_TTL_SECONDS = 6 * 60 * 60


@dataclass(frozen=True, slots=True)
class LiveKitConfig:
    url: str
    api_key: str
    api_secret: str

    @classmethod
    def from_env(cls) -> LiveKitConfig:
        return cls(
            url=os.environ.get("LIVEKIT_URL", ""),
            api_key=os.environ.get("LIVEKIT_API_KEY", ""),
            api_secret=os.environ.get("LIVEKIT_API_SECRET", ""),
        )

    @property
    def configured(self) -> bool:
        return bool(self.url and self.api_key and self.api_secret)


def room_name(run_id: str) -> str:
    """One LiveKit room per workflow run. Mirrors the Go agent's RoomName."""
    return f"run-{run_id}"


def _b64url(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")


def mint_viewer_token(
    config: LiveKitConfig,
    run_id: str,
    viewer_identity: str,
    ttl_seconds: int = VIEWER_TOKEN_TTL_SECONDS,
) -> str:
    """Mint a subscribe-only LiveKit JWT for a browser viewer.

    The viewer can join `room_name(run_id)` and subscribe, but cannot
    publish — browsers only watch.
    """
    if not config.configured:
        raise RuntimeError("LiveKit is not configured (set LIVEKIT_URL/API_KEY/API_SECRET)")

    now = int(time.time())
    header = {"alg": "HS256", "typ": "JWT"}
    payload: dict[str, Any] = {
        "iss": config.api_key,
        "sub": viewer_identity,
        "nbf": now,
        "exp": now + ttl_seconds,
        "video": {
            "room": room_name(run_id),
            "roomJoin": True,
            "canPublish": False,
            "canSubscribe": True,
            "canPublishData": False,
        },
    }
    signing_input = (
        _b64url(json.dumps(header, separators=(",", ":")).encode())
        + "."
        + _b64url(json.dumps(payload, separators=(",", ":")).encode())
    )
    signature = hmac.new(
        config.api_secret.encode(), signing_input.encode(), hashlib.sha256
    ).digest()
    return f"{signing_input}.{_b64url(signature)}"


# ---------------------------------------------------------------------------
# Live-marker hub
# ---------------------------------------------------------------------------


@dataclass
class MarkerHub:
    """In-process fan-out of live markers, keyed by run_id.

    The closed-loop workflow calls `publish(run_id, marker)`; each
    subscribed WebSocket gets the marker on its own queue. Single-process
    only — Phase 7+ moves this to Redis Streams when the Conductor scales
    horizontally.
    """

    _subscribers: dict[str, list[asyncio.Queue[dict[str, Any] | None]]] = field(
        default_factory=lambda: defaultdict(list)
    )

    def subscribe(self, run_id: str) -> asyncio.Queue[dict[str, Any] | None]:
        queue: asyncio.Queue[dict[str, Any] | None] = asyncio.Queue(maxsize=256)
        self._subscribers[run_id].append(queue)
        return queue

    def unsubscribe(self, run_id: str, queue: asyncio.Queue[dict[str, Any] | None]) -> None:
        subs = self._subscribers.get(run_id)
        if subs and queue in subs:
            subs.remove(queue)
        if subs is not None and not subs:
            del self._subscribers[run_id]

    def publish(self, run_id: str, marker: dict[str, Any]) -> None:
        for queue in list(self._subscribers.get(run_id, [])):
            try:
                queue.put_nowait(marker)
            except asyncio.QueueFull:
                # Drop oldest — live markers are best-effort.
                with contextlib.suppress(asyncio.QueueEmpty):
                    queue.get_nowait()
                queue.put_nowait(marker)

    def close(self, run_id: str) -> None:
        """Signal end-of-run — subscribers receive a None sentinel."""
        for queue in list(self._subscribers.get(run_id, [])):
            with contextlib.suppress(asyncio.QueueFull):
                queue.put_nowait(None)

    def subscriber_count(self, run_id: str) -> int:
        return len(self._subscribers.get(run_id, []))
