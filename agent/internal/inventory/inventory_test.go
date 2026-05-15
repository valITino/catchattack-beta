package inventory

import (
	"bytes"
	"context"
	"encoding/json"
	"runtime"
	"testing"
)

func TestCollect_PopulatesBasicHostFacts(t *testing.T) {
	t.Parallel()
	inv, err := Collect(context.Background())
	if err != nil {
		t.Fatalf("Collect returned error: %v", err)
	}
	if inv.Hostname == "" {
		t.Errorf("expected hostname, got empty")
	}
	if inv.OS == "" {
		t.Errorf("expected os, got empty")
	}
	if inv.Arch != runtime.GOARCH {
		t.Errorf("arch = %q, want %q", inv.Arch, runtime.GOARCH)
	}
	if inv.CapturedAt.IsZero() {
		t.Error("captured_at must be set")
	}
}

func TestCollect_ListsAtLeastOwnProcess(t *testing.T) {
	t.Parallel()
	inv, err := Collect(context.Background())
	if err != nil {
		t.Fatalf("Collect returned error: %v", err)
	}
	if len(inv.Processes) == 0 {
		t.Fatal("expected at least one process in the inventory")
	}
}

func TestWriteJSON_RoundTrips(t *testing.T) {
	t.Parallel()
	inv := &Inventory{
		Hostname:    "h",
		OS:          "linux",
		Arch:        "amd64",
		IPAddresses: []string{"10.0.0.1"},
		Processes:   []Process{{PID: 1, Name: "init"}},
		EDR:         EDR{DetectedServices: []string{}},
	}
	var buf bytes.Buffer
	if err := inv.WriteJSON(&buf); err != nil {
		t.Fatalf("WriteJSON: %v", err)
	}
	var round Inventory
	if err := json.Unmarshal(buf.Bytes(), &round); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if round.Hostname != "h" || round.OS != "linux" || round.Processes[0].PID != 1 {
		t.Errorf("round-trip mismatch: %+v", round)
	}
}

func TestDetectEDR_FalconViaProcessName(t *testing.T) {
	t.Parallel()
	got := detectEDR([]Process{
		{Name: "explorer.exe"},
		{Name: "CSFalconService.exe"},
		{Name: "chrome.exe"},
	})
	if !got.Falcon {
		t.Error("expected Falcon=true from CSFalconService.exe")
	}
	if len(got.DetectedServices) != 1 {
		t.Errorf("expected 1 detected service, got %v", got.DetectedServices)
	}
}

func TestDetectEDR_NoFalsePositives(t *testing.T) {
	t.Parallel()
	got := detectEDR([]Process{{Name: "bash"}, {Name: "vim"}})
	if got.Falcon || got.Defender || got.ElasticDefend || got.SentinelOne {
		t.Errorf("unexpected EDR detection: %+v", got)
	}
}
