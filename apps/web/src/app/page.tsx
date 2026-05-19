import { Badge } from "@/components/Badge";
import { Card, CardTitle } from "@/components/Card";
import type { Route } from "next";
import Link from "next/link";

const tiles: Array<{
  href: Route;
  title: string;
  description: string;
  tone: "attacker" | "defender" | "neutral";
}> = [
  {
    href: "/coverage",
    title: "Coverage matrix",
    description: "MITRE ATT&CK matrix coloured by validated detections × env confidence.",
    tone: "defender",
  },
  {
    href: "/captures",
    title: "Captures",
    description:
      "Replay recorded emulations with synced video, telemetry, and detection-hit timelines.",
    tone: "attacker",
  },
  {
    href: "/rules/prs",
    title: "PR queue",
    description:
      "Conductor-drafted detections waiting for human merge: rule diff, FP estimate, validation proof.",
    tone: "defender",
  },
  {
    href: "/agents",
    title: "Agents",
    description: "Fleet view — connected agents, inventory, atomic runner.",
    tone: "neutral",
  },
  {
    href: "/runs",
    title: "Workflow runs",
    description: "Closed-loop history with live SSE progress.",
    tone: "neutral",
  },
  {
    href: "/rules",
    title: "Rules",
    description: "Detection-as-code browser — filter by ATT&CK, status, target SIEM.",
    tone: "neutral",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          <span className="text-attacker">Catch</span>
          <span className="text-defender">Attack</span>
        </h1>
        <p className="max-w-3xl text-fg-muted">
          Run an attack, see it live, get a validated Sigma rule auto-deployed to your SIEM —
          through chat or this web UI, both backed by the same MCP fleet.
        </p>
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge tone="attacker">attacker = red</Badge>
          <Badge tone="defender">defender = blue</Badge>
          <Badge tone="warn">warning</Badge>
          <Badge tone="ok">validated</Badge>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((tile) => (
          <Link key={tile.href} href={tile.href} className="group focus:outline-none">
            <Card className="h-full transition-colors hover:border-fg-muted">
              <CardTitle>
                <span className="flex items-center gap-2">
                  <Badge tone={tile.tone}>•</Badge>
                  {tile.title}
                </span>
              </CardTitle>
              <p className="text-sm text-fg-muted">{tile.description}</p>
            </Card>
          </Link>
        ))}
      </section>
    </div>
  );
}
