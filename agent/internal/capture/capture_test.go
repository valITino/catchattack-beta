package capture

import (
	"slices"
	"strings"
	"testing"
)

func TestFFmpegArgs_LinuxUsesX11Grab(t *testing.T) {
	t.Parallel()
	args, err := FFmpegArgs(Spec{OutputDir: "/tmp/cap", OverrideOS: "linux"})
	if err != nil {
		t.Fatalf("err: %v", err)
	}
	if !sliceContainsPair(args, "-f", "x11grab") {
		t.Errorf("expected -f x11grab, got %v", args)
	}
	if !sliceContains(args, ":0.0") {
		t.Errorf("expected display :0.0, got %v", args)
	}
}

func TestFFmpegArgs_WindowsUsesGDIGrab(t *testing.T) {
	t.Parallel()
	args, _ := FFmpegArgs(Spec{OutputDir: "C:/cap", OverrideOS: "windows"})
	if !sliceContainsPair(args, "-f", "gdigrab") {
		t.Errorf("expected gdigrab, got %v", args)
	}
	if !sliceContains(args, "desktop") {
		t.Errorf("expected desktop input, got %v", args)
	}
}

func TestFFmpegArgs_DarwinUsesAVFoundation(t *testing.T) {
	t.Parallel()
	args, _ := FFmpegArgs(Spec{OutputDir: "/tmp/cap", OverrideOS: "darwin"})
	if !sliceContainsPair(args, "-f", "avfoundation") {
		t.Errorf("expected avfoundation, got %v", args)
	}
}

func TestFFmpegArgs_HLSOutputManifest(t *testing.T) {
	t.Parallel()
	args, _ := FFmpegArgs(Spec{OutputDir: "/tmp/cap", OverrideOS: "linux"})
	if !sliceContainsPair(args, "-f", "hls") {
		t.Errorf("expected HLS muxer, got %v", args)
	}
	last := args[len(args)-1]
	if !strings.HasSuffix(last, "index.m3u8") {
		t.Errorf("last arg should be the HLS manifest, got %q", last)
	}
}

func TestFFmpegArgs_AppliesScale(t *testing.T) {
	t.Parallel()
	args, _ := FFmpegArgs(Spec{OutputDir: "/tmp/cap", OverrideOS: "linux", Width: 640, Height: 360, FPS: 10})
	if !sliceContains(args, "scale=640:360") {
		t.Errorf("expected scale filter, got %v", args)
	}
}

func TestFFmpegArgs_RejectsEmptyOutputDir(t *testing.T) {
	t.Parallel()
	if _, err := FFmpegArgs(Spec{OverrideOS: "linux"}); err == nil {
		t.Error("expected error for empty OutputDir")
	}
}

func TestFFmpegArgs_RejectsUnknownOS(t *testing.T) {
	t.Parallel()
	if _, err := FFmpegArgs(Spec{OutputDir: "/tmp/cap", OverrideOS: "plan9"}); err == nil {
		t.Error("expected error for unknown OS")
	}
}

func TestFFmpegArgs_AppliesDefaultsWhenZero(t *testing.T) {
	t.Parallel()
	args, _ := FFmpegArgs(Spec{OutputDir: "/tmp/cap", OverrideOS: "linux"})
	if !sliceContains(args, "scale=1280:720") {
		t.Errorf("expected default scale, got %v", args)
	}
	if !sliceContainsPair(args, "-framerate", "15") {
		t.Errorf("expected default fps, got %v", args)
	}
}

func sliceContainsPair(a []string, k, v string) bool {
	for i, s := range a {
		if s == k && i+1 < len(a) && a[i+1] == v {
			return true
		}
	}
	return false
}

func sliceContains(a []string, v string) bool {
	return slices.Contains(a, v)
}
