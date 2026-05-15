/**
 * /rules — DAC browser. Reads detections/ directly.
 */

import { Badge } from "@/components/Badge";
import { Card, CardTitle } from "@/components/Card";
import { listRules } from "@/lib/rules";

export const dynamic = "force-dynamic";

function levelTone(level: string | null): "neutral" | "warn" | "attacker" {
  if (level === "critical" || level === "high") return "attacker";
  if (level === "medium" || level === "low") return "warn";
  return "neutral";
}

export default async function RulesPage() {
  const rules = await listRules();
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Rules</h1>
        <p className="text-sm text-fg-muted">
          Detection-as-code under{" "}
          <code className="rounded bg-surface-hi px-1 font-mono text-xs">detections/</code>. Filter
          via the URL once Phase 6 adds the filter bar.
        </p>
      </header>

      {rules.length === 0 ? (
        <Card>
          <CardTitle>No rules</CardTitle>
          <p className="text-sm text-fg-muted">
            Drop Sigma YAML under{" "}
            <code className="rounded bg-surface-hi px-1 font-mono text-xs">
              detections/enterprise/&lt;platform&gt;/&lt;tactic&gt;/
            </code>
            .
          </p>
        </Card>
      ) : (
        <div className="grid gap-2">
          {rules.map((rule) => (
            <Card key={rule.path} className="!p-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-medium">{rule.title}</h2>
                  <p className="truncate font-mono text-xs text-fg-muted">{rule.path}</p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  {rule.level && <Badge tone={levelTone(rule.level)}>level: {rule.level}</Badge>}
                  {rule.status && <Badge tone="neutral">{rule.status}</Badge>}
                  {rule.techniques.slice(0, 4).map((t) => (
                    <Badge key={t} tone="defender">
                      {t}
                    </Badge>
                  ))}
                  <Badge tone="neutral">{rule.platform}</Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
