# mcp/stratus

In-house MCP server for [Stratus Red Team](https://github.com/DataDog/stratus-red-team)
— cloud attack-technique emulation for AWS, Azure, GCP, and Kubernetes.

No upstream MCP exists for Stratus (BUILD_BRIEF_ADDENDUM.md §A.2), so we
build it. It is the cloud counterpart to `mcp/agents` (which drives the
endpoint fleet for host TTPs).

## Tools

| Tool | Notes |
|---|---|
| `list_techniques(platform?)` | Read-only. Filter by `aws`/`azure`/`gcp`/`kubernetes`/`entra-id`/`eks`. |
| `get_status(technique_id)` | Read-only. Returns `COLD` / `WARM` / `DETONATED`. |
| `detonate(technique_id, dry_run=true)` | Destructive — mutates live cloud infra. |
| `revert(technique_id, dry_run=true)` | Destructive — undoes the attack, keeps infra `WARM`. |
| `cleanup(technique_id, dry_run=true)` | Destructive — destroys provisioned infra → `COLD`. |

`detonate`/`revert`/`cleanup` default to `dry_run=true`. The MCP proxy
enforces approval-token policy on top — `stratus.detonate`,
`stratus.revert`, and `stratus.cleanup` are in `destructive_tools`.

## Lifecycle

```
COLD ──warm──▶ WARM ──detonate──▶ DETONATED
  ▲             ▲                     │
  └──cleanup────┴──────revert─────────┘
```

`detonate` warms automatically if the technique is `COLD`.

## Runners

`StratusRunner` has two implementations:

- **`InMemoryStratusRunner`** (default, `--mode memory`) — deterministic,
  binary-free, seeded with a representative slice of the Stratus
  catalogue. Used by tests and offline demos.
- **`CLIStratusRunner`** (`--mode cli`) — shells out to the `stratus`
  binary. Phase 7 ships the command mapping; parsing the binary's output
  into structured state is a documented integration point (needs real
  cloud credentials, so CI uses the in-memory runner).

## Run

```bash
uv run stratus-mcp                       # stdio, in-memory runner
uv run stratus-mcp --transport http --port 9105
uv run stratus-mcp --mode cli            # shells out to `stratus`
```

Proxy wiring (`upstreams.yaml`):

```yaml
stratus:
  mode: "stdio"
  real_cmd: "uv run stratus-mcp"
```

## Tests

```bash
cd mcp/stratus
uv run pytest -q
```

12 tests cover the technique catalogue, the full
COLD→DETONATED→WARM→COLD lifecycle, platform filtering, ATT&CK mapping,
and the MCP surface end-to-end.
