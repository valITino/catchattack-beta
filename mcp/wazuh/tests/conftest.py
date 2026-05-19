"""Test scaffolding for the Wazuh MCP.

Tests use httpx.MockTransport to simulate the Wazuh Manager (port 55000) and
Wazuh Indexer (port 9200) without requiring a live container. The mock
transports return realistic response shapes drawn from the Wazuh REST API
docs.
"""

from __future__ import annotations

import json
from typing import Any

import httpx
import pytest
from wazuh_mcp.client import WazuhClient, WazuhConfig


def _manager_handler(request: httpx.Request) -> httpx.Response:
    path = request.url.path
    if path.endswith("/security/user/authenticate"):
        return httpx.Response(200, json={"data": {"token": "TEST_TOKEN_123"}})
    if path == "/rules":
        return httpx.Response(
            200,
            json={
                "data": {
                    "total_affected_items": 2,
                    "affected_items": [
                        {
                            "id": 100100,
                            "level": 10,
                            "description": "PowerShell encoded command",
                            "groups": ["windows", "powershell"],
                            "filename": "local_rules.xml",
                            "status": "enabled",
                        },
                        {
                            "id": 100200,
                            "level": 7,
                            "description": "Bash reverse shell",
                            "groups": ["linux", "shell"],
                            "filename": "local_rules.xml",
                            "status": "enabled",
                        },
                    ],
                }
            },
        )
    if path.startswith("/rules/files/"):
        return httpx.Response(200, json={"message": "Files were updated.", "error": 0})
    return httpx.Response(404, json={"error": "unmocked", "path": path})


def _indexer_handler(request: httpx.Request) -> httpx.Response:
    if request.url.path == "/wazuh-alerts-*/_search":
        body: dict[str, Any] = json.loads(request.content or b"{}")
        if body.get("size") == 0:
            # estimate_fp_rate path: returns aggregations.
            return httpx.Response(
                200,
                json={
                    "hits": {"total": {"value": 12}, "hits": []},
                    "aggregations": {
                        "per_day": {
                            "buckets": [
                                {"key_as_string": "2026-05-10T00:00:00.000Z", "doc_count": 4},
                                {"key_as_string": "2026-05-11T00:00:00.000Z", "doc_count": 3},
                                {"key_as_string": "2026-05-12T00:00:00.000Z", "doc_count": 5},
                            ]
                        },
                        "agents": {"value": 3},
                    },
                },
            )
        # search path: returns hits.
        return httpx.Response(
            200,
            json={
                "hits": {
                    "total": {"value": 2},
                    "hits": [
                        {
                            "_source": {
                                "@timestamp": "2026-05-12T12:34:56Z",
                                "agent": {"id": "001", "name": "lab-win-01", "ip": "10.0.0.5"},
                                "rule": {
                                    "id": 100100,
                                    "level": 10,
                                    "description": "PowerShell encoded command",
                                },
                                "location": "WinEventLog:Sysmon",
                                "full_log": "powershell.exe -EncodedCommand AAA",
                            }
                        },
                        {
                            "_source": {
                                "@timestamp": "2026-05-12T13:00:00Z",
                                "agent": {"id": "001", "name": "lab-win-01", "ip": "10.0.0.5"},
                                "rule": {
                                    "id": 100100,
                                    "level": 10,
                                    "description": "PowerShell encoded command",
                                },
                                "location": "WinEventLog:Sysmon",
                                "full_log": "powershell.exe -enc BBB",
                            }
                        },
                    ],
                }
            },
        )
    return httpx.Response(404, json={"error": "unmocked"})


@pytest.fixture
def wazuh_config() -> WazuhConfig:
    return WazuhConfig(
        manager_base_url="https://wazuh.test:55000",
        indexer_base_url="https://wazuh.test:9200",
        manager_user="wazuh-wui",
        manager_password="secret",
        indexer_user="admin",
        indexer_password="secret",
        verify_tls=False,
    )


@pytest.fixture
def client(wazuh_config: WazuhConfig) -> WazuhClient:
    return WazuhClient(
        config=wazuh_config,
        manager_transport=httpx.MockTransport(_manager_handler),
        indexer_transport=httpx.MockTransport(_indexer_handler),
    )
