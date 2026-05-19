# ADR-0005: Go endpoint agent + capture-bundle pipeline

- **Status:** Accepted (Phase 3)
- **Date:** 2026-05-13

## Context

Phase 3 of `BUILD_BRIEF.md` ships the first hardware-touching component: a
cross-platform endpoint agent that runs adversary emulations and captures
evidence (video + telemetry + atomic-runner output). The brief specifies Go
1.23+, gRPC over mTLS, ffmpeg-based capture, Atomic Red Team integration, and
goreleaser cross-compilation. The capture-bundle schema is defined in
`BUILD_BRIEF_ADDENDUM.md` §E.

## Decisions

### 1. Pure argv construction separates from execution

`internal/capture.FFmpegArgs()` and `internal/atomic.Argv()` are **pure
functions** taking a `Spec`/`Options` and returning `(binary, args)`. Spawn
helpers (`capture.Spawn`, `atomic.Run`) layer execution on top via
`exec.CommandContext`.

Rationale: lets unit tests assert on argv for all three platforms
(`gdigrab` / `x11grab` / `avfoundation`) and both atomic runners
(`Invoke-AtomicTest` / `atomic-runner`) without spawning the actual binaries
or requiring matching platforms. `OverrideOS` and `OverrideRun` are the test
seams.

### 2. Capture-bundle storage is pluggable, filesystem-first

`mcp/evidence` exposes the addendum's §E.2 tool surface against a
`FilesystemStorage` rooted at `$EVIDENCE_MCP_ROOT`. The directory layout
mirrors the addendum's S3 layout (§E.4) so swapping to `S3Storage`
(MinIO/AWS) in Phase 5 is a single class behind the same interface.

Rationale: filesystem is testable in CI without MinIO; the S3 path is the
operator-facing default in compose.yaml but is opt-in via env. We don't pay
the boto3/min-IO complexity tax until Phase 5 needs it.

### 3. `mcp/agents` transport is pluggable, in-memory by default

`AgentTransport` is a Protocol. `InMemoryAgentTransport.with_seed()`
provides two lab agents (`lab-linux-01`, `lab-win-01`) and works without any
running gRPC server. `GRPCAgentTransport` is a stub that returns
`NotImplementedError` — Phase 4 implements it against the proto in
`agent/proto/agent.proto`.

Rationale: the bridge MCP's tool surface (BUILD_BRIEF.md Phase 3) can be
demoed in Claude Desktop right now without firing up the Go agent.
Conductor workflows in Phase 4 are wired against the same interface, so the
day we flip to gRPC nothing else changes.

### 4. gRPC bidi stream initiated by the agent

`Connect(stream Event) returns (stream Command)` — the agent always opens
the connection. Rationale:

- Firewall convention: agents typically have outbound 443 but not inbound.
- Identity proven by mTLS at handshake; the bridge never has to phone home
  to verify a callback URL.
- Server-side fan-out: the bridge holds a map of `agent_id → send queue`
  and writes Commands from MCP tool calls; the agent's stream consumes them.

### 5. Identity persistence is local files under `--cert-dir`

`enroll.Persist` writes `ca.pem`, `cert.pem`, `key.pem` (0600), `agent_id`,
and `server` under a configurable directory (default
`$XDG_CONFIG_HOME/catchattack`). The exchange function is injectable via
`Options.Exchange` so tests don't talk to a real bridge.

Rationale: Phase 3 lands the wire shape and persistence so Phase 4's gRPC
client only has to fill in the exchange function. No identity rework when
the bridge goes live.

### 6. `protoc`-generated code is committed

`agent/internal/gen/agentv1/agent{,_grpc}.pb.go` are checked in. CI does not
need `protoc` installed; developers who edit `agent.proto` regenerate
locally and commit.

Rationale: keeps CI cheap; matches the convention used by gRPC-Go itself
and the wider Go ecosystem.

## Consequences

Positive:
- The Phase 3 demo works against the in-memory agent transport without
  any real endpoint. The brief's Phase 3 demo string ("List my lab agents.
  Run T1059.001 on lab-win-01...") returns sensible data through every
  tool.
- Tests are fast (~3 s for all of Go + the new Python packages) and run
  on any platform.
- The capture-bundle JSON Schema is the single source of truth; pydantic
  models and (later) TS types are derived from it.

Negative:
- The Go agent's `run` daemon and `enroll` over the network are NYI in
  Phase 3 — they raise clear errors directing to Phase 4. Operators who
  install the agent today get `inventory` and `atomic --dry-run` only.
- The filesystem evidence store doesn't enforce retention/lifecycle
  policy. Production needs S3 with bucket policy as the addendum §E.4
  prescribes — Phase 5 work.
- `protoc`'s generated code is roughly 1300 lines under `internal/gen/`
  in the diff. Acceptable for compile-time stability; documented in the
  README so reviewers know to skip it.

## Rejected alternatives

- *Skip the gRPC contract for Phase 3.* Tempting (REST is simpler), but
  the brief is explicit and bidi-stream + mTLS are the right shape for
  long-lived agent connections. Defining the proto now means Phase 4 only
  wires plumbing.
- *Pull pysigma's Wazuh community backend into the Conductor.* Out of
  scope for Phase 3; rule generation is Phase 4.
- *Use OpenTelemetry trace span IDs as capture/marker IDs.* Adds
  dependency complexity for no near-term win; UUIDv4 (Phase 3) and
  UUIDv7 (Phase 5+ when we want sortable IDs) are sufficient.
- *Embed `ffmpeg` via cgo.* The brief says "shell out"; embedding raises
  licensing and cross-compile pain without any latency win for the HLS
  use case.
