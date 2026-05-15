// Package inventory collects host facts that the bridge expects in EnrollRequest
// and EventInventory. The implementation is cross-platform via gopsutil with
// fallbacks for fields gopsutil doesn't expose uniformly.
package inventory

import (
	"context"
	"encoding/json"
	"io"
	"net"
	"os"
	"runtime"
	"strings"
	"time"

	"github.com/shirou/gopsutil/v4/host"
	"github.com/shirou/gopsutil/v4/process"
)

// Inventory is the JSON shape produced by `agent inventory` and the payload
// that EnrollRequest.inventory wraps.
type Inventory struct {
	Hostname    string    `json:"hostname"`
	OS          string    `json:"os"`
	OSVersion   string    `json:"os_version"`
	Arch        string    `json:"arch"`
	IPAddresses []string  `json:"ip_addresses"`
	Processes   []Process `json:"processes"`
	EDR         EDR       `json:"edr"`
	CapturedAt  time.Time `json:"captured_at"`
}

type Process struct {
	PID     int32  `json:"pid"`
	PPID    int32  `json:"ppid"`
	Name    string `json:"name"`
	Cmdline string `json:"cmdline"`
	User    string `json:"user"`
}

type EDR struct {
	Falcon           bool     `json:"falcon"`
	Defender         bool     `json:"defender"`
	ElasticDefend    bool     `json:"elastic_defend"`
	SentinelOne      bool     `json:"sentinelone"`
	DetectedServices []string `json:"detected_services"`
}

// Collect gathers the inventory. Cancellable via ctx.
func Collect(ctx context.Context) (*Inventory, error) {
	inv := &Inventory{
		Arch:       runtime.GOARCH,
		OS:         runtime.GOOS,
		CapturedAt: time.Now().UTC(),
		Processes:  []Process{},
	}

	if hn, err := os.Hostname(); err == nil {
		inv.Hostname = hn
	}

	if info, err := host.InfoWithContext(ctx); err == nil {
		inv.OSVersion = strings.TrimSpace(info.PlatformVersion)
		if info.Platform != "" {
			inv.OS = info.Platform
		}
	}

	inv.IPAddresses = nonLoopbackAddresses()

	inv.Processes = listProcesses(ctx)
	inv.EDR = detectEDR(inv.Processes)

	return inv, nil
}

// WriteJSON emits the inventory as pretty JSON.
func (i *Inventory) WriteJSON(w io.Writer) error {
	enc := json.NewEncoder(w)
	enc.SetIndent("", "  ")
	return enc.Encode(i)
}

func nonLoopbackAddresses() []string {
	addrs, err := net.InterfaceAddrs()
	if err != nil {
		return nil
	}
	out := make([]string, 0, len(addrs))
	for _, a := range addrs {
		ipnet, ok := a.(*net.IPNet)
		if !ok || ipnet.IP.IsLoopback() {
			continue
		}
		// Only IPv4 + global-unicast IPv6 — skip link-locals.
		if ipnet.IP.IsLinkLocalUnicast() || ipnet.IP.IsLinkLocalMulticast() {
			continue
		}
		out = append(out, ipnet.IP.String())
	}
	return out
}

func listProcesses(ctx context.Context) []Process {
	procs, err := process.ProcessesWithContext(ctx)
	if err != nil {
		return nil
	}
	out := make([]Process, 0, len(procs))
	for _, p := range procs {
		// Use background ctx for per-process accessors — gopsutil's
		// per-process ctx-aware accessors are unevenly supported.
		name, _ := p.Name()
		cmd, _ := p.Cmdline()
		ppid, _ := p.Ppid()
		user, _ := p.Username()
		out = append(out, Process{
			PID:     p.Pid,
			PPID:    ppid,
			Name:    name,
			Cmdline: cmd,
			User:    user,
		})
	}
	return out
}

// detectEDR is a best-effort heuristic over process names. It is intentionally
// conservative — false negatives are preferred over false positives because
// downstream EDR-aware logic only enables when we're sure.
func detectEDR(procs []Process) EDR {
	hits := EDR{DetectedServices: []string{}}
	for _, p := range procs {
		name := strings.ToLower(p.Name)
		switch {
		case strings.Contains(name, "csagent") || strings.Contains(name, "csfalconservice") || strings.Contains(name, "falcon-sensor"):
			hits.Falcon = true
			hits.DetectedServices = append(hits.DetectedServices, p.Name)
		case strings.Contains(name, "msmpeng") || strings.Contains(name, "windefend"):
			hits.Defender = true
			hits.DetectedServices = append(hits.DetectedServices, p.Name)
		case strings.Contains(name, "elastic-endpoint") || strings.Contains(name, "elastic-agent"):
			hits.ElasticDefend = true
			hits.DetectedServices = append(hits.DetectedServices, p.Name)
		case strings.Contains(name, "sentinelagent") || strings.Contains(name, "s1agent"):
			hits.SentinelOne = true
			hits.DetectedServices = append(hits.DetectedServices, p.Name)
		}
	}
	return hits
}
