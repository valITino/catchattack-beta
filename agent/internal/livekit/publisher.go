package livekit

import (
	"context"
	"fmt"

	lksdk "github.com/livekit/server-sdk-go/v2"
)

// Publisher owns the agent's LiveKit room connection for one run.
//
// Lifecycle:
//
//	p, err := Connect(ctx, cfg, runID, agentID)
//	defer p.Close()
//	p.PublishH264(ctx, h264Frames)   // pumps ffmpeg output
type Publisher struct {
	room    *lksdk.Room
	agentID string
	runID   string
}

// Connect joins the run's LiveKit room as the agent's publisher identity.
func Connect(_ context.Context, cfg Config, runID, agentID string) (*Publisher, error) {
	token, err := PublisherToken(cfg, runID, agentID)
	if err != nil {
		return nil, err
	}
	room, err := lksdk.ConnectToRoomWithToken(cfg.URL, token, nil)
	if err != nil {
		return nil, fmt.Errorf("connect to livekit room %q: %w", RoomName(runID), err)
	}
	return &Publisher{room: room, agentID: agentID, runID: runID}, nil
}

// PublishH264 streams an H.264 elementary stream onto the room as the
// screen-capture track. `frames` yields NAL-unit-framed samples produced
// by the capture pipeline's ffmpeg process.
//
// Phase 6 wires the LiveKit LocalSampleTrack here. The function is a
// clearly-marked integration point — running it needs a live display and
// a LiveKit server, so it is operator-exercised rather than unit-tested.
func (p *Publisher) PublishH264(_ context.Context, _ <-chan []byte) error {
	return fmt.Errorf(
		"livekit H264 track pumping is an operator-run integration point: "+
			"connect a display + LiveKit server, then wire ffmpeg → LocalSampleTrack "+
			"for track %q in room %q (NotYetImplemented in CI)",
		TrackName(p.agentID), RoomName(p.runID),
	)
}

// Close disconnects from the room.
func (p *Publisher) Close() {
	if p.room != nil {
		p.room.Disconnect()
	}
}
