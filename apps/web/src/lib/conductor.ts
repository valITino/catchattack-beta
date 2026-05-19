/**
 * Server-side Conductor client.
 *
 * Talks to the FastAPI surface at `CATCHATTACK_CONDUCTOR_URL` (default
 * http://localhost:7200). All calls are server-only — the browser never
 * sees the Conductor.
 */

import { config } from "./config";

export type RunStatus = "queued" | "running" | "succeeded" | "failed" | "aborted";

export type StepEvent = {
  ts: string;
  step: number;
  total: number;
  verb: string;
  tool: string | null;
  params: Record<string, unknown> | null;
  summary: string | null;
  level: string;
};

export type Run = {
  id: string;
  workflow: string;
  status: RunStatus;
  created_at: string;
  inputs: Record<string, unknown>;
  events: StepEvent[];
  result: Record<string, unknown> | null;
  error: { code: string; message: string; detail: Record<string, unknown> } | null;
};

/**
 * Run and capture ids are server-generated UUID-shaped strings. Reject
 * anything else so a path segment from a request cannot traverse or
 * re-target the Conductor URL when interpolated into an upstream path.
 */
export function isSafeId(id: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(id);
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${config.conductorUrl}${path}`, {
    cache: "no-store",
    headers: { accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`conductor ${path}: ${res.status}`);
  }
  return (await res.json()) as T;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${config.conductorUrl}${path}`, {
    method: "POST",
    cache: "no-store",
    headers: {
      "content-type": "application/json",
      ...(config.approvalToken ? { "x-catchattack-approval-token": config.approvalToken } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`conductor ${path}: ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function listWorkflows(): Promise<{ items: string[] }> {
  return get("/workflows");
}

export async function getRun(id: string): Promise<Run> {
  return get(`/workflows/runs/${id}`);
}

export async function startRun(
  name: string,
  inputs: Record<string, unknown>,
): Promise<{ run_id: string; status: RunStatus }> {
  return post(`/workflows/${name}/run`, { inputs });
}

export async function health(): Promise<{
  status: string;
  workflows: string[];
}> {
  return get("/health");
}
