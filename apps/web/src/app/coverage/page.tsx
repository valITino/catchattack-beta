/**
 * /coverage — MITRE ATT&CK matrix.
 *
 * Server component: enumerates the seeded TACTICS table and overlays
 * detection-rule counts derived from `detections/`. Cells are coloured by
 * (rules × validated × env_confidence). Hover/click → drill-in (Phase 6).
 */

import { Badge } from "@/components/Badge";
import { Card, CardTitle } from "@/components/Card";
import { type Coverage, TACTICS, loadCoverage } from "@/lib/mitre";

export const dynamic = "force-dynamic";

function cellColour(c?: Coverage): string {
  if (!c || c.rules === 0)
    return "bg-surface-hi/40 text-fg-muted border-border";
  if (c.validated === 0)
    return "bg-warn/20 text-warn border-warn/40";
  if (c.env_confidence >= 0.8)
    return "bg-defender/30 text-defender-hi border-defender/50";
  return "bg-defender/15 text-defender border-defender/30";
}

export default async function CoveragePage() {
  const coverage = await loadCoverage();
  const totalTechniques = TACTICS.reduce(
    (sum, t) => sum + t.techniques.length,
    0,
  );
  const covered = [...coverage.values()].filter((c) => c.rules > 0).length;
  const validated = [...coverage.values()].filter((c) => c.validated > 0)
    .length;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Coverage matrix
        </h1>
        <p className="text-sm text-fg-muted">
          MITRE ATT&CK Enterprise. Cell colour = rule count × validation ×
          env confidence. Empty cells are uncovered.
        </p>
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge tone="defender">{covered} / {totalTechniques} techniques covered</Badge>
          <Badge tone="ok">{validated} validated</Badge>
          <Badge tone="warn">
            {covered - validated} unvalidated
          </Badge>
        </div>
      </header>

      <div className="overflow-x-auto">
        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${TACTICS.length}, minmax(170px, 1fr))`,
          }}
        >
          {TACTICS.map((tactic) => (
            <div key={tactic.id} className="flex flex-col gap-1">
              <Card className="!p-2">
                <h2 className="text-xs font-medium uppercase tracking-wide text-fg-muted">
                  {tactic.name}
                </h2>
                <p className="font-mono text-[10px] text-fg-muted/60">
                  {tactic.id}
                </p>
              </Card>
              {tactic.techniques.map((technique) => {
                const cov = coverage.get(technique.id);
                return (
                  <div
                    key={`${tactic.id}-${technique.id}`}
                    className={`rounded border px-2 py-1.5 text-xs ${cellColour(cov)} ${
                      technique.sub ? "ml-2" : ""
                    }`}
                    title={cov ? `${cov.rules} rule(s), ${cov.validated} validated` : "no detection"}
                  >
                    <div className="font-medium leading-tight">
                      {technique.name}
                    </div>
                    <div className="font-mono text-[10px] opacity-70">
                      {technique.id}
                      {cov ? ` · ${cov.rules}` : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <Card>
        <CardTitle>Legend</CardTitle>
        <div className="flex flex-wrap gap-3 text-xs">
          <Badge tone="defender">Validated detection</Badge>
          <Badge tone="warn">Rule exists, unvalidated</Badge>
          <Badge tone="neutral">No detection</Badge>
        </div>
      </Card>
    </div>
  );
}
