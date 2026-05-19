/**
 * /agents — fleet view. Calls `agents.list_agents` via the MCP proxy.
 *
 * When the proxy isn't reachable, the page renders an explanatory empty
 * state rather than crashing — Phase 5 must demoable on a developer
 * laptop without the full stack running.
 */

import { Badge } from "@/components/Badge";
import { Card, CardTitle } from "@/components/Card";
import { callTool } from "@/lib/mcp";
import type { ReactNode } from "react";

type Agent = {
  agent_id: string;
  hostname: string;
  os: string;
  arch: string;
  status: string;
  last_seen: string;
  tags?: string[];
};

export const dynamic = "force-dynamic";

async function loadAgents(): Promise<{ items: Agent[] } | { error: string }> {
  try {
    return await callTool<{ items: Agent[] }>("agents.list_agents", {});
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Agents</h1>
        <p className="text-sm text-fg-muted">
          Endpoint agents connected via the bridge MCP. Run Atomic Red Team tests, view inventory,
          start captures.
        </p>
      </header>
      {children}
    </div>
  );
}

export default async function AgentsPage() {
  const result = await loadAgents();

  if ("error" in result) {
    return (
      <Shell>
        <Card>
          <CardTitle>MCP proxy unreachable</CardTitle>
          <p className="text-sm text-fg-muted">
            {result.error}. Start the proxy at <code>:7100</code> and reload.
          </p>
        </Card>
      </Shell>
    );
  }

  if (result.items.length === 0) {
    return (
      <Shell>
        <Card>
          <CardTitle>No agents</CardTitle>
          <p className="text-sm text-fg-muted">
            Enroll one with{" "}
            <code className="rounded bg-surface-hi px-1 font-mono text-xs">
              agent enroll --server &lt;url&gt; --token &lt;one-time&gt;
            </code>
            .
          </p>
        </Card>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {result.items.map((agent) => (
          <Card key={agent.agent_id}>
            <CardTitle>
              <span className="flex items-center gap-2">
                <Badge tone={agent.status === "connected" ? "ok" : "warn"}>{agent.status}</Badge>
                {agent.hostname}
              </span>
            </CardTitle>
            <dl className="grid grid-cols-2 gap-y-1 text-xs">
              <dt className="text-fg-muted">agent_id</dt>
              <dd className="font-mono">{agent.agent_id}</dd>
              <dt className="text-fg-muted">os / arch</dt>
              <dd>
                {agent.os} / {agent.arch}
              </dd>
              <dt className="text-fg-muted">last seen</dt>
              <dd>{new Date(agent.last_seen).toLocaleString()}</dd>
            </dl>
            {agent.tags && agent.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {agent.tags.map((tag) => (
                  <Badge key={tag} tone="neutral">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </Shell>
  );
}
