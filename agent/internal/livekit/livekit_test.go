package livekit

import (
	"encoding/base64"
	"encoding/json"
	"strings"
	"testing"
)

func testConfig() Config {
	return Config{
		URL:       "ws://livekit.test:7880",
		APIKey:    "devkey",
		APISecret: "devsecretdevsecretdevsecret012345",
		Enabled:   true,
	}
}

func TestRoomName(t *testing.T) {
	t.Parallel()
	if got := RoomName("abc-123"); got != "run-abc-123" {
		t.Errorf("RoomName = %q, want run-abc-123", got)
	}
}

func TestTrackName(t *testing.T) {
	t.Parallel()
	if got := TrackName("lab-win-01"); got != "screen-lab-win-01" {
		t.Errorf("TrackName = %q, want screen-lab-win-01", got)
	}
}

func TestValidate_RejectsDisabled(t *testing.T) {
	t.Parallel()
	cfg := testConfig()
	cfg.Enabled = false
	if err := cfg.Validate(); err == nil {
		t.Error("expected error when livekit is disabled")
	}
}

func TestValidate_RequiresURLAndCreds(t *testing.T) {
	t.Parallel()
	for _, tc := range []struct {
		name   string
		mutate func(*Config)
	}{
		{"no url", func(c *Config) { c.URL = "" }},
		{"no key", func(c *Config) { c.APIKey = "" }},
		{"no secret", func(c *Config) { c.APISecret = "" }},
	} {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			cfg := testConfig()
			tc.mutate(&cfg)
			if err := cfg.Validate(); err == nil {
				t.Errorf("%s: expected validation error", tc.name)
			}
		})
	}
}

func TestPublisherToken_EmbedsRoomAndPublishGrant(t *testing.T) {
	t.Parallel()
	jwt, err := PublisherToken(testConfig(), "run-xyz", "lab-win-01")
	if err != nil {
		t.Fatalf("PublisherToken: %v", err)
	}
	claims := decodeClaims(t, jwt)

	// LiveKit nests grants under the "video" claim.
	video, ok := claims["video"].(map[string]any)
	if !ok {
		t.Fatalf("token has no video grant: %v", claims)
	}
	if video["room"] != "run-run-xyz" {
		t.Errorf("room = %v, want run-run-xyz", video["room"])
	}
	if video["roomJoin"] != true {
		t.Errorf("roomJoin = %v, want true", video["roomJoin"])
	}
	if video["canPublish"] != true {
		t.Errorf("canPublish = %v, want true", video["canPublish"])
	}
	if video["canSubscribe"] != false {
		t.Errorf("canSubscribe = %v, want false (publisher is publish-only)", video["canSubscribe"])
	}
	if claims["sub"] != "lab-win-01" {
		t.Errorf("sub = %v, want lab-win-01", claims["sub"])
	}
}

func TestPublisherToken_RejectsDisabledConfig(t *testing.T) {
	t.Parallel()
	cfg := testConfig()
	cfg.Enabled = false
	if _, err := PublisherToken(cfg, "r", "a"); err == nil {
		t.Error("expected error for disabled config")
	}
}

func decodeClaims(t *testing.T, jwt string) map[string]any {
	t.Helper()
	parts := strings.Split(jwt, ".")
	if len(parts) != 3 {
		t.Fatalf("malformed JWT: %d segments", len(parts))
	}
	payload, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		t.Fatalf("decode payload: %v", err)
	}
	var claims map[string]any
	if err := json.Unmarshal(payload, &claims); err != nil {
		t.Fatalf("unmarshal claims: %v", err)
	}
	return claims
}
