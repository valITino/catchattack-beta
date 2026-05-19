/**
 * SSE proxy for the Conductor's live-marker stream.
 *
 * The Conductor exposes markers as both a WebSocket and SSE. Next.js
 * route handlers cannot proxy a WebSocket upgrade, so the browser
 * consumes the SSE form via this proxy — the Conductor URL stays
 * server-side.
 */

import { isSafeId } from "@/lib/conductor";
import { config } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  if (!isSafeId(id)) {
    return new Response("invalid run id", { status: 400 });
  }
  let upstream: Response;
  try {
    upstream = await fetch(`${config.conductorUrl}/live/${id}/markers/sse`, {
      headers: { accept: "text/event-stream" },
      cache: "no-store",
    });
  } catch {
    return new Response("conductor unreachable", { status: 502 });
  }
  if (!upstream.ok || !upstream.body) {
    return new Response("marker stream unavailable", {
      status: upstream.status || 502,
    });
  }
  return new Response(upstream.body, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      "x-accel-buffering": "no",
    },
  });
}
