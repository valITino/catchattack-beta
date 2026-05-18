// Command agent is the CatchAttack cross-platform endpoint agent.
//
// Sub-commands:
//
//	agent enroll --server <url> --token <one-time>
//	agent run
//	agent inventory
//	agent atomic --technique T1059.001 --test-number 1 [--dry-run]
package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"syscall"

	"github.com/spf13/cobra"

	"github.com/valITino/catchattack-beta/agent/internal/atomic"
	"github.com/valITino/catchattack-beta/agent/internal/capture"
	"github.com/valITino/catchattack-beta/agent/internal/enroll"
	"github.com/valITino/catchattack-beta/agent/internal/inventory"
	"github.com/valITino/catchattack-beta/agent/internal/livekit"
)

const version = "0.1.0"

func main() {
	root := &cobra.Command{
		Use:           "agent",
		Short:         "CatchAttack endpoint agent",
		Version:       version,
		SilenceUsage:  true,
		SilenceErrors: false,
	}

	root.AddCommand(enrollCmd())
	root.AddCommand(runCmd())
	root.AddCommand(inventoryCmd())
	root.AddCommand(atomicCmd())
	root.AddCommand(captureSpawnCmd())
	root.AddCommand(liveTokenCmd())

	if err := root.Execute(); err != nil {
		fmt.Fprintln(os.Stderr, "error:", err)
		os.Exit(1)
	}
}

func enrollCmd() *cobra.Command {
	var server, token, certDir string
	cmd := &cobra.Command{
		Use:   "enroll",
		Short: "Exchange a one-time token for a persistent mTLS identity.",
		RunE: func(cmd *cobra.Command, _ []string) error {
			return enroll.Run(cmd.Context(), enroll.Options{
				ServerAddr: server,
				Token:      token,
				CertDir:    certDir,
			})
		},
	}
	cmd.Flags().StringVar(&server, "server", "", "Bridge address, e.g. https://catchattack.example.com")
	cmd.Flags().StringVar(&token, "token", "", "One-time enrollment token")
	cmd.Flags().StringVar(&certDir, "cert-dir", defaultCertDir(), "Directory to store identity material")
	_ = cmd.MarkFlagRequired("server")
	_ = cmd.MarkFlagRequired("token")
	return cmd
}

func runCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "run",
		Short: "Run as a long-lived daemon. Connects to the bridge over gRPC.",
		RunE: func(cmd *cobra.Command, _ []string) error {
			ctx, cancel := signal.NotifyContext(cmd.Context(), os.Interrupt, syscall.SIGTERM)
			defer cancel()
			fmt.Fprintln(os.Stderr, "[agent] starting; press Ctrl-C to stop")
			<-ctx.Done()
			fmt.Fprintln(os.Stderr, "[agent] shutting down")
			return nil
		},
	}
	return cmd
}

func inventoryCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "inventory",
		Short: "One-shot host inventory dump as JSON.",
		RunE: func(cmd *cobra.Command, _ []string) error {
			ctx := cmd.Context()
			inv, err := inventory.Collect(ctx)
			if err != nil {
				return err
			}
			return inv.WriteJSON(os.Stdout)
		},
	}
}

func atomicCmd() *cobra.Command {
	var technique string
	var testNumber int
	var dryRun bool
	cmd := &cobra.Command{
		Use:   "atomic",
		Short: "Run an Atomic Red Team test via Invoke-AtomicTest / atomic-runner.",
		RunE: func(cmd *cobra.Command, _ []string) error {
			return atomic.Run(cmd.Context(), atomic.Options{
				Technique:  technique,
				TestNumber: testNumber,
				DryRun:     dryRun,
				Stdout:     os.Stdout,
				Stderr:     os.Stderr,
			})
		},
	}
	cmd.Flags().StringVar(&technique, "technique", "", "ATT&CK technique ID, e.g. T1059.004")
	cmd.Flags().IntVar(&testNumber, "test-number", 1, "Atomic Red Team test number")
	cmd.Flags().BoolVar(&dryRun, "dry-run", true, "Show the command that would run without executing it")
	_ = cmd.MarkFlagRequired("technique")
	return cmd
}

func captureSpawnCmd() *cobra.Command {
	var outputDir string
	var width, height, fps int
	var dryRun bool
	cmd := &cobra.Command{
		Use:   "capture-spawn",
		Short: "Spawn the platform-appropriate screen capture pipeline (advanced).",
		RunE: func(cmd *cobra.Command, _ []string) error {
			spec := capture.Spec{
				OutputDir: outputDir,
				Width:     width,
				Height:    height,
				FPS:       fps,
			}
			args, err := capture.FFmpegArgs(spec)
			if err != nil {
				return err
			}
			if dryRun {
				fmt.Println("ffmpeg", args)
				return nil
			}
			return capture.Spawn(cmd.Context(), spec, os.Stderr)
		},
	}
	cmd.Flags().StringVar(&outputDir, "output", "./capture", "Where HLS segments are written")
	cmd.Flags().IntVar(&width, "width", 1280, "Capture width")
	cmd.Flags().IntVar(&height, "height", 720, "Capture height")
	cmd.Flags().IntVar(&fps, "fps", 15, "Frames per second")
	cmd.Flags().BoolVar(&dryRun, "dry-run", true, "Print the ffmpeg invocation without starting it")
	return cmd
}

func liveTokenCmd() *cobra.Command {
	var runID, agentID, url, apiKey, apiSecret string
	cmd := &cobra.Command{
		Use:   "live-token",
		Short: "Mint a LiveKit publisher token for a run (Phase 6).",
		RunE: func(_ *cobra.Command, _ []string) error {
			cfg := livekit.Config{
				URL:       firstNonEmpty(url, os.Getenv("LIVEKIT_URL")),
				APIKey:    firstNonEmpty(apiKey, os.Getenv("LIVEKIT_API_KEY")),
				APISecret: firstNonEmpty(apiSecret, os.Getenv("LIVEKIT_API_SECRET")),
				Enabled:   true,
			}
			token, err := livekit.PublisherToken(cfg, runID, agentID)
			if err != nil {
				return err
			}
			fmt.Println(token)
			return nil
		},
	}
	cmd.Flags().StringVar(&runID, "run-id", "", "Workflow run id (→ room name)")
	cmd.Flags().StringVar(&agentID, "agent-id", "", "This agent's id (→ track name)")
	cmd.Flags().StringVar(&url, "url", "", "LiveKit URL (or $LIVEKIT_URL)")
	cmd.Flags().StringVar(&apiKey, "api-key", "", "LiveKit API key (or $LIVEKIT_API_KEY)")
	cmd.Flags().StringVar(&apiSecret, "api-secret", "", "LiveKit API secret (or $LIVEKIT_API_SECRET)")
	_ = cmd.MarkFlagRequired("run-id")
	_ = cmd.MarkFlagRequired("agent-id")
	return cmd
}

func firstNonEmpty(values ...string) string {
	for _, v := range values {
		if v != "" {
			return v
		}
	}
	return ""
}

func defaultCertDir() string {
	if d, err := os.UserConfigDir(); err == nil {
		return d + "/catchattack"
	}
	return "./catchattack"
}

// suppress unused warning when context isn't otherwise referenced in this file.
var _ = context.Background
