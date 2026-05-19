"""Wazuh REST client.

References:
- Wazuh Manager API (port 55000, JWT-auth):
  https://documentation.wazuh.com/current/user-manual/api/reference.html
- Wazuh Indexer search (OpenSearch-compatible, port 9200, basic auth):
  https://documentation.wazuh.com/current/user-manual/wazuh-indexer/

The client is pluggable: the AsyncClient is built once and can be swapped
for an httpx.MockTransport in tests.
"""

from __future__ import annotations

import time
from base64 import b64encode
from collections import Counter
from collections.abc import Mapping
from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta
from typing import Any, cast

import httpx
import structlog

log = structlog.get_logger(__name__)

# Endpoint paths (relative to the configured base URLs).
AUTH_PATH = "/security/user/authenticate"
RULES_PATH = "/rules"
RULES_FILE_PATH = "/rules/files/{filename}"
INDEXER_SEARCH_PATH = "/wazuh-alerts-*/_search"

# FP verdict bands.
FP_LOW_THRESHOLD = 5
FP_MEDIUM_THRESHOLD = 50

DEFAULT_TOKEN_TTL_SECONDS = 850  # Wazuh default is 900 s; refresh slightly early.


@dataclass
class WazuhConfig:
    manager_base_url: str
    indexer_base_url: str
    manager_user: str
    manager_password: str
    indexer_user: str
    indexer_password: str
    verify_tls: bool = True


@dataclass
class _TokenCache:
    token: str | None = None
    expires_at: float = field(default=0.0)


class WazuhClient:
    """Thin async client over Wazuh Manager + Indexer.

    Tests inject `manager_transport` and `indexer_transport` (httpx.MockTransport)
    so no Wazuh container is required.
    """

    def __init__(
        self,
        config: WazuhConfig,
        manager_transport: httpx.AsyncBaseTransport | None = None,
        indexer_transport: httpx.AsyncBaseTransport | None = None,
    ) -> None:
        self._config = config
        self._token = _TokenCache()
        self._manager = httpx.AsyncClient(
            base_url=config.manager_base_url,
            transport=manager_transport,
            timeout=10.0,
            verify=config.verify_tls,
        )
        self._indexer = httpx.AsyncClient(
            base_url=config.indexer_base_url,
            transport=indexer_transport,
            timeout=10.0,
            verify=config.verify_tls,
            auth=(config.indexer_user, config.indexer_password),
        )

    async def aclose(self) -> None:
        await self._manager.aclose()
        await self._indexer.aclose()

    # ---- auth --------------------------------------------------------------

    async def _ensure_token(self) -> str:
        now = time.time()
        if self._token.token and now < self._token.expires_at:
            return self._token.token
        creds = f"{self._config.manager_user}:{self._config.manager_password}"
        headers = {"Authorization": f"Basic {b64encode(creds.encode()).decode()}"}
        resp = await self._manager.post(AUTH_PATH, headers=headers)
        resp.raise_for_status()
        body = resp.json()
        token = (body.get("data") or {}).get("token")
        if not isinstance(token, str):
            raise TypeError(f"unexpected auth response: {body!r}")
        self._token.token = token
        self._token.expires_at = now + DEFAULT_TOKEN_TTL_SECONDS
        return token

    async def _manager_get(
        self, path: str, params: Mapping[str, Any] | None = None
    ) -> dict[str, Any]:
        token = await self._ensure_token()
        resp = await self._manager.get(
            path, params=params, headers={"Authorization": f"Bearer {token}"}
        )
        resp.raise_for_status()
        return cast("dict[str, Any]", resp.json())

    async def _manager_put(self, path: str, content: bytes | str) -> dict[str, Any]:
        token = await self._ensure_token()
        resp = await self._manager.put(
            path,
            content=content,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/octet-stream",
            },
        )
        resp.raise_for_status()
        return cast("dict[str, Any]", resp.json())

    # ---- rules -------------------------------------------------------------

    async def list_rules(
        self, group: str | None = None, level_min: int | None = None, limit: int = 100
    ) -> dict[str, Any]:
        params: dict[str, Any] = {"limit": limit}
        if group:
            params["group"] = group
        if level_min is not None:
            params["q"] = f"level>={level_min}"
        return await self._manager_get(RULES_PATH, params)

    async def upload_rule_file(self, filename: str, content: str) -> dict[str, Any]:
        path = RULES_FILE_PATH.format(filename=filename)
        return await self._manager_put(path, content)

    # ---- indexer -----------------------------------------------------------

    async def search_alerts(
        self,
        query: str,
        earliest: str,
        latest: str,
        size: int = 100,
    ) -> dict[str, Any]:
        body = {
            "size": size,
            "query": {
                "bool": {
                    "must": [{"query_string": {"query": query}}] if query else [],
                    "filter": [
                        {
                            "range": {
                                "@timestamp": {"gte": earliest, "lte": latest},
                            }
                        }
                    ],
                }
            },
            "sort": [{"@timestamp": {"order": "desc"}}],
        }
        resp = await self._indexer.post(INDEXER_SEARCH_PATH, json=body)
        resp.raise_for_status()
        return cast("dict[str, Any]", resp.json())

    async def count_by_day(self, query: str, lookback_days: int) -> dict[str, Any]:
        now = datetime.now(tz=UTC)
        earliest = (now - timedelta(days=lookback_days)).isoformat()
        body = {
            "size": 0,
            "query": {
                "bool": {
                    "must": [{"query_string": {"query": query}}] if query else [],
                    "filter": [
                        {"range": {"@timestamp": {"gte": earliest, "lte": now.isoformat()}}}
                    ],
                }
            },
            "aggs": {
                "per_day": {"date_histogram": {"field": "@timestamp", "calendar_interval": "1d"}},
                "agents": {"cardinality": {"field": "agent.id"}},
            },
        }
        resp = await self._indexer.post(INDEXER_SEARCH_PATH, json=body)
        resp.raise_for_status()
        return cast("dict[str, Any]", resp.json())


# ---------------------------------------------------------------------------
# Helpers that turn raw indexer responses into our SearchSummary / FPReport.
# Kept pure so tests can feed canned dicts.
# ---------------------------------------------------------------------------


def summarise_hits(raw: dict[str, Any], query: str, earliest: str, latest: str) -> dict[str, Any]:
    hits_block = raw.get("hits", {})
    total = hits_block.get("total", {})
    total_hits = total.get("value", 0) if isinstance(total, dict) else int(total or 0)
    items = hits_block.get("hits", [])
    samples = []
    agent_counts: Counter[str] = Counter()
    rule_counts: Counter[str] = Counter()
    for h in items[:10]:
        src = h.get("_source", {})
        rule = src.get("rule") or {}
        agent = src.get("agent") or {}
        agent_name = agent.get("name")
        if agent_name:
            agent_counts[agent_name] += 1
        rid = str(rule.get("id") or "")
        if rid:
            rule_counts[rid] += 1
        samples.append(
            {
                "timestamp": src.get("@timestamp", ""),
                "rule_id": rid,
                "rule_description": str(rule.get("description") or ""),
                "rule_level": int(rule.get("level") or 0),
                "agent_name": agent_name,
                "agent_ip": agent.get("ip"),
                "location": src.get("location"),
                "full_log": str(src.get("full_log") or "")[:500],
            }
        )
    return {
        "query": query,
        "earliest": earliest,
        "latest": latest,
        "total_hits": total_hits,
        "top_agents": agent_counts.most_common(5),
        "top_rule_ids": rule_counts.most_common(5),
        "samples": samples,
        "truncated": total_hits > len(samples),
    }


def summarise_fp(raw: dict[str, Any], query: str, lookback_days: int) -> dict[str, Any]:
    aggs = raw.get("aggregations", {})
    buckets = (aggs.get("per_day") or {}).get("buckets", [])
    by_day = [
        {"date": b.get("key_as_string", "")[:10], "hits": int(b.get("doc_count", 0))}
        for b in buckets
    ]
    total = sum(b["hits"] for b in by_day)
    unique_agents = int((aggs.get("agents") or {}).get("value", 0))
    counts = sorted(b["hits"] for b in by_day)
    if counts:
        idx = max(0, int(0.95 * (len(counts) - 1)))
        p95 = counts[idx]
    else:
        p95 = 0
    verdict = (
        "low" if p95 < FP_LOW_THRESHOLD else ("medium" if p95 < FP_MEDIUM_THRESHOLD else "high")
    )
    return {
        "query": query,
        "lookback_days": lookback_days,
        "total_hits": total,
        "hits_per_day": by_day,
        "unique_agents": unique_agents,
        "p95_hits_per_day": p95,
        "verdict": verdict,
    }
