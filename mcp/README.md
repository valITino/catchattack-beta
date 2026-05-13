# mcp/

MCP servers we build ourselves. Each subfolder is one server with its own
`pyproject.toml`, strict JSON Schema inputs (`additionalProperties: false`),
and ≤500 LoC of business logic.

Official vendor MCPs (Falcon, Sentinel, Splunk-in-Splunk, Google SecOps, S1,
Elastic Agent Builder, Caldera plugin, MITRE ATT&CK, GitHub) are NOT rebuilt
here. They are routed through `mcp-proxy/` per addendum §A.

In-house MCP servers (target):

| Folder | Purpose | Phase |
|---|---|---|
| `sigma/` | pySigma wrapper: parse, lint, convert, dedupe | 1 |
| `evidence/` | Capture-bundle manifest + summary + signed-URL fetch | 3 |
| `agents/` | Bridge MCP ↔ Go endpoint-agent gRPC fleet | 3 |
| `stratus/` | Stratus Red Team for cloud TTPs | 7+ |

All other MCP servers are upstream — see `mcp-proxy/upstreams.yaml`.
