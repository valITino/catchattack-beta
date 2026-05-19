# mcp/mocks/splunk

In-tree mock for Splunk's MCP surface. Used by the CatchAttack proxy until
the operator flips `upstreams.splunk.mode` from `mock` to `real`. The real
surface is provided by Splunkbase App 7931 (CiscoDevNet/Splunk-MCP-Server-
official), which runs **inside** Splunk on the mgmt port (`8089`) at
`/services/mcp`.

## Tools

| Tool | Splunk REST source-of-truth |
|---|---|
| `search(spl, earliest, latest, max_results=10)` | `/services/search/jobs` |
| `list_saved_searches(app?)` | `/servicesNS/{user}/{app}/saved/searches` |
| `deploy_rule(name, spl, schedule, index_target, app?, dry_run=true)` | POST `/servicesNS/.../saved/searches` |
| `estimate_fp_rate(spl, lookback_days=7)` | search rollup over `lookback_days` |

The mock returns the **same shape** real Splunk would; flipping mock→real
is a config change in `upstreams.yaml`.

## Synthetic data

`SplunkStore` generates a deterministic event stream (seeded; ~500-800
events/day over 7 days × 12 hosts × 4 sourcetypes, 10% attacker-shaped
fragments). 50 saved searches are seeded at startup.

The SPL→regex translator is intentionally small: bare tokens, `field=value`,
`field="quoted value"`. Anything else degrades to substring match. Real
Splunk's parser kicks in when the operator flips mode→real.

## Run

```bash
# stdio (e.g. Claude Desktop)
uv run splunk-mock

# streamable-HTTP for the proxy (mode=http, mock_url=http://localhost:9101)
uv run splunk-mock --transport http --port 9101
```

The proxy entry in `upstreams.example.yaml`:

```yaml
splunk:
  mode: "stdio"
  real_cmd: "uv run splunk-mock"
  real_url: "https://splunk.example.com:8089/services/mcp"
```

When real Splunk credentials arrive, change `mode` to `http` and point
`real_url` at the Splunk mgmt port. The Conductor and UI are unaware.
