/**
 * /captures/live/[run_id] — watch an emulation live (BUILD_BRIEF.md Phase 6).
 *
 * Server component shell: fetches the run record so we know its status,
 * then hands off to the <LiveView> client component which:
 *   - subscribes to the LiveKit room for sub-second video,
 *   - subscribes to the Conductor's marker SSE stream (proxied by the BFF),
 *   - renders an append-only timeline,
 *   - auto-redirects to the recorded run view (/runs/[run_id]) on completion.
 */

import { Badge } from "@/components/Badge";
import { Card, CardTitle } from "@/components/Card";
import { getRun } from "@/lib/conductor";
import { LiveView } from "./LiveView";

export const dynamic = "force-dynamic";

export default async function LiveCapturePage({
  params,
}: {
  params: Promise<{ run_id: string }>;
}) {
  const { run_id } = await params;

  let workflow = "unknown";
  let status = "unknown";
  try {
    const run = await getRun(run_id);
    workflow = run.workflow;
    status = run.status;
  } catch {
    // Conductor unreachable — LiveView still renders its own error state.
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Live <span className="font-mono text-base">{run_id}</span>
        </h1>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge tone="attacker">● LIVE</Badge>
          <span className="font-mono text-fg-muted">{workflow}</span>
          <Badge tone="defender">{status}</Badge>
        </div>
      </header>

      <Card>
        <CardTitle>Emulation feed</CardTitle>
        <LiveView runId={run_id} />
      </Card>
    </div>
  );
}
