# mcp/mocks/elastic

In-tree mock for Elastic Security. Routed by the CatchAttack proxy until
the operator flips `upstreams.elastic.mode` to the **Elastic Agent
Builder MCP endpoint** built into Kibana 9.2.0+ (the standalone
`elastic/mcp-server-elasticsearch` repo is deprecated — addendum §A.1).

## Tools

| Tool | Elastic source-of-truth |
|---|---|
| `esql_query(esql, lookback_hours=24)` | ES\|QL |
| `list_detection_rules(attack_id?, limit=50)` | Kibana Detection Engine rules API |
| `deploy_detection_rule(name, query, rule_type, risk_score, dry_run=true)` | Detection Engine rule create |

`deploy_detection_rule` is destructive: `dry_run=true` renders the rule
payload without creating it. Registered in the proxy's
`destructive_tools`.

## Run

```bash
uv run elastic-mock                       # stdio
uv run elastic-mock --transport http --port 9109
```
