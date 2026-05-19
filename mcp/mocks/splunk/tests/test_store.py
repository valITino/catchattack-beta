from __future__ import annotations

from datetime import UTC, datetime, timedelta

import pytest
from splunk_mock.store import SplunkStore


def test_store_is_deterministic_for_a_given_seed() -> None:
    a = SplunkStore(seed=123, history_days=2)
    b = SplunkStore(seed=123, history_days=2)
    assert len(a._events) == len(b._events)
    assert [e["raw"] for e in a._events[:5]] == [e["raw"] for e in b._events[:5]]


def test_search_returns_aggregated_rollup(store: SplunkStore) -> None:
    earliest = (datetime.now(tz=UTC) - timedelta(days=2)).isoformat()
    latest = datetime.now(tz=UTC).isoformat()
    result = store.search("EncodedCommand", earliest=earliest, latest=latest, max_results=10)
    assert result.count >= 0
    assert len(result.samples) <= 10
    assert result.truncated == (result.count > len(result.samples))


def test_search_filters_by_time_range(store: SplunkStore) -> None:
    # Window that should be entirely in the future → zero hits.
    earliest = (datetime.now(tz=UTC) + timedelta(days=10)).isoformat()
    latest = (datetime.now(tz=UTC) + timedelta(days=11)).isoformat()
    result = store.search("powershell", earliest=earliest, latest=latest, max_results=10)
    assert result.count == 0


def test_list_saved_searches_seeded_with_50(store: SplunkStore) -> None:
    items = store.list_saved_searches(app="search")
    assert len(items) == 50
    assert all(s.app == "search" for s in items)


def test_deploy_rule_dry_run_does_not_persist(store: SplunkStore) -> None:
    before = len(store.list_saved_searches(app="search"))
    stanza, ss = store.deploy_rule(
        name="test_rule_dryrun",
        spl='search index=test "powershell"',
        schedule="*/15 * * * *",
        index_target="test",
        dry_run=True,
    )
    assert ss is None
    assert "[test_rule_dryrun]" in stanza
    assert "cron_schedule = */15 * * * *" in stanza
    assert len(store.list_saved_searches(app="search")) == before


def test_deploy_rule_real_persists(store: SplunkStore) -> None:
    before = len(store.list_saved_searches(app="search"))
    _, ss = store.deploy_rule(
        name="test_rule_real",
        spl='search index=test "powershell"',
        schedule="*/15 * * * *",
        index_target="test",
        dry_run=False,
    )
    assert ss is not None
    assert ss.name == "test_rule_real"
    assert ss.search == 'search index=test "powershell"'
    assert len(store.list_saved_searches(app="search")) == before + 1


def test_estimate_fp_rate_returns_verdict(store: SplunkStore) -> None:
    report = store.estimate_fp_rate("git pull origin main", lookback_days=3)
    # 'git pull' is a benign fragment that appears regularly → at least
    # some hits, but the verdict is bounded.
    assert report.lookback_days == 3
    assert report.verdict in {"low", "medium", "high"}
    assert sum(b.hits for b in report.hits_per_day) == report.total_hits


def test_estimate_fp_rate_rare_pattern_is_low(store: SplunkStore) -> None:
    report = store.estimate_fp_rate("zzz_this_does_not_exist_xyz", lookback_days=3)
    assert report.total_hits == 0
    assert report.verdict == "low"


def test_search_invalid_time_raises_value_error(store: SplunkStore) -> None:
    with pytest.raises(ValueError, match="ISO8601"):
        store.search("anything", earliest="not-a-date", latest="also-not", max_results=10)
