/**
 * SSE proxy: streams /workflows/runs/{id}/sse from the Conductor to the
 * browser. The Conductor lives on the BFF side; the browser never knows
 * its URL.
 */

import { config } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const upstream = await fetch(`${config.conductorUrl}/workflows/runs/${id}/sse`, {
    headers: { accept: "text/event-stream" },
    cache: "no-store",
  });
  if (!upstream.ok || !upstream.body) {
    return new Response("conductor unreachable", { status: 502 });
  }
  return new Response(upstream.body, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      "x-accel-buffering": "no",
    },
  });
}
