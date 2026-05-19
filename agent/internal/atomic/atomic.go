// Package atomic shells out to the Atomic Red Team runner.
//
// Windows: pwsh -Command Invoke-AtomicTest <technique> -TestNumbers <n>
// Linux:   atomic-runner <technique> -t <n>
// macOS:   atomic-runner <technique> -t <n>
//
// `--dry-run` does not actually execute the test — it prints the resolved
// argv only. The brief's Phase 3 demo relies on this being the default.
package atomic

import (
	"context"
	"errors"
	"fmt"
	"io"
	"os/exec"
	"regexp"
	"runtime"
)

// Options for Run.
type Options struct {
	Technique  string
	TestNumber int
	DryRun     bool
	Stdout     io.Writer
	Stderr     io.Writer

	// Test overrides — leave zero in production.
	OverrideOS  string
	OverrideRun func(ctx context.Context, name string, args []string, stdout, stderr io.Writer) error
}

var techniqueRE = regexp.MustCompile(`^T\d{4}(\.\d{3})?$`)

// Run validates inputs and dispatches to the platform runner.
func Run(ctx context.Context, opts Options) error {
	if opts.TestNumber < 1 {
		return errors.New("test-number must be >= 1")
	}

	bin, args, err := Argv(opts)
	if err != nil {
		return err
	}

	if opts.DryRun {
		if _, err := fmt.Fprintf(opts.Stdout, "[dry-run] %s %v\n", bin, args); err != nil {
			return err
		}
		return nil
	}

	run := opts.OverrideRun
	if run == nil {
		run = func(ctx context.Context, name string, args []string, stdout, stderr io.Writer) error {
			cmd := exec.CommandContext(ctx, name, args...) //nolint:gosec
			cmd.Stdout = stdout
			cmd.Stderr = stderr
			return cmd.Run()
		}
	}
	return run(ctx, bin, args, opts.Stdout, opts.Stderr)
}

// Argv constructs the platform-appropriate argv for opts.
//
// The technique is validated here, at the construction site, so the value
// interpolated into the Windows `pwsh -Command` string is always a safe
// ATT&CK id regardless of which entry point built the argv.
func Argv(opts Options) (string, []string, error) {
	if !techniqueRE.MatchString(opts.Technique) {
		return "", nil, fmt.Errorf("invalid technique %q (want TNNNN or TNNNN.NNN)", opts.Technique)
	}
	os := opts.OverrideOS
	if os == "" {
		os = runtime.GOOS
	}

	switch os {
	case "windows":
		return "pwsh", []string{
			"-NoProfile",
			"-Command",
			fmt.Sprintf("Invoke-AtomicTest %s -TestNumbers %d", opts.Technique, opts.TestNumber),
		}, nil
	case "linux", "darwin":
		return "atomic-runner", []string{
			opts.Technique,
			"-t", fmt.Sprint(opts.TestNumber),
		}, nil
	default:
		return "", nil, fmt.Errorf("unsupported OS for atomic: %s", os)
	}
}
