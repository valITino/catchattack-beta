// Package enroll exchanges a one-time token for a persistent mTLS identity.
//
// Phase 3 ships the wire shape and the local persistence (ca.pem / cert.pem /
// key.pem under --cert-dir). The actual handshake with the bridge is gRPC,
// but Phase 3 does not yet wire it: invoking `agent enroll` against a real
// server returns NotYetImplemented until Phase 4 starts a real bridge.
//
// The function below is structured so that wiring later means replacing the
// `enrollViaGRPC` stub with a real call — the persistence logic stays.
package enroll

import (
	"context"
	"errors"
	"fmt"
	"os"
	"path/filepath"
)

// Options for Run.
type Options struct {
	ServerAddr string
	Token      string
	CertDir    string

	// Test seam — replaced in tests.
	Exchange func(ctx context.Context, server, token string) (*Identity, error)
}

// Identity is the material a bridge returns on a successful enrollment.
type Identity struct {
	AgentID    string
	CAPEM      []byte
	CertPEM    []byte
	KeyPEM     []byte
	ServerAddr string
}

// Run validates options, exchanges the token, and writes the identity to disk.
func Run(ctx context.Context, opts Options) error {
	if opts.ServerAddr == "" {
		return errors.New("--server is required")
	}
	if opts.Token == "" {
		return errors.New("--token is required")
	}
	if opts.CertDir == "" {
		return errors.New("--cert-dir is required")
	}
	exch := opts.Exchange
	if exch == nil {
		exch = enrollViaGRPC
	}
	id, err := exch(ctx, opts.ServerAddr, opts.Token)
	if err != nil {
		return err
	}
	return Persist(opts.CertDir, id)
}

// Persist writes ca.pem / cert.pem / key.pem under dir with 0600 perms on
// the private key.
func Persist(dir string, id *Identity) error {
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return fmt.Errorf("mkdir %s: %w", dir, err)
	}
	files := []struct {
		path string
		data []byte
		mode os.FileMode
	}{
		{filepath.Join(dir, "ca.pem"), id.CAPEM, 0o644},
		{filepath.Join(dir, "cert.pem"), id.CertPEM, 0o644},
		{filepath.Join(dir, "key.pem"), id.KeyPEM, 0o600},
		{filepath.Join(dir, "agent_id"), []byte(id.AgentID + "\n"), 0o644},
		{filepath.Join(dir, "server"), []byte(id.ServerAddr + "\n"), 0o644},
	}
	for _, f := range files {
		if err := os.WriteFile(f.path, f.data, f.mode); err != nil {
			return fmt.Errorf("write %s: %w", f.path, err)
		}
	}
	return nil
}

// enrollViaGRPC is the production exchange. Wired up in Phase 4.
func enrollViaGRPC(_ context.Context, _, _ string) (*Identity, error) {
	return nil, errors.New("enrollment over gRPC will land in Phase 4 (NotYetImplemented)")
}
