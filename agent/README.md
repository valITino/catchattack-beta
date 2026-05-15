# agent/

Cross-platform Go endpoint agent for CatchAttack.

## Sub-commands

```
agent enroll --server <url> --token <one-time>
agent run
agent inventory
agent atomic --technique T1059.004 --test-number 1 [--dry-run]
agent capture-spawn --output <dir> [--dry-run]
```

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│ agent (Go binary, cross-compiled)                                     │
│                                                                       │
│  cmd/agent           ── cobra entry point                            │
│  internal/inventory  ── host facts via gopsutil + EDR heuristics     │
│  internal/atomic     ── Invoke-AtomicTest / atomic-runner shell-out  │
│  internal/capture    ── per-OS ffmpeg argv (gdigrab / x11grab /      │
│                         avfoundation) + HLS muxer                    │
│  internal/enroll     ── one-time-token → mTLS identity persistence    │
│  internal/gen        ── protoc-generated gRPC stubs (do not edit)    │
└───────────────────────────────┬───────────────────────────────────────┘
                                │  gRPC (mTLS, Phase 4)
                                ▼
                        mcp/agents  →  proxy  →  Conductor / Claude Desktop
```

## Tests

```bash
make test-go           # from repo root
# or
cd agent && go test ./...
```

The agent's tests run without spawning real `ffmpeg` / `atomic-runner` /
`pwsh` — `internal/atomic` and `internal/capture` separate **argv
construction** (pure) from **execution** (shells out). Tests assert on the
argv. `OverrideRun` and `OverrideOS` are the test seams.

## gRPC contract

`proto/agent.proto` defines `catchattack.agent.v1.AgentBridge`:

- `Connect(stream Event) returns (stream Command)` — long-lived bidi stream the agent opens to the bridge.
- `Enroll(EnrollRequest) returns (EnrollResponse)` — one-shot token exchange.

Regenerate Go bindings:

```bash
protoc --proto_path=proto \
  --go_out=internal/gen/agentv1 --go_opt=paths=source_relative \
  --go-grpc_out=internal/gen/agentv1 --go-grpc_opt=paths=source_relative \
  agent.proto
```

The generated files (`agent.pb.go`, `agent_grpc.pb.go`) are checked in so CI
does not need `protoc`.

## Cross-compile

```bash
goreleaser release --snapshot --clean
```

Targets: windows/amd64, linux/amd64, darwin/arm64. mTLS is opt-in; the
runtime client/server bits land in Phase 4. Phase 3 ships argv construction,
inventory collection, and identity persistence.

## Status (Phase 3)

| Subsystem | Status |
|---|---|
| Inventory | working on Linux & macOS; Windows EDR detection via process names |
| Capture argv | working for x11grab, gdigrab, avfoundation |
| Capture spawn | shells out to `ffmpeg` when available; tests skip exec |
| Atomic argv | working for `atomic-runner` (Linux/macOS) + `Invoke-AtomicTest` (Windows) |
| Atomic spawn | shells out; tests inject `OverrideRun` |
| Enrollment persistence | working (writes ca/cert/key/agent_id) |
| Enrollment exchange | `NotYetImplemented` — Phase 4 wires gRPC |
| `agent run` daemon | scaffolded; the actual `Connect` loop lands in Phase 4 |
