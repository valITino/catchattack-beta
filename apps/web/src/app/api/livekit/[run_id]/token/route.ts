/**
 * BFF token endpoint. Proxies the Conductor's /live/{run_id}/token so the
 * browser gets a LiveKit viewer JWT without ever seeing the LiveKit API
 * secret.
 */

import { config } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ run_id: string }> },
): Promise<Response> {
  const { run_id } = await params;
  let upstream: Response;
  try {
    upstream = await fetch(`${config.conductorUrl}/live/${run_id}/token?identity=viewer`, {
      cache: "no-store",
      headers: { accept: "application/json" },
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 502 },
    );
  }
  if (!upstream.ok) {
    return Response.json(
      { error: `conductor returned ${upstream.status}` },
      { status: upstream.status },
    );
  }
  return Response.json(await upstream.json());
}
