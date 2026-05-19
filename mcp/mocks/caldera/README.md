# mcp/mocks/caldera

In-tree mock for MITRE CALDERA. Routed by the CatchAttack proxy until the
operator flips `upstreams.caldera.mode` to the official CALDERA MCP
plugin (github.com/mitre/mcp) running inside Caldera 5.x. Addendum §A.1 / §B.2.

Caldera is an **emulation source** — the cloud/host-agnostic counterpart
to `mcp/agents` (endpoint Atomic tests) and `mcp/stratus` (cloud TTPs).

## Tools

| Tool | CALDERA source-of-truth |
|---|---|
| `list_abilities(tactic?, technique_id?)` | abilities catalogue |
| `list_operations()` | operations API |
| `create_operation(name, adversary, ability_ids?, dry_run=true)` | operation create |
| `run_ability(ability_id, dry_run=true)` | link execution |

`create_operation` and `run_ability` execute adversary emulation —
`dry_run=true` previews. Both registered in the proxy's
`destructive_tools`.

## Run

```bash
uv run caldera-mock                       # stdio
uv run caldera-mock --transport http --port 9110
```
