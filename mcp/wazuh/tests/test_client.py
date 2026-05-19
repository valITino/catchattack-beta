from __future__ import annotations

from wazuh_mcp.client import (
    WazuhClient,
    summarise_fp,
    summarise_hits,
)


async def test_authenticate_caches_token(client: WazuhClient) -> None:
    # First call triggers auth.
    raw = await client.list_rules()
    assert raw["data"]["total_affected_items"] == 2
    # Second call should reuse cached token (still works against mock).
    raw2 = await client.list_rules(group="windows")
    assert raw2["data"]["total_affected_items"] == 2
    await client.aclose()


async def test_search_alerts_returns_indexer_payload(client: WazuhClient) -> None:
    raw = await client.search_alerts(
        query="powershell",
        earliest="2026-05-12T00:00:00Z",
        latest="2026-05-13T00:00:00Z",
        size=10,
    )
    assert raw["hits"]["total"]["value"] == 2
    summary = summarise_hits(
        raw,
        query="powershell",
        earliest="2026-05-12T00:00:00Z",
        latest="2026-05-13T00:00:00Z",
    )
    assert summary["total_hits"] == 2
    assert summary["top_agents"][0][0] == "lab-win-01"
    assert summary["top_rule_ids"][0][0] == "100100"
    assert len(summary["samples"]) == 2
    await client.aclose()


async def test_count_by_day_via_aggregations(client: WazuhClient) -> None:
    raw = await client.count_by_day(query="powershell", lookback_days=3)
    report = summarise_fp(raw, query="powershell", lookback_days=3)
    assert report["total_hits"] == 4 + 3 + 5
    assert report["unique_agents"] == 3
    assert report["verdict"] in {"low", "medium", "high"}
    assert len(report["hits_per_day"]) == 3
    await client.aclose()


async def test_upload_rule_file_round_trips(client: WazuhClient) -> None:
    xml = (
        '<group name="test">'
        '<rule id="100100" level="10">'
        "<match>x</match>"
        "<description>x</description>"
        "</rule>"
        "</group>"
    )
    resp = await client.upload_rule_file(filename="local_rules.xml", content=xml)
    assert resp["error"] == 0
    await client.aclose()


def test_summarise_hits_handles_empty_payload() -> None:
    summary = summarise_hits(
        {"hits": {"total": {"value": 0}, "hits": []}},
        query="nothing",
        earliest="x",
        latest="y",
    )
    assert summary["total_hits"] == 0
    assert summary["samples"] == []
    assert summary["truncated"] is False


def test_summarise_fp_handles_no_buckets() -> None:
    report = summarise_fp(
        {"aggregations": {"per_day": {"buckets": []}, "agents": {"value": 0}}},
        query="x",
        lookback_days=7,
    )
    assert report["total_hits"] == 0
    assert report["p95_hits_per_day"] == 0
    assert report["verdict"] == "low"
