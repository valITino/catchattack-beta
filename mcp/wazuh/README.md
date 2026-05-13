# mcp/wazuh

In-house MCP server for [Wazuh](https://wazuh.com) — the addendum's
no-license SIEM fallback. No official Wazuh MCP exists; this wraps the
Manager REST API (port 55000) and the Wazuh-Indexer's OpenSearch-
compatible search (port 9200).

## Tools

| Tool | Wazuh endpoint |
|---|---|
| `search(query, earliest, latest, max_results=10)` | POST `wazuh-alerts-*/_search` (Indexer) |
| `list_rules(group?, level_min?, limit=100)` | `GET /rules` (Manager) |
| `deploy_rule(filename, spec, dry_run=true)` | PUT `/rules/files/{filename}` (Manager) |
| `estimate_fp_rate(query, lookback_days=7)` | POST `wazuh-alerts-*/_search` with date_histogram |

`spec` is a `WazuhRuleSpec`:

```python
WazuhRuleSpec(
  rule_id=100100,        # local range 100000-199999
  level=10,              # 0-15
  description="…",
  match_text="…",        # OR
  pcre2=r"…",
  groups=["powershell"],
  if_sid=[18100],        # optional parent rule chain
)
```

`deploy_rule` writes XML; **the operator must trigger a manager restart**
after a real deploy to reload the ruleset. The response surfaces
`requires_manager_restart=true` to remind callers.

## Configuration (env vars)

```
WAZUH_MANAGER_URL          e.g. https://wazuh.lab:55000
WAZUH_MANAGER_USER         e.g. wazuh-wui
WAZUH_MANAGER_PASSWORD
WAZUH_INDEXER_URL          e.g. https://wazuh.lab:9200
WAZUH_INDEXER_USER         default 'admin'
WAZUH_INDEXER_PASSWORD
WAZUH_VERIFY_TLS           '1' or '0' (default 1)
```

## Run

```bash
# stdio (e.g. Claude Desktop or the proxy via stdio)
uv run wazuh-mcp

# streamable-HTTP
uv run wazuh-mcp --transport http --port 9102
```

The proxy entry:

```yaml
wazuh:
  mode: "stdio"
  real_cmd: "uv run wazuh-mcp"
```

## Local stack

```bash
docker compose -f infra/compose.yaml up wazuh-indexer wazuh-manager
```

Wazuh certs are self-signed in dev; the client honours `WAZUH_VERIFY_TLS=0`.

## Tests

`httpx.MockTransport` simulates the Manager and Indexer responses so the
tests run offline. See `tests/conftest.py` for the canned payload shapes.

```bash
cd mcp/wazuh
uv run pytest -q
```
