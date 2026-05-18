"""Deterministic synthetic dataset for the mock Falcon MCP.

Mirrors realistic Falcon cardinality per BUILD_BRIEF_ADDENDUM.md §B.2:
~50 detections across 12 hosts, plus a small intel indicator set.
"""

from __future__ import annotations

import random
from collections.abc import Iterable
from datetime import UTC, datetime, timedelta

from .models import Detection, Host, IntelIndicator

DEFAULT_SEED = 20260513
HOST_COUNT = 12
DETECTION_COUNT = 50

_PLATFORMS = ["Windows", "Linux", "Mac"]

_TECHNIQUES: list[tuple[str, str, str]] = [
    ("Execution", "PowerShell", "T1059.001"),
    ("Execution", "Windows Command Shell", "T1059.003"),
    ("Defense Evasion", "Process Injection", "T1055"),
    ("Credential Access", "LSASS Memory", "T1003.001"),
    ("Persistence", "Scheduled Task", "T1053.005"),
    ("Lateral Movement", "Remote Services: SMB", "T1021.002"),
    ("Discovery", "Process Discovery", "T1057"),
    ("Command and Control", "Application Layer Protocol", "T1071.001"),
]

_FILENAMES = [
    "powershell.exe",
    "cmd.exe",
    "rundll32.exe",
    "wmic.exe",
    "mimikatz.exe",
    "psexec.exe",
    "bash",
    "curl",
]

_STATUSES = ["new", "in_progress", "true_positive", "false_positive", "closed"]


def _iso(dt: datetime) -> str:
    return dt.replace(microsecond=0).isoformat()


class FalconStore:
    """In-memory synthetic Falcon dataset. Deterministic per seed."""

    def __init__(self, seed: int = DEFAULT_SEED) -> None:
        rng = random.Random(seed)  # noqa: S311 — synthetic test data, not crypto
        now = datetime.now(tz=UTC)

        self.hosts: list[Host] = []
        for i in range(HOST_COUNT):
            platform = rng.choice(_PLATFORMS)
            self.hosts.append(
                Host(
                    device_id=f"dev{i:08x}",
                    hostname=f"falcon-host-{i:02d}",
                    platform_name=platform,
                    os_version=("Windows 10" if platform == "Windows" else "Ubuntu 22.04"),
                    local_ip=f"10.0.{i}.{rng.randint(2, 254)}",
                    external_ip=f"198.51.100.{rng.randint(2, 254)}",
                    status="normal",
                    last_seen=_iso(now - timedelta(minutes=rng.randint(0, 600))),
                    agent_version="7.20.0",
                )
            )

        self.detections: list[Detection] = []
        for i in range(DETECTION_COUNT):
            tactic, technique, attack_id = rng.choice(_TECHNIQUES)
            host = rng.choice(self.hosts)
            self.detections.append(
                Detection(
                    detection_id=f"ldt:{host.device_id}:{i:012d}",
                    severity=rng.choice([20, 40, 50, 70, 90]),
                    tactic=tactic,
                    technique=technique,
                    attack_id=attack_id,
                    device_id=host.device_id,
                    hostname=host.hostname,
                    filename=rng.choice(_FILENAMES),
                    cmdline=f"{rng.choice(_FILENAMES)} -enc {'A' * rng.randint(8, 24)}",
                    status=rng.choice(_STATUSES),
                    timestamp=_iso(now - timedelta(minutes=rng.randint(0, 4320))),
                )
            )

        self.intel: list[IntelIndicator] = [
            IntelIndicator(
                indicator="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                type="hash_sha256",
                malicious_confidence="high",
                threat_types=["Commodity"],
                actors=["WICKED SPIDER"],
                last_updated=_iso(now - timedelta(days=2)),
            ),
            IntelIndicator(
                indicator="malicious-c2.example.net",
                type="domain",
                malicious_confidence="high",
                threat_types=["Targeted"],
                actors=["FANCY BEAR"],
                last_updated=_iso(now - timedelta(days=1)),
            ),
            IntelIndicator(
                indicator="203.0.113.66",
                type="ip_address",
                malicious_confidence="medium",
                threat_types=["Criminal"],
                actors=[],
                last_updated=_iso(now - timedelta(hours=6)),
            ),
        ]

    # ---- detections --------------------------------------------------------

    def search_detections(
        self,
        *,
        attack_id: str | None,
        min_severity: int,
        status: str | None,
        limit: int,
    ) -> list[Detection]:
        out: Iterable[Detection] = self.detections
        out = [d for d in out if d.severity >= min_severity]
        if attack_id:
            out = [d for d in out if d.attack_id == attack_id]
        if status:
            out = [d for d in out if d.status == status]
        ranked = sorted(out, key=lambda d: d.severity, reverse=True)
        return ranked[: max(0, limit)]

    # ---- hosts -------------------------------------------------------------

    def search_hosts(self, *, platform: str | None, limit: int) -> list[Host]:
        out: Iterable[Host] = self.hosts
        if platform:
            out = [h for h in out if h.platform_name.lower() == platform.lower()]
        return list(out)[: max(0, limit)]

    # ---- intel -------------------------------------------------------------

    def search_intel(self, *, indicator_type: str | None, limit: int) -> list[IntelIndicator]:
        out: Iterable[IntelIndicator] = self.intel
        if indicator_type:
            out = [i for i in out if i.type == indicator_type]
        return list(out)[: max(0, limit)]
