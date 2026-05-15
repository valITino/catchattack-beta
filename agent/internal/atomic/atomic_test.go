package atomic

import (
	"bytes"
	"context"
	"errors"
	"io"
	"strings"
	"testing"
)

func TestArgv_LinuxUsesAtomicRunner(t *testing.T) {
	t.Parallel()
	bin, args, err := Argv(Options{Technique: "T1059.004", TestNumber: 1, OverrideOS: "linux"})
	if err != nil {
		t.Fatalf("unexpected err: %v", err)
	}
	if bin != "atomic-runner" {
		t.Errorf("bin = %q, want atomic-runner", bin)
	}
	want := []string{"T1059.004", "-t", "1"}
	if !equal(args, want) {
		t.Errorf("args = %v, want %v", args, want)
	}
}

func TestArgv_WindowsUsesPwsh(t *testing.T) {
	t.Parallel()
	bin, args, _ := Argv(Options{Technique: "T1059.001", TestNumber: 2, OverrideOS: "windows"})
	if bin != "pwsh" {
		t.Errorf("bin = %q, want pwsh", bin)
	}
	joined := strings.Join(args, " ")
	if !strings.Contains(joined, "Invoke-AtomicTest T1059.001") {
		t.Errorf("expected Invoke-AtomicTest in args, got %v", args)
	}
	if !strings.Contains(joined, "-TestNumbers 2") {
		t.Errorf("expected -TestNumbers 2, got %v", args)
	}
}

func TestRun_DryRunPrintsArgv(t *testing.T) {
	t.Parallel()
	var stdout bytes.Buffer
	err := Run(context.Background(), Options{
		Technique:  "T1059.004",
		TestNumber: 1,
		DryRun:     true,
		Stdout:     &stdout,
		Stderr:     io.Discard,
		OverrideOS: "linux",
	})
	if err != nil {
		t.Fatalf("dry-run returned error: %v", err)
	}
	if !strings.Contains(stdout.String(), "atomic-runner") {
		t.Errorf("dry-run output missing argv: %q", stdout.String())
	}
	if !strings.Contains(stdout.String(), "[dry-run]") {
		t.Errorf("dry-run output missing marker")
	}
}

func TestRun_RealUsesOverrideRunner(t *testing.T) {
	t.Parallel()
	called := false
	err := Run(context.Background(), Options{
		Technique:  "T1059.004",
		TestNumber: 1,
		DryRun:     false,
		OverrideOS: "linux",
		Stdout:     io.Discard,
		Stderr:     io.Discard,
		OverrideRun: func(_ context.Context, name string, args []string, _, _ io.Writer) error {
			called = true
			if name != "atomic-runner" {
				return errors.New("wrong binary: " + name)
			}
			if len(args) != 3 || args[0] != "T1059.004" {
				return errors.New("wrong args")
			}
			return nil
		},
	})
	if err != nil {
		t.Fatalf("Run returned error: %v", err)
	}
	if !called {
		t.Error("override runner was never called")
	}
}

func TestRun_RejectsBadTechnique(t *testing.T) {
	t.Parallel()
	err := Run(context.Background(), Options{
		Technique:  "not-a-technique",
		TestNumber: 1,
		DryRun:     true,
		Stdout:     io.Discard,
		Stderr:     io.Discard,
	})
	if err == nil {
		t.Error("expected error for invalid technique")
	}
}

func TestRun_RejectsNonPositiveTestNumber(t *testing.T) {
	t.Parallel()
	err := Run(context.Background(), Options{
		Technique:  "T1059.004",
		TestNumber: 0,
		DryRun:     true,
		Stdout:     io.Discard,
		Stderr:     io.Discard,
	})
	if err == nil {
		t.Error("expected error for test-number=0")
	}
}

func equal(a, b []string) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}
