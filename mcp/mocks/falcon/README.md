# mcp/mocks/falcon

In-tree mock for the CrowdStrike Falcon MCP. Routed by the CatchAttack
proxy until the operator flips `upstreams.falcon.mode` from `mock` to
`real`. The real surface is the official
[falcon-mcp](https://github.com/CrowdStrike/falcon-mcp) — a modular
server loading the `detections,hosts,intel` modules.

Per BUILD_BRIEF_ADDENDUM.md §B.2: ship a mock with realistic synthetic
data so Phases 1–7 are demoable without commercial credentials.

## Tools

| Tool | Falcon API source-of-truth |
|---|---|
| `search_detections(attack_id?, min_severity=1, status?, limit=20)` | Detects / Alerts API |
| `search_hosts(platform?, limit=50)` | Host management API |
| `search_intel(indicator_type?, limit=50)` | Falcon Intelligence indicators API |
| `push_ioa_rule(name, pattern_severity, cmdline_pattern, platform, dry_run=true)` | Custom IOA rule-groups API |

`push_ioa_rule` is destructive: `dry_run=true` renders the rule-group API
payload without POSTing; the proxy enforces approval-token policy
(`falcon.push_ioa_rule` is in `destructive_tools`).

## Synthetic data

`FalconStore` seeds (deterministic per seed): 12 hosts, 50 detections
across 8 ATT&CK techniques with the Falcon 1–100 severity scale, plus 3
intel indicators. Field shapes follow the Falcon API so a flip to
`falcon-mcp` doesn't ripple into the Conductor.

## Run

```bash
uv run falcon-mock                        # stdio
uv run falcon-mock --transport http --port 9103
```

Proxy wiring (`upstreams.yaml`):

```yaml
falcon:
  mode: "stdio"
  real_cmd: "uv run falcon-mock"
  real_url: "stdio:falcon-mcp --modules detections,hosts,intel"
```

When CrowdStrike credentials arrive, change `real_cmd` to launch the
official `falcon-mcp` and the Conductor/UI are unaware.

## Tests

```bash
cd mcp/mocks/falcon
uv run pytest -q
```

13 tests cover the synthetic store (determinism, severity/technique/
platform filtering) and the MCP surface including the IOA-rule dry-run vs
real path.
