"use client";

/**
 * Live emulation viewer.
 *
 * Two parallel subscriptions:
 *  1. LiveKit room — sub-second WebRTC video of the agent's screen.
 *  2. Marker stream — the Conductor's SSE marker feed, proxied through
 *     /api/runs/<id>/markers, appended to the live list as TTPs execute
 *     and detections fire.
 *
 * When the marker stream emits a `done` event the run is over: we wait a
 * beat and redirect to the recorded run view.
 */

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type LiveMarker = {
  t_ms: number;
  kind: string;
  label: string;
  color?: "red" | "blue" | "neutral";
  filled?: boolean;
};

type Phase = "connecting" | "live" | "done" | "error";

export function LiveView({ runId }: { runId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [markers, setMarkers] = useState<LiveMarker[]>([]);
  const [phase, setPhase] = useState<Phase>("connecting");
  const [note, setNote] = useState<string>("");
  const router = useRouter();

  // --- LiveKit video subscription -----------------------------------------
  useEffect(() => {
    let room: { disconnect: () => void } | null = null;
    let cancelled = false;

    (async () => {
      try {
        const tokenRes = await fetch(`/api/livekit/${runId}/token`, {
          cache: "no-store",
        });
        if (!tokenRes.ok) {
          // LiveKit not configured — markers still work; just no video.
          setNote("Video unavailable (LiveKit not configured).");
          return;
        }
        const { url, token } = (await tokenRes.json()) as {
          url: string;
          token: string;
        };
        const { Room, RoomEvent } = await import("livekit-client");
        if (cancelled) return;
        const r = new Room();
        r.on(RoomEvent.TrackSubscribed, (track) => {
          if (track.kind === "video" && videoRef.current) {
            track.attach(videoRef.current);
          }
        });
        await r.connect(url, token);
        room = r;
      } catch (err) {
        setNote(`Video unavailable: ${err instanceof Error ? err.message : String(err)}`);
      }
    })();

    return () => {
      cancelled = true;
      room?.disconnect();
    };
  }, [runId]);

  // --- Marker stream (SSE, proxied from the Conductor) --------------------
  useEffect(() => {
    const es = new EventSource(`/api/runs/${runId}/markers`);

    es.onopen = () => setPhase("live");
    es.addEventListener("marker", (raw) => {
      try {
        const marker = JSON.parse((raw as MessageEvent).data) as LiveMarker;
        setMarkers((prev) => [...prev, marker]);
      } catch {
        // ignore malformed frames
      }
    });
    es.addEventListener("done", () => {
      setPhase("done");
      es.close();
    });
    es.onerror = () => {
      setPhase((p) => (p === "done" ? p : "error"));
    };

    return () => es.close();
  }, [runId]);

  // --- Auto-redirect to the recorded view when the run completes ----------
  useEffect(() => {
    if (phase !== "done") return;
    const t = setTimeout(() => {
      // The recorded capture id is not known to this page; the runs view
      // links onward. Redirect to /runs/<id> which shows the final result.
      router.push(`/runs/${runId}`);
    }, 2500);
    return () => clearTimeout(t);
  }, [phase, runId, router]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="aspect-video w-full rounded border border-border bg-black"
          >
            <track kind="captions" />
          </video>
          {note && <p className="mt-1 text-xs text-fg-muted">{note}</p>}
        </div>
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-fg-muted">Status</p>
          <p className="text-sm">
            {phase === "connecting" && "Connecting to marker stream…"}
            {phase === "live" && "● Live — markers append as the run executes."}
            {phase === "done" && "Run complete — redirecting to the recorded view…"}
            {phase === "error" && "Marker stream error."}
          </p>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-fg-muted">
          Live markers ({markers.length})
        </p>
        <ol className="space-y-1 font-mono text-xs">
          {markers.length === 0 && <li className="text-fg-muted">no markers yet</li>}
          {markers.map((m, i) => (
            <li
              key={`${m.t_ms}-${i}`}
              className={`rounded border px-2 py-1 ${
                m.color === "red"
                  ? "border-attacker/40 bg-attacker/10 text-attacker-hi"
                  : m.color === "blue"
                    ? "border-defender/40 bg-defender/10 text-defender-hi"
                    : "border-border bg-surface-hi/40"
              }`}
            >
              <span aria-hidden>{m.color === "red" ? "★" : "●"}</span> {m.label}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
