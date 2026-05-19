# mcp/

MCP servers we build ourselves. Each subfolder is one server with its own
`pyproject.toml`, strict pydantic inputs (`extra="forbid"`), and a small
amount of business logic.

Official vendor MCPs (Falcon, Sentinel, Splunk-in-Splunk, Google SecOps, S1,
Elastic Agent Builder, Caldera plugin, MITRE ATT&CK, GitHub) are NOT rebuilt
here. They are routed through `mcp-proxy/` per addendum §A.

In-house MCP servers:

| Folder | Purpose | Phase |
|---|---|---|
| `sigma/` | pySigma wrapper: parse, lint, convert, dedupe | 1 |
| `wazuh/` | Wazuh SIEM/XDR: search, rules, deploy, FP estimate | 2 |
| `evidence/` | Capture-bundle manifest + summary + signed-URL fetch | 3 |
| `agents/` | Bridge MCP ↔ Go endpoint-agent gRPC fleet | 3 |
| `stratus/` | Stratus Red Team for cloud TTPs | 7 |

`mocks/` holds synthetic vendor MCPs (see `mcp/mocks/README.md`). Every
server is fronted by `mcp-proxy/` — register it in `upstreams.yaml`
(copied from `mcp-proxy/upstreams.example.yaml`).
