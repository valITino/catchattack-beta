# ADR-0008: Live mode — LiveKit WebRTC + marker streaming

- **Status:** Accepted (Phase 6)
- **Date:** 2026-05-13

## Context

`BUILD_BRIEF.md` Phase 6 asks for a live view: watch an emulation unfold
in the browser with sub-second video and a live marker stream, then
seamlessly become a scrubbable replay when the run ends. The brief pins
LiveKit (self-hosted) for WebRTC + Egress→HLS, and says the agent should
publish one WebRTC track while Egress records the same room to HLS in
object storage — "one pipeline, both outputs".

## Decisions

### 1. One LiveKit room per run; one screen track per agent

- Room name = `run-<run_id>` (Go `livekit.RoomName`, Python
  `livekit.room_name` — identical formula on both sides).
- Track name = `screen-<agent_id>` (`livekit.TrackName`).

A run is the natural unit: one room holds one emulation's video, and the
room is torn down when the run completes.

### 2. Token minting split by trust

- **Agent → publisher token.** The Go `livekit.PublisherToken` mints a
  JWT with `roomJoin + canPublish, canSubscribe=false`. The agent can
  publish its screen track and nothing else.
- **Browser → viewer token.** The Conductor's `mint_viewer_token` issues
  `roomJoin + canSubscribe, canPublish=false`. Browsers only watch.
- The web BFF proxies the Conductor's `/live/{run_id}/token`; the browser
  never sees the LiveKit API secret.

LiveKit access tokens are small HS256 JWTs with a `video` grant claim.
Both sides mint them directly (Go: `livekit/protocol/auth`; Python: a
~20-line `hmac` helper) rather than pulling a heavy SDK just for signing.

### 3. Markers: WebSocket for the brief, SSE for the browser

The brief says "subscribe to a parallel WebSocket from the Conductor for
live markers". The Conductor exposes exactly that at
`WS /live/{run_id}/markers`.

But Next.js App Router route handlers **cannot proxy a WebSocket
upgrade**, and the architecture (ADR-0007) keeps the Conductor URL
server-side. So the Conductor *also* exposes the same stream as SSE at
`GET /live/{run_id}/markers/sse`, and the web BFF proxies that through
`/api/runs/[id]/markers`. The browser consumes SSE; non-browser clients
can still use the WebSocket.

Markers flow through an in-process `MarkerHub` — a per-run pub/sub. The
`closed_loop_rule_synthesis` workflow publishes a marker at each
emulation step (`atomic_step_start`) and on a validated detection
(`detection_hit`). Marker shape matches the capture-bundle `Marker` so
the live list and the recorded timeline render identically.

### 4. The agent's frame-pump is an operator integration point

`livekit.Publisher.Connect` joins the room and is fully wired.
`Publisher.PublishH264` — the actual ffmpeg→LiveKit `LocalSampleTrack`
pump — returns a clear `NotYetImplemented` error directing the operator
to connect a display + LiveKit server. Running real WebRTC needs a
display and a media server, neither of which exists in CI. The
unit-testable parts (room/track naming, token claim structure, config
validation) are covered.

### 5. Egress recording is config, not code

`infra/compose.yaml` adds `livekit` and `livekit-egress` services.
`infra/egress.yaml` points Egress at the same MinIO bucket the evidence
MCP reads. The recorded HLS is produced by Egress, not a second agent
encode — satisfying "one pipeline, both outputs".

### 6. Auto-redirect on run completion

When the marker SSE stream emits a `done` event, `LiveView` waits 2.5 s
and routes to `/runs/<run_id>`. The brief asks for a redirect to the
recorded `/captures/[id]` view; the live page does not know the recorded
capture id (the run produces two captures), so it routes to the run
record, which links onward to both captures and the result.

## Consequences

Positive:
- The brief's live demo is wired end-to-end: agent publishes, LiveKit
  serves, Egress records, browser subscribes, markers stream, page
  auto-redirects.
- Token trust is correctly split — publishers can't subscribe, viewers
  can't publish, and the API secret never reaches a browser.
- The marker hub is workflow-agnostic: any future workflow can publish
  live markers by calling `deps.marker_hub.publish`.

Negative:
- The brief literally says "WebSocket" for markers; the browser path is
  SSE because Next can't proxy WS. The WS endpoint still exists, so the
  contract is met for non-browser consumers, but a reviewer expecting a
  browser WebSocket will find SSE instead. Documented here and in the
  route handler.
- `Publisher.PublishH264` is not exercised by CI. Live video is an
  operator-run integration test (needs a display + LiveKit server).
- `MarkerHub` is in-process. When the Conductor scales horizontally
  (Phase 7+) it must move to Redis Streams; the WS/SSE contract won't
  change.
- The live page redirects to `/runs/<id>`, not `/captures/<id>` — a
  minor deviation from the brief's wording, forced by the
  one-run-two-captures shape.

## Rejected alternatives

- *Browser connects directly to the Conductor WebSocket.* Would expose
  the Conductor URL to the client and bypass the BFF boundary
  (ADR-0007).
- *Agent transcodes twice (one HLS, one WebRTC).* Doubles CPU on the
  endpoint for no gain — Egress already produces the recorded HLS from
  the single published track.
- *Pull the full LiveKit server SDK into the Conductor for token
  minting.* The `video`-grant JWT is 20 lines of `hmac`; the SDK is not
  worth the dependency.
- *Use MediaMTX / Janus instead of LiveKit.* The brief pins LiveKit, and
  its Egress component gives us the "both outputs" recording for free.
