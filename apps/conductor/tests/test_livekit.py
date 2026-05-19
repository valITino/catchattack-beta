"""Tests for LiveKit token minting + the live-marker hub."""

from __future__ import annotations

import asyncio
import base64
import json

import pytest
from conductor.livekit import (
    LiveKitConfig,
    MarkerHub,
    mint_viewer_token,
    room_name,
)


def _config() -> LiveKitConfig:
    return LiveKitConfig(
        url="ws://livekit.test:7880",
        api_key="devkey",
        api_secret="devsecretdevsecretdevsecret012345",
    )


def _decode_claims(jwt: str) -> dict[str, object]:
    payload = jwt.split(".")[1]
    payload += "=" * (-len(payload) % 4)
    return json.loads(base64.urlsafe_b64decode(payload))


def test_room_name_matches_agent_convention() -> None:
    assert room_name("abc") == "run-abc"


def test_config_configured_flag() -> None:
    assert _config().configured is True
    assert LiveKitConfig(url="", api_key="", api_secret="").configured is False


def test_mint_viewer_token_is_subscribe_only() -> None:
    token = mint_viewer_token(_config(), "run-9", "viewer-alice")
    claims = _decode_claims(token)
    video = claims["video"]
    assert isinstance(video, dict)
    assert video["room"] == "run-run-9"
    assert video["roomJoin"] is True
    assert video["canSubscribe"] is True
    assert video["canPublish"] is False
    assert claims["sub"] == "viewer-alice"
    assert claims["iss"] == "devkey"


def test_mint_viewer_token_requires_config() -> None:
    with pytest.raises(RuntimeError, match="not configured"):
        mint_viewer_token(
            LiveKitConfig(url="", api_key="", api_secret=""),
            "run-1",
            "viewer",
        )


async def test_marker_hub_fans_out_to_subscribers() -> None:
    hub = MarkerHub()
    q1 = hub.subscribe("run-1")
    q2 = hub.subscribe("run-1")
    hub.publish("run-1", {"kind": "detection_hit", "label": "x"})
    assert (await q1.get())["label"] == "x"
    assert (await q2.get())["label"] == "x"


async def test_marker_hub_isolates_runs() -> None:
    hub = MarkerHub()
    q_run1 = hub.subscribe("run-1")
    hub.subscribe("run-2")
    hub.publish("run-2", {"kind": "atomic_step_start", "label": "only run-2"})
    # run-1's queue must stay empty.
    with pytest.raises(asyncio.TimeoutError):
        await asyncio.wait_for(q_run1.get(), timeout=0.05)


async def test_marker_hub_close_sends_sentinel() -> None:
    hub = MarkerHub()
    q = hub.subscribe("run-1")
    hub.close("run-1")
    assert await q.get() is None


def test_marker_hub_unsubscribe_drops_subscriber() -> None:
    hub = MarkerHub()
    q = hub.subscribe("run-1")
    assert hub.subscriber_count("run-1") == 1
    hub.unsubscribe("run-1", q)
    assert hub.subscriber_count("run-1") == 0
