package enroll

import (
	"context"
	"os"
	"path/filepath"
	"testing"
)

func TestRun_PersistsIdentityFromExchange(t *testing.T) {
	t.Parallel()
	dir := t.TempDir()
	id := &Identity{
		AgentID:    "00000000-0000-0000-0000-000000000001",
		CAPEM:      []byte("CA"),
		CertPEM:    []byte("CERT"),
		KeyPEM:     []byte("KEY"),
		ServerAddr: "https://bridge.test",
	}
	err := Run(context.Background(), Options{
		ServerAddr: "https://bridge.test",
		Token:      "t-once",
		CertDir:    dir,
		Exchange: func(_ context.Context, _, _ string) (*Identity, error) {
			return id, nil
		},
	})
	if err != nil {
		t.Fatalf("Run: %v", err)
	}
	for name, expect := range map[string][]byte{
		"ca.pem":   []byte("CA"),
		"cert.pem": []byte("CERT"),
		"key.pem":  []byte("KEY"),
	} {
		data, err := os.ReadFile(filepath.Join(dir, name))
		if err != nil {
			t.Errorf("read %s: %v", name, err)
			continue
		}
		if string(data) != string(expect) {
			t.Errorf("%s: got %q, want %q", name, data, expect)
		}
	}
	keyInfo, err := os.Stat(filepath.Join(dir, "key.pem"))
	if err != nil {
		t.Fatalf("stat key.pem: %v", err)
	}
	if keyInfo.Mode().Perm() != 0o600 {
		t.Errorf("key.pem mode = %v, want 0600", keyInfo.Mode().Perm())
	}
}

func TestRun_RequiresServerAndToken(t *testing.T) {
	t.Parallel()
	for _, tc := range []struct {
		name string
		opts Options
	}{
		{"no server", Options{Token: "t", CertDir: t.TempDir()}},
		{"no token", Options{ServerAddr: "x", CertDir: t.TempDir()}},
		{"no cert dir", Options{ServerAddr: "x", Token: "t"}},
	} {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			if err := Run(context.Background(), tc.opts); err == nil {
				t.Error("expected error")
			}
		})
	}
}

func TestEnrollViaGRPC_PlaceholderStillUnimplemented(t *testing.T) {
	t.Parallel()
	if _, err := enrollViaGRPC(context.Background(), "x", "y"); err == nil {
		t.Error("expected NotYetImplemented; Phase 4 wires this up")
	}
}
