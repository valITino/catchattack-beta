"use client";

/**
 * Client component: subscribes to /workflows/runs/{id}/sse and appends
 * events as they arrive.
 */

import type { StepEvent } from "@/lib/conductor";
import { useEffect, useState } from "react";

type Props = {
  runId: string;
  initial: StepEvent[];
};

const levelColour: Record<string, string> = {
  info: "border-defender/40 bg-defender/10",
  warn: "border-warn/40 bg-warn/10",
  error: "border-attacker/40 bg-attacker/10",
};

export function RunTail({ runId, initial }: Props) {
  const [events, setEvents] = useState<StepEvent[]>(initial);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const url = `/api/runs/${runId}/sse`;
    const es = new EventSource(url);
    es.addEventListener("step", (raw) => {
      try {
        const ev = JSON.parse((raw as MessageEvent).data) as StepEvent;
        setEvents((prev) => [...prev, ev]);
      } catch {
        // ignore malformed
      }
    });
    es.addEventListener("done", () => {
      setDone(true);
      es.close();
    });
    es.onerror = () => {
      es.close();
      setDone(true);
    };
    return () => es.close();
  }, [runId]);

  return (
    <div className="space-y-1 font-mono text-xs">
      {events.map((ev, i) => (
        <div
          key={`${ev.ts}-${i}`}
          className={`rounded border px-2 py-1 ${levelColour[ev.level] ?? levelColour.info}`}
        >
          <span className="text-fg-muted">
            [{ev.step}/{ev.total}]
          </span>{" "}
          <span className="font-medium">{ev.verb}</span>
          {ev.tool && <span className="text-fg-muted"> · {ev.tool}</span>}
          {ev.summary && <div className="ml-12 mt-1 truncate text-fg-muted">→ {ev.summary}</div>}
        </div>
      ))}
      {done && (
        <div className="rounded border border-border bg-surface-hi px-2 py-1 text-fg-muted">
          stream closed
        </div>
      )}
    </div>
  );
}
