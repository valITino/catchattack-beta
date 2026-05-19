from __future__ import annotations

import json
from datetime import UTC, datetime
from pathlib import Path

import pytest
from evidence_mcp.models import (
    Artifacts,
    CaptureBundle,
    Marker,
    Stats,
    TopProcess,
    Trigger,
)
from evidence_mcp.server import build_server
from evidence_mcp.storage import FilesystemStorage


@pytest.fixture
def storage(tmp_path: Path) -> FilesystemStorage:
    return FilesystemStorage(tmp_path / "evidence")


@pytest.fixture
def sample_bundle() -> CaptureBundle:
    return CaptureBundle(
        id="00000000-0000-0000-0000-000000000aaa",
        agent_id="00000000-0000-0000-0000-000000000001",
        started_at=datetime(2026, 5, 13, 12, 0, 0, tzinfo=UTC),
        ended_at=datetime(2026, 5, 13, 12, 3, 30, tzinfo=UTC),
        trigger=Trigger(kind="atomic", atomic_technique="T1059.001", atomic_test_number=1),
        artifacts=Artifacts(
            video_hls="file:///tmp/cap/video/index.m3u8",
            sysmon_events="file:///tmp/cap/events/sysmon.jsonl",
        ),
        markers=[
            Marker(t_ms=0, kind="atomic_step_start", label="Step 1 begin", color="red"),
            Marker(t_ms=5000, kind="process_spawn", label="powershell.exe spawned"),
            Marker(t_ms=12000, kind="detection_hit", label="rule fired", ref="rule-100100"),
            Marker(t_ms=15000, kind="atomic_step_end", label="Step 1 end", color="red"),
        ],
        stats=Stats(
            event_count=512,
            duration_ms=210_000,
            size_bytes=1_234_567,
            top_processes=[
                TopProcess(name="powershell.exe", count=42),
                TopProcess(name="cmd.exe", count=12),
            ],
        ),
    )


@pytest.fixture
def populated_storage(
    storage: FilesystemStorage, sample_bundle: CaptureBundle
) -> FilesystemStorage:
    storage.put_bundle(sample_bundle)
    # Drop a small synthetic event stream so query_events has something.
    cap_dir = storage._find_dir(sample_bundle.id)
    events_dir = cap_dir / "events"
    events_dir.mkdir(exist_ok=True)
    (events_dir / "sysmon.jsonl").write_text(
        "\n".join(
            json.dumps(o)
            for o in [
                {
                    "t_ms": 500,
                    "event_id": 1,
                    "process_name": "powershell.exe",
                    "parent_name": "explorer.exe",
                    "cmd": "powershell.exe -EncodedCommand AAA",
                },
                {
                    "t_ms": 1500,
                    "event_id": 1,
                    "process_name": "powershell.exe",
                    "parent_name": "powershell.exe",
                    "cmd": "powershell.exe -enc BBB",
                },
                {
                    "t_ms": 2500,
                    "event_id": 3,
                    "process_name": "cmd.exe",
                    "parent_name": "explorer.exe",
                    "cmd": "cmd.exe /c whoami",
                },
            ]
        )
        + "\n",
        encoding="utf-8",
    )
    return storage


@pytest.fixture
def server(populated_storage: FilesystemStorage) -> object:
    return build_server(populated_storage)
