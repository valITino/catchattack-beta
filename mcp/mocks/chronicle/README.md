# mcp/mocks/chronicle

In-tree mock for Google SecOps (Chronicle). Routed by the CatchAttack
proxy until the operator flips `upstreams.chronicle.mode` to the official
`google-secops-mcp` from github.com/google/mcp-security. Addendum §A.1 / §B.2.

## Tools

| Tool | Chronicle source-of-truth |
|---|---|
| `udm_search(udm_query, lookback_hours=24)` | UDM Search API |
| `list_detections(attack_id?, limit=50)` | curated + custom detections |
| `list_rules()` | YARA-L 2.0 rules |
| `deploy_yaral_rule(rule_name, yaral_text, dry_run=true)` | YARA-L rule create |

`deploy_yaral_rule` is destructive: `dry_run=true` renders the rule text
without creating it. Registered in the proxy's `destructive_tools`.

## Run

```bash
uv run chronicle-mock                       # stdio
uv run chronicle-mock --transport http --port 9107
```
