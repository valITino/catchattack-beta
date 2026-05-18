from __future__ import annotations

from falcon_mock.store import DETECTION_COUNT, HOST_COUNT, FalconStore


def test_store_is_deterministic() -> None:
    a = FalconStore(seed=7)
    b = FalconStore(seed=7)
    assert [d.detection_id for d in a.detections] == [d.detection_id for d in b.detections]


def test_seeded_cardinality(store: FalconStore) -> None:
    assert len(store.hosts) == HOST_COUNT
    assert len(store.detections) == DETECTION_COUNT


def test_search_detections_filters_by_min_severity(store: FalconStore) -> None:
    hits = store.search_detections(attack_id=None, min_severity=70, status=None, limit=100)
    assert all(d.severity >= 70 for d in hits)
    # Results are severity-ranked, descending.
    severities = [d.severity for d in hits]
    assert severities == sorted(severities, reverse=True)


def test_search_detections_filters_by_attack_id(store: FalconStore) -> None:
    hits = store.search_detections(attack_id="T1059.001", min_severity=1, status=None, limit=100)
    assert all(d.attack_id == "T1059.001" for d in hits)


def test_search_detections_respects_limit(store: FalconStore) -> None:
    hits = store.search_detections(attack_id=None, min_severity=1, status=None, limit=5)
    assert len(hits) == 5


def test_search_hosts_filters_by_platform(store: FalconStore) -> None:
    win = store.search_hosts(platform="Windows", limit=100)
    assert all(h.platform_name == "Windows" for h in win)


def test_search_intel_filters_by_type(store: FalconStore) -> None:
    domains = store.search_intel(indicator_type="domain", limit=100)
    assert all(i.type == "domain" for i in domains)
    assert len(domains) >= 1
