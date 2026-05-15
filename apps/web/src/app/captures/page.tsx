/**
 * /captures — list of capture bundles. Calls `evidence.list_captures`.
 */

import { Badge } from "@/components/Badge";
import { Card, CardTitle } from "@/components/Card";
import { callTool } from "@/lib/mcp";
import Link from "next/link";

type CaptureItem = {
  id: string;
  agent_id: string;
  started_at: string;
  ended_at: string;
  trigger: {
    kind: string;
    atomic_technique?: string;
    atomic_test_number?: number;
  };
  event_count: number;
};

export const dynamic = "force-dynamic";

async function load() {
  try {
    return {
      data: await callTool<{ items: CaptureItem[]; total: number }>("evidence.list_captures", {
        limit: 50,
      }),
      error: null as string | null,
    };
  } catch (err) {
    return {
      data: { items: [], total: 0 },
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export default async function CapturesPage() {
  const { data, error } = await load();

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Captures</h1>
        <p className="text-sm text-fg-muted">
          Recorded emulations. Each bundle has video, telemetry, markers, and (when present) a
          detection-hit overlay.
        </p>
      </header>

      {error && (
        <Card>
          <CardTitle>Evidence MCP unreachable</CardTitle>
          <p className="text-sm text-fg-muted">{error}</p>
        </Card>
      )}

      {!error && data.items.length === 0 && (
        <Card>
          <CardTitle>No captures yet</CardTitle>
          <p className="text-sm text-fg-muted">
            Trigger the closed loop from the Runs page or via{" "}
            <code>POST /workflows/closed_loop_rule_synthesis/run</code>.
          </p>
        </Card>
      )}

      {data.items.length > 0 && (
        <div className="grid gap-3">
          {data.items.map((c) => (
            <Link
              key={c.id}
              href={{ pathname: `/captures/${c.id}` }}
              className="focus:outline-none"
            >
              <Card className="transition-colors hover:border-fg-muted">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-mono text-sm">{c.id}</h2>
                    <p className="text-xs text-fg-muted">
                      agent {c.agent_id} · {new Date(c.started_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Badge tone="attacker">{c.trigger.kind}</Badge>
                    {c.trigger.atomic_technique && (
                      <Badge tone="neutral">{c.trigger.atomic_technique}</Badge>
                    )}
                    <Badge tone="defender">{c.event_count} events</Badge>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
