# mcp/agents

Bridge MCP between the proxy and the Go endpoint-agent fleet.

## Tools

| Tool | Notes |
|---|---|
| `list_agents()` | Connected agents + status. |
| `get_inventory(agent_id)` | Last captured inventory snapshot. |
| `run_atomic(agent_id, technique, test_number, dry_run=true)` | Destructive — proxy enforces approval + lab-allowlist. |
| `start_capture(agent_id, capture_id?)` | Destructive. |
| `stop_capture(capture_id)` | Destructive. |

## Transports

Two implementations of `AgentTransport`:

- **InMemoryAgentTransport** (Phase 3 default): seeded with `lab-linux-01`
  and `lab-win-01`. Used in tests and for offline demos.
- **GRPCAgentTransport** (Phase 4): wires to the
  `catchattack.agent.v1.AgentBridge` gRPC service backed by the Go agent's
  long-lived `Connect` stream.

Toggle with `--mode memory|grpc` or `AGENTS_TRANSPORT=...`.

## Run

```bash
# stdio (Claude Desktop or proxy via stdio)
uv run agents-mcp

# streamable-HTTP
uv run agents-mcp --transport http --port 9103

# Phase 4 live mode (NotYetImplemented in Phase 3 — returns clear error)
uv run agents-mcp --mode grpc --grpc-bind 0.0.0.0:50051
```

## Proxy wiring

```yaml
# mcp-proxy/upstreams.yaml
agents:
  mode: "stdio"
  real_cmd: "uv run agents-mcp"
```

Destructive tools are registered in the proxy's `destructive_tools` list:
- `agents.run_atomic`
- `agents.start_capture`
- `agents.stop_capture`

With per-tool target allowlist on `agents.run_atomic.agent_id` keyed to the
two seeded lab agents.
