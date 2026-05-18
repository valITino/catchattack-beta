# mcp/mocks/sentinelone

In-tree mock for SentinelOne. Routed by the CatchAttack proxy until the
operator flips `upstreams.sentinelone.mode` to the official `purple-mcp`
(github.com/Sentinel-One/purple-mcp). Addendum §A.1 / §B.2.

`purple-mcp` is **read-only** — Purple AI conversational investigation,
PowerQuery, alerts, threats, inventory. This mock exposes no
deploy/destructive tools, matching the real server.

## Tools

| Tool | SentinelOne source-of-truth |
|---|---|
| `powerquery(query, lookback_hours=24)` | Deep Visibility PowerQuery |
| `list_alerts(attack_id?, limit=50)` | Alerts API |
| `list_threats(mitigation_status?)` | Threats API |
| `get_inventory(os_type?)` | Agents inventory API |

## Run

```bash
uv run sentinelone-mock                       # stdio
uv run sentinelone-mock --transport http --port 9108
```
