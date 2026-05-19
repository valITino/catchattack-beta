// Package livekit publishes the agent's screen-capture track to a LiveKit
// room so the web UI can watch an emulation live (BUILD_BRIEF.md Phase 6).
//
// Naming convention:
//   - room name  = the workflow run_id (one room per closed-loop run)
//   - track name = "screen-<agent_id>"
//
// "One pipeline, both outputs" (per the brief): the agent publishes ONE
// H.264 WebRTC track. LiveKit serves it live to browsers; LiveKit Egress
// records the same room to HLS in object storage. The agent does not
// produce a second encode.
//
// Phase 6 ships the room/track naming, token minting, and the Publisher
// connect/close lifecycle. Frame pumping from ffmpeg into the LiveKit
// track is wired at `Publisher.PublishH264`; running it needs a real
// display + LiveKit server, so it is exercised by the operator, not CI.
package livekit

import (
	"errors"
	"fmt"
	"time"

	"github.com/livekit/protocol/auth"
)

// Config is the agent's LiveKit connection material, read from
// agent/config.toml or the LIVEKIT_* env vars.
type Config struct {
	URL       string // ws(s):// LiveKit signalling URL
	APIKey    string
	APISecret string
	Enabled   bool // feature flag — Phase 3 agents leave this false
}

// Validate returns an error if the config can't be used to connect.
func (c Config) Validate() error {
	if !c.Enabled {
		return errors.New("livekit publishing is disabled (set [livekit].enabled = true)")
	}
	if c.URL == "" {
		return errors.New("livekit URL is required")
	}
	if c.APIKey == "" || c.APISecret == "" {
		return errors.New("livekit API key and secret are required")
	}
	return nil
}

// RoomName maps a workflow run to its LiveKit room. One room per run.
func RoomName(runID string) string {
	return "run-" + runID
}

// TrackName is the published screen-capture track's name.
func TrackName(agentID string) string {
	return "screen-" + agentID
}

const publisherTokenTTL = 6 * time.Hour

// PublisherToken mints a JWT that lets the agent join `RoomName(runID)`
// and publish (only) — it cannot subscribe to other participants.
func PublisherToken(cfg Config, runID, agentID string) (string, error) {
	if err := cfg.Validate(); err != nil {
		return "", err
	}
	canPublish := true
	canSubscribe := false
	at := auth.NewAccessToken(cfg.APIKey, cfg.APISecret).
		SetIdentity(agentID).
		SetName(TrackName(agentID)).
		SetValidFor(publisherTokenTTL).
		SetVideoGrant(&auth.VideoGrant{
			RoomJoin:     true,
			Room:         RoomName(runID),
			CanPublish:   &canPublish,
			CanSubscribe: &canSubscribe,
		})
	jwt, err := at.ToJWT()
	if err != nil {
		return "", fmt.Errorf("mint publisher token: %w", err)
	}
	return jwt, nil
}
