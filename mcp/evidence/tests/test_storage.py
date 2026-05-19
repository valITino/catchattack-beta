from __future__ import annotations

from datetime import UTC, datetime

import pytest
from evidence_mcp.models import ArtifactKind, CaptureBundle
from evidence_mcp.storage import CaptureNotFoundError, FilesystemStorage


def test_put_then_get_round_trips(storage: FilesystemStorage, sample_bundle: CaptureBundle) -> None:
    storage.put_bundle(sample_bundle)
    fetched = storage.get_bundle(sample_bundle.id)
    assert fetched.id == sample_bundle.id
    assert fetched.trigger.atomic_technique == "T1059.001"
    assert fetched.stats.event_count == 512


def test_get_summary_is_computed_at_put_time(
    storage: FilesystemStorage, sample_bundle: CaptureBundle
) -> None:
    storage.put_bundle(sample_bundle)
    summary = storage.get_summary(sample_bundle.id)
    assert summary.capture_id == sample_bundle.id
    assert summary.technique == "T1059.001"
    # 4 markers, only 1 is "sysmon_event" by kind name; the other 3 count.
    assert summary.notable_marker_count == 4
    # top_processes carried from the bundle stats.
    assert summary.top_processes[0].name == "powershell.exe"


def test_get_markers_returns_models(
    storage: FilesystemStorage, sample_bundle: CaptureBundle
) -> None:
    storage.put_bundle(sample_bundle)
    markers = storage.get_markers(sample_bundle.id)
    assert len(markers) == 4
    assert markers[0].kind.value == "atomic_step_start"


def test_list_bundles_filters_by_agent_and_technique(
    storage: FilesystemStorage, sample_bundle: CaptureBundle
) -> None:
    storage.put_bundle(sample_bundle)
    other = sample_bundle.model_copy(
        update={
            "id": "00000000-0000-0000-0000-000000000bbb",
            "agent_id": "00000000-0000-0000-0000-000000000002",
            "started_at": datetime(2026, 5, 13, 13, 0, 0, tzinfo=UTC),
            "ended_at": datetime(2026, 5, 13, 13, 1, 0, tzinfo=UTC),
        }
    )
    storage.put_bundle(other)

    all_lst = storage.list_bundles()
    assert all_lst.total == 2

    only_first = storage.list_bundles(agent_id=sample_bundle.agent_id)
    assert only_first.total == 1
    assert only_first.items[0].id == sample_bundle.id

    by_technique = storage.list_bundles(technique="T1059.001")
    assert by_technique.total == 2  # both share the technique

    none = storage.list_bundles(technique="T9999.999")
    assert none.total == 0


def test_get_artifact_url_returns_file_uri(
    storage: FilesystemStorage, sample_bundle: CaptureBundle
) -> None:
    storage.put_bundle(sample_bundle)
    url = storage.get_artifact_url(sample_bundle.id, ArtifactKind.SYSMON_EVENTS)
    assert url.url.startswith("file://")
    assert url.url.endswith("/events/sysmon.jsonl")
    assert url.expires_at > sample_bundle.started_at


def test_missing_capture_raises(storage: FilesystemStorage) -> None:
    with pytest.raises(CaptureNotFoundError):
        storage.get_bundle("00000000-0000-0000-0000-deadbeefdead")
