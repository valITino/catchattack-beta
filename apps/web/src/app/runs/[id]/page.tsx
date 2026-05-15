/**
 * /runs/[id] — per-run view with live SSE event tail.
 */

import { Badge } from "@/components/Badge";
import { Card, CardTitle } from "@/components/Card";
import { getRun } from "@/lib/conductor";
import { RunTail } from "./RunTail";

export const dynamic = "force-dynamic";

function statusTone(status: string): "ok" | "warn" | "attacker" | "defender" {
  if (status === "succeeded") return "ok";
  if (status === "running") return "defender";
  if (status === "failed" || status === "aborted") return "attacker";
  return "warn";
}

export default async function RunPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let run: Awaited<ReturnType<typeof getRun>> | null = null;
  let error: string | null = null;
  try {
    run = await getRun(id);
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Run <span className="font-mono text-base">{id}</span>
        </h1>
        {run && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge tone={statusTone(run.status)}>{run.status}</Badge>
            <span className="font-mono text-fg-muted">{run.workflow}</span>
            <span className="text-fg-muted">
              · created {new Date(run.created_at).toLocaleString()}
            </span>
          </div>
        )}
      </header>

      {error && (
        <Card>
          <CardTitle>Conductor unreachable</CardTitle>
          <p className="text-sm text-fg-muted">{error}</p>
        </Card>
      )}

      {run && (
        <>
          <Card>
            <CardTitle>Inputs</CardTitle>
            <pre className="overflow-x-auto rounded bg-bg p-3 text-xs">
              {JSON.stringify(run.inputs, null, 2)}
            </pre>
          </Card>

          <Card>
            <CardTitle>Live progress</CardTitle>
            <RunTail runId={id} initial={run.events} />
          </Card>

          {run.result && (
            <Card>
              <CardTitle>Result</CardTitle>
              <pre className="overflow-x-auto rounded bg-bg p-3 text-xs">
                {JSON.stringify(run.result, null, 2)}
              </pre>
            </Card>
          )}

          {run.error && (
            <Card>
              <CardTitle>Failed at gate</CardTitle>
              <p className="mb-2 font-mono text-sm text-attacker-hi">{run.error.code}</p>
              <p className="text-sm">{run.error.message}</p>
              <pre className="mt-2 overflow-x-auto rounded bg-bg p-3 text-xs">
                {JSON.stringify(run.error.detail, null, 2)}
              </pre>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
