/**
 * /rules/prs — Conductor-opened PR queue.
 *
 * Phase 5 reads the local-branch reports the Conductor drops under
 * detections/_meta/conductor_runs/<short_id>/. Each directory is a PR
 * candidate (regardless of whether it was opened on GitHub).
 */

import { promises as fs } from "node:fs";
import path from "node:path";

import { Badge } from "@/components/Badge";
import { Card, CardTitle } from "@/components/Card";

type PRCandidate = {
  short_id: string;
  reasoning: string;
  spl: string;
  fp_report: string;
  report: string;
  rule_path: string | null;
};

export const dynamic = "force-dynamic";

async function loadCandidates(): Promise<PRCandidate[]> {
  const root = path.resolve(process.cwd(), "..", "..", "detections", "_meta", "conductor_runs");
  let entries: string[];
  try {
    entries = await fs.readdir(root);
  } catch {
    return [];
  }
  const out: PRCandidate[] = [];
  for (const dir of entries) {
    const full = path.join(root, dir);
    const stat = await fs.stat(full).catch(() => null);
    if (!stat?.isDirectory()) continue;
    const [reasoning, spl, fp_report, report] = await Promise.all([
      fs.readFile(path.join(full, "reasoning.md"), "utf-8").catch(() => ""),
      fs.readFile(path.join(full, "spl.txt"), "utf-8").catch(() => ""),
      fs.readFile(path.join(full, "fp_report.md"), "utf-8").catch(() => ""),
      fs.readFile(path.join(full, "report.md"), "utf-8").catch(() => ""),
    ]);
    out.push({
      short_id: dir,
      reasoning,
      spl,
      fp_report,
      report,
      rule_path: extractRulePath(report),
    });
  }
  return out.sort((a, b) => a.short_id.localeCompare(b.short_id));
}

function extractRulePath(report: string): string | null {
  const m = report.match(/^`([^`]+\.ya?ml)`\s*$/m);
  return m?.[1] ?? null;
}

export default async function PRQueuePage() {
  const items = await loadCandidates();

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">PR queue</h1>
        <p className="text-sm text-fg-muted">
          Conductor-drafted detections waiting for human merge. The Conductor cannot self-approve —
          every PR needs a reviewer.
        </p>
      </header>

      {items.length === 0 ? (
        <Card>
          <CardTitle>Nothing pending</CardTitle>
          <p className="text-sm text-fg-muted">
            Trigger a closed loop and the Conductor will drop its draft here under{" "}
            <code className="rounded bg-surface-hi px-1 font-mono text-xs">
              detections/_meta/conductor_runs/&lt;id&gt;/
            </code>
            .
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((c) => (
            <Card key={c.short_id}>
              <CardTitle>
                <span className="flex items-center gap-2">
                  <Badge tone="defender">{c.short_id}</Badge>
                  {c.rule_path && <span className="font-mono text-xs">{c.rule_path}</span>}
                </span>
              </CardTitle>

              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-fg-muted">
                    Conductor reasoning
                  </h3>
                  <pre className="overflow-x-auto rounded bg-bg p-3 text-xs whitespace-pre-wrap">
                    {c.reasoning || "(no reasoning recorded)"}
                  </pre>
                </div>
                <div>
                  <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-fg-muted">
                    FP report
                  </h3>
                  <pre className="overflow-x-auto rounded bg-bg p-3 text-xs whitespace-pre-wrap">
                    {c.fp_report || "(no FP report)"}
                  </pre>
                </div>
              </div>

              <div className="mt-3">
                <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-fg-muted">
                  Converted query
                </h3>
                <pre className="overflow-x-auto rounded bg-bg p-3 font-mono text-xs">
                  {c.spl || "(no query rendered)"}
                </pre>
              </div>

              <div className="mt-3 flex items-center gap-2 text-xs">
                <Badge tone="ok">Approve &amp; merge (Phase 6)</Badge>
                <span className="text-fg-muted">
                  Approval mints an X-CatchAttack-Approval-Token; until then merge by running{" "}
                  <code>git push</code> on the Conductor&apos;s branch and opening the PR on GitHub.
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
