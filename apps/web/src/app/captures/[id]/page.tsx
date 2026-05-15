/**
 * /captures/[id] — SnapAttack-equivalent capture playback.
 *
 * Layout:
 *   ┌──────────────────────────┬─────────────────┐
 *   │  HLS video player        │  Process graph  │
 *   ├──────────────────────────┴─────────────────┤
 *   │  Timeline with marker lanes:                │
 *   │    - video                                  │
 *   │    - atomic steps (red stars)               │
 *   │    - detection hits (blue circles)          │
 *   │    - sysmon / process spawns                │
 *   └─────────────────────────────────────────────┘
 *
 * Phase 5 renders a working timeline + marker overlay. The process graph
 * is a server-side render with the events sorted by parent chain.
 */

import { Badge } from "@/components/Badge";
import { Card, CardTitle } from "@/components/Card";
import { callTool } from "@/lib/mcp";
import { CapturePlayer } from "./CapturePlayer";
import { Timeline } from "./Timeline";

type Marker = {
  t_ms: number;
  kind: string;
  label: string;
  ref?: string | null;
  color?: "red" | "blue" | "neutral" | null;
  filled?: boolean | null;
};

type Bundle = {
  id: string;
  agent_id: string;
  started_at: string;
  ended_at: string;
  trigger: {
    kind: string;
    atomic_technique?: string;
    atomic_test_number?: number;
  };
  artifacts: {
    video_hls?: string | null;
    sysmon_events?: string | null;
    pcap?: string | null;
  };
  markers: Marker[];
  stats: {
    event_count: number;
    duration_ms: number;
    size_bytes: number;
    top_processes: Array<{ name: string; count: number }>;
  };
};

export const dynamic = "force-dynamic";

async function load(id: string) {
  try {
    return {
      bundle: await callTool<Bundle>("evidence.get_capture", {
        capture_id: id,
      }),
      error: null as string | null,
    };
  } catch (err) {
    return {
      bundle: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export default async function CapturePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { bundle, error } = await load(id);

  if (error || !bundle) {
    return (
      <Card>
        <CardTitle>Capture not found</CardTitle>
        <p className="text-sm text-fg-muted">{error ?? "unknown error"}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Capture <span className="font-mono text-base">{bundle.id.slice(0, 8)}</span>
        </h1>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge tone="attacker">{bundle.trigger.kind}</Badge>
          {bundle.trigger.atomic_technique && (
            <Badge tone="neutral">{bundle.trigger.atomic_technique}</Badge>
          )}
          <Badge tone="defender">agent {bundle.agent_id}</Badge>
          <span className="text-fg-muted">
            {new Date(bundle.started_at).toLocaleString()} →{" "}
            {new Date(bundle.ended_at).toLocaleString()}
          </span>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle>Video</CardTitle>
          {bundle.artifacts.video_hls ? (
            <CapturePlayer src={bundle.artifacts.video_hls} />
          ) : (
            <p className="text-sm text-fg-muted">No HLS manifest in this bundle.</p>
          )}
        </Card>

        <Card>
          <CardTitle>Top processes</CardTitle>
          <ul className="space-y-1 text-xs">
            {bundle.stats.top_processes.length === 0 && <li className="text-fg-muted">none</li>}
            {bundle.stats.top_processes.map((p) => (
              <li key={p.name} className="flex items-center justify-between gap-2">
                <span className="font-mono">{p.name}</span>
                <Badge tone="neutral">{p.count}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card>
        <CardTitle>Timeline ({bundle.markers.length} markers)</CardTitle>
        <Timeline markers={bundle.markers} durationMs={bundle.stats.duration_ms} />
      </Card>

      <Card>
        <CardTitle>Stats</CardTitle>
        <dl className="grid grid-cols-3 gap-y-1 text-xs">
          <dt className="text-fg-muted">events</dt>
          <dd className="col-span-2 font-mono">{bundle.stats.event_count}</dd>
          <dt className="text-fg-muted">duration</dt>
          <dd className="col-span-2 font-mono">{(bundle.stats.duration_ms / 1000).toFixed(1)} s</dd>
          <dt className="text-fg-muted">size</dt>
          <dd className="col-span-2 font-mono">
            {(bundle.stats.size_bytes / 1024).toFixed(1)} KiB
          </dd>
        </dl>
      </Card>
    </div>
  );
}
