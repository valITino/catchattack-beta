# mcp/mocks/sentinel

In-tree mock for Microsoft Sentinel. Routed by the CatchAttack proxy
until the operator flips `upstreams.sentinel.mode` to the
Microsoft-hosted Sentinel MCP triage collection
(`https://sentinel.microsoft.com/mcp/triage`). Addendum §A.1 / §B.2.

## Tools

| Tool | Sentinel source-of-truth |
|---|---|
| `list_incidents(severity?, status?, limit=50)` | Microsoft.SecurityInsights incidents API |
| `run_kql_hunt(kql, lookback_hours=24)` | Advanced Hunting / KQL |
| `list_analytics_rules()` | `alertRules` API |
| `deploy_analytics_rule(display_name, kql, severity, dry_run=true)` | scheduled `alertRules` ARM template |

`deploy_analytics_rule` is destructive: `dry_run=true` renders the ARM
template without creating the rule. Registered in the proxy's
`destructive_tools`.

## Run

```bash
uv run sentinel-mock                       # stdio
uv run sentinel-mock --transport http --port 9106
```
