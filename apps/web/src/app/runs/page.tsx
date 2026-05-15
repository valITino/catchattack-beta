/**
 * /runs — workflow run history. Calls the Conductor's /workflows endpoint.
 *
 * The Conductor doesn't currently expose a list endpoint (Phase 5 add).
 * For now we show the workflow registry + an explainer; per-run views live
 * at /runs/[id] and pull from /workflows/runs/{id}.
 */

import { Badge } from "@/components/Badge";
import { Card, CardTitle } from "@/components/Card";
import { listWorkflows } from "@/lib/conductor";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function safeList() {
  try {
    return { items: (await listWorkflows()).items, error: null };
  } catch (err) {
    return {
      items: [] as string[],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export default async function RunsPage() {
  const { items, error } = await safeList();

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Workflow runs</h1>
        <p className="text-sm text-fg-muted">
          History of Conductor runs with live SSE progress. Per-run views live at{" "}
          <code>/runs/&lt;id&gt;</code>.
        </p>
      </header>

      {error ? (
        <Card>
          <CardTitle>Conductor unreachable</CardTitle>
          <p className="text-sm text-fg-muted">
            {error}. Start it with{" "}
            <code className="rounded bg-surface-hi px-1 font-mono text-xs">
              uv run conductor --port 7200
            </code>
            .
          </p>
        </Card>
      ) : (
        <Card>
          <CardTitle>Registered workflows</CardTitle>
          <ul className="space-y-2">
            {items.map((w) => (
              <li
                key={w}
                className="flex items-center justify-between gap-3 rounded border border-border bg-surface-hi/40 px-3 py-2 text-sm"
              >
                <span className="font-mono">{w}</span>
                <Badge tone="defender">trigger via API</Badge>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-fg-muted">
            POST <code>/workflows/&lt;name&gt;/run</code> with <code>{"{ inputs: { ... } }"}</code>{" "}
            and watch <code>/workflows/runs/&lt;id&gt;/sse</code>.
          </p>
        </Card>
      )}

      <Card>
        <CardTitle>What live progress looks like</CardTitle>
        <p className="text-sm text-fg-muted">
          Open{" "}
          <Link href="/runs/example" className="text-defender-hi underline">
            /runs/example
          </Link>{" "}
          to render an SSE-driven step list against a real run.
        </p>
      </Card>
    </div>
  );
}
