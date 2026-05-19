"""Storage layer for capture bundles.

Phase 3: filesystem-backed (one directory per capture under a configurable
root). The shape mirrors the S3 layout in addendum §E.4 so the Phase 5+ S3
backend is a drop-in replacement:

    <root>/tenants/<tenant_id>/captures/<yyyy>/<mm>/<capture_id>/
        manifest.json
        events/sysmon.jsonl[.zst]
        events/auditd.jsonl[.zst]
        video/index.m3u8 + segment_*.ts
        process_tree.json
        atomic_output.txt
        markers.json
        summary.json

`get_artifact_url` returns a `file://` URL in filesystem mode and a presigned
S3 URL when the backend is swapped to S3 (Phase 5).
"""

from __future__ import annotations

import json
from collections.abc import Iterable
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from pathlib import Path
from threading import RLock
from typing import Any

from .models import (
    ArtifactKind,
    ArtifactURL,
    CaptureBundle,
    CaptureList,
    CaptureListItem,
    CaptureSummary,
    Marker,
    ProcessChain,
    Stats,
    TopProcess,
)

DEFAULT_TENANT = "default"


@dataclass
class CaptureNotFoundError(Exception):
    capture_id: str

    def __str__(self) -> str:
        return f"capture not found: {self.capture_id}"


class FilesystemStorage:
    """Capture-bundle storage rooted at a local directory.

    Thread-safe via a coarse lock; capture writes are serialised. Acceptable
    for Phase 3 (the agent fleet is bounded) and trivial to swap later.
    """

    def __init__(self, root: Path | str) -> None:
        self._root = Path(root)
        self._root.mkdir(parents=True, exist_ok=True)
        self._lock = RLock()
        # capture_id → capture directory. Built once by scanning the tree,
        # then kept current by put_bundle — so reads are O(1) instead of an
        # O(total captures) rglob per call.
        self._index: dict[str, Path] = {
            m.parent.name: m.parent for m in self._root.rglob("manifest.json")
        }

    # ---- path resolution ---------------------------------------------------

    def _tenant_root(self, tenant: str | None) -> Path:
        return self._root / "tenants" / (tenant or DEFAULT_TENANT) / "captures"

    def _capture_dir(self, bundle: CaptureBundle) -> Path:
        yyyy = f"{bundle.started_at.year:04d}"
        mm = f"{bundle.started_at.month:02d}"
        return self._tenant_root(bundle.tenant_id) / yyyy / mm / bundle.id

    # ---- write -------------------------------------------------------------

    def put_bundle(self, bundle: CaptureBundle) -> Path:
        with self._lock:
            d = self._capture_dir(bundle)
            d.mkdir(parents=True, exist_ok=True)
            (d / "manifest.json").write_text(bundle.model_dump_json(indent=2), encoding="utf-8")
            (d / "markers.json").write_text(
                json.dumps([m.model_dump(mode="json") for m in bundle.markers], indent=2),
                encoding="utf-8",
            )
            summary = self._compute_summary(bundle)
            (d / "summary.json").write_text(summary.model_dump_json(indent=2), encoding="utf-8")
            self._index[bundle.id] = d
            return d

    def put_event_stream(
        self,
        bundle_id: str,
        source: str,
        events: Iterable[dict[str, Any]],
    ) -> Path:
        """Append a JSONL event stream to the capture's events/ directory."""
        d = self._find_dir(bundle_id)
        events_dir = d / "events"
        events_dir.mkdir(exist_ok=True)
        path = events_dir / f"{source}.jsonl"
        with self._lock, path.open("a", encoding="utf-8") as fh:
            for ev in events:
                fh.write(json.dumps(ev, separators=(",", ":")) + "\n")
        return path

    # ---- read --------------------------------------------------------------

    def get_bundle(self, bundle_id: str) -> CaptureBundle:
        d = self._find_dir(bundle_id)
        return CaptureBundle.model_validate_json((d / "manifest.json").read_text(encoding="utf-8"))

    def get_summary(self, bundle_id: str) -> CaptureSummary:
        d = self._find_dir(bundle_id)
        return CaptureSummary.model_validate_json((d / "summary.json").read_text(encoding="utf-8"))

    def get_markers(self, bundle_id: str) -> list[Marker]:
        d = self._find_dir(bundle_id)
        raw = json.loads((d / "markers.json").read_text(encoding="utf-8"))
        return [Marker.model_validate(m) for m in raw]

    def list_bundles(
        self,
        *,
        agent_id: str | None = None,
        technique: str | None = None,
        trigger_kind: str | None = None,
        started_after: datetime | None = None,
        started_before: datetime | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> CaptureList:
        items: list[CaptureListItem] = []
        for capture_dir in sorted(self._index.values()):
            manifest = capture_dir / "manifest.json"
            try:
                bundle = CaptureBundle.model_validate_json(manifest.read_text(encoding="utf-8"))
            except (ValueError, OSError):
                continue
            if agent_id and bundle.agent_id != agent_id:
                continue
            if trigger_kind and bundle.trigger.kind.value != trigger_kind:
                continue
            if technique and bundle.trigger.atomic_technique != technique:
                continue
            if started_after and bundle.started_at < started_after:
                continue
            if started_before and bundle.started_at > started_before:
                continue
            items.append(
                CaptureListItem(
                    id=bundle.id,
                    agent_id=bundle.agent_id,
                    started_at=bundle.started_at,
                    ended_at=bundle.ended_at,
                    trigger=bundle.trigger,
                    event_count=bundle.stats.event_count,
                )
            )
        items.sort(key=lambda i: i.started_at, reverse=True)
        return CaptureList(items=items[offset : offset + limit], total=len(items))

    def get_artifact_url(
        self,
        bundle_id: str,
        artifact: ArtifactKind,
        ttl_seconds: int = 900,
    ) -> ArtifactURL:
        d = self._find_dir(bundle_id)
        # Map ArtifactKind → relative path inside the capture dir.
        path_map = {
            ArtifactKind.VIDEO_HLS: d / "video" / "index.m3u8",
            ArtifactKind.VIDEO_MP4: d / "video" / "output.mp4",
            ArtifactKind.SYSMON_EVENTS: d / "events" / "sysmon.jsonl",
            ArtifactKind.AUDITD_EVENTS: d / "events" / "auditd.jsonl",
            ArtifactKind.ESF_EVENTS: d / "events" / "esf.jsonl",
            ArtifactKind.PCAP: d / "pcap" / "capture.pcap",
            ArtifactKind.PROCESS_TREE: d / "process_tree.json",
            ArtifactKind.ATOMIC_OUTPUT: d / "atomic_output.txt",
        }
        target = path_map[artifact]
        # Phase 3: filesystem URL. Phase 5: replace with presigned S3.
        expires = datetime.now(tz=UTC) + timedelta(seconds=ttl_seconds)
        return ArtifactURL(url=f"file://{target.resolve()}", expires_at=expires)

    # ---- helpers -----------------------------------------------------------

    def events_dir(self, bundle_id: str) -> Path:
        """Path to a capture's events/ directory. Raises CaptureNotFoundError."""
        return self._find_dir(bundle_id) / "events"

    def _find_dir(self, bundle_id: str) -> Path:
        with self._lock:
            cached = self._index.get(bundle_id)
            if cached is not None and (cached / "manifest.json").exists():
                return cached
            # Cache miss (or stale entry) — one rglob to recover, e.g. a
            # capture written by another process.
            for manifest in self._root.rglob("manifest.json"):
                if manifest.parent.name == bundle_id:
                    self._index[bundle_id] = manifest.parent
                    return manifest.parent
        raise CaptureNotFoundError(bundle_id)

    @staticmethod
    def _compute_summary(bundle: CaptureBundle) -> CaptureSummary:
        # Phase 3: derive what we can from the bundle's stats + markers; the
        # agent computes top_processes ahead of time. Anything fancier needs
        # the raw event stream, which the Conductor can fetch via
        # query_events when needed.
        proc_chains: list[ProcessChain] = [
            ProcessChain(name=tp.name, count=tp.count, parent_chains=[])
            for tp in bundle.stats.top_processes
        ]
        notable = sum(1 for m in bundle.markers if m.kind.value != "sysmon_event")
        suspicious = min(1.0, notable / 20.0)
        return CaptureSummary(
            capture_id=bundle.id,
            technique=bundle.trigger.atomic_technique,
            duration_ms=bundle.stats.duration_ms,
            top_processes=proc_chains,
            suspicious_score=suspicious,
            notable_marker_count=notable,
        )


def empty_stats() -> Stats:
    """Construct an empty Stats — useful for tests and bootstrap captures."""
    return Stats(event_count=0, duration_ms=0, size_bytes=0, top_processes=[])


def now_iso() -> str:
    """Seconds-precision UTC ISO8601 — used in synthetic bundles."""
    return datetime.now(tz=UTC).replace(microsecond=0).isoformat()


__all__ = [
    "CaptureNotFoundError",
    "FilesystemStorage",
    "TopProcess",
    "empty_stats",
    "now_iso",
]
