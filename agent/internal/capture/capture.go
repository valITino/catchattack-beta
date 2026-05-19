// Package capture builds the platform-appropriate ffmpeg invocation for
// screen capture and (optionally) spawns it.
//
// We don't link against libavcodec directly — `ffmpeg` is a hard dependency
// and we shell out. The args matrix below mirrors BUILD_BRIEF.md Phase 3:
// gdigrab on Windows, x11grab on Linux, avfoundation on macOS.
package capture

import (
	"context"
	"fmt"
	"io"
	"os/exec"
	"path/filepath"
	"runtime"
)

// Spec describes a single capture session.
type Spec struct {
	OutputDir string
	Width     int
	Height    int
	FPS       int
	// Optional override for the platform input format — used in tests.
	OverrideOS string
}

// Defaults match the brief.
const (
	defaultWidth  = 1280
	defaultHeight = 720
	defaultFPS    = 15
	defaultCRF    = "23"
	defaultBitrate = "2M"
)

// FFmpegArgs produces the per-platform ffmpeg argv (excluding the binary
// name itself). Determined entirely by the Spec — pure function, easy to
// unit-test.
//
// Output is HLS segmented to spec.OutputDir/index.m3u8 with 6-second
// segments and a rolling window of 100 segments.
func FFmpegArgs(spec Spec) ([]string, error) {
	if spec.Width <= 0 {
		spec.Width = defaultWidth
	}
	if spec.Height <= 0 {
		spec.Height = defaultHeight
	}
	if spec.FPS <= 0 {
		spec.FPS = defaultFPS
	}
	if spec.OutputDir == "" {
		return nil, fmt.Errorf("OutputDir is required")
	}

	os := spec.OverrideOS
	if os == "" {
		os = runtime.GOOS
	}

	var input []string
	switch os {
	case "windows":
		input = []string{
			"-f", "gdigrab",
			"-framerate", fmt.Sprint(spec.FPS),
			"-i", "desktop",
		}
	case "linux":
		input = []string{
			"-f", "x11grab",
			"-framerate", fmt.Sprint(spec.FPS),
			"-i", ":0.0",
		}
	case "darwin":
		input = []string{
			"-f", "avfoundation",
			"-framerate", fmt.Sprint(spec.FPS),
			"-i", "1:none",
		}
	default:
		return nil, fmt.Errorf("unsupported OS for capture: %s", os)
	}

	manifest := filepath.Join(spec.OutputDir, "index.m3u8")
	out := []string{
		"-y",
		"-loglevel", "error",
	}
	out = append(out, input...)
	out = append(out,
		"-vf", fmt.Sprintf("scale=%d:%d", spec.Width, spec.Height),
		"-c:v", "libx264",
		"-preset", "veryfast",
		"-crf", defaultCRF,
		"-b:v", defaultBitrate,
		"-pix_fmt", "yuv420p",
		"-f", "hls",
		"-hls_time", "6",
		"-hls_list_size", "100",
		"-hls_flags", "append_list+independent_segments",
		"-hls_segment_filename", filepath.Join(spec.OutputDir, "segment_%05d.ts"),
		manifest,
	)
	return out, nil
}

// Spawn executes the ffmpeg pipeline. Blocks until ctx is cancelled or
// ffmpeg exits.
//
// The caller is expected to MkdirAll OutputDir; this function does not, so
// tests that don't intend to touch the filesystem can call FFmpegArgs
// directly.
func Spawn(ctx context.Context, spec Spec, stderr io.Writer) error {
	args, err := FFmpegArgs(spec)
	if err != nil {
		return err
	}
	cmd := exec.CommandContext(ctx, "ffmpeg", args...) //nolint:gosec — args fully constructed above
	cmd.Stderr = stderr
	return cmd.Run()
}
