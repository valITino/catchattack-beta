"use client";

/**
 * HLS player. Uses native <video> on Safari (which speaks HLS) and the
 * hls.js fallback elsewhere. Lazy-loads hls.js so the bundle stays small.
 */

import { useEffect, useRef, useState } from "react";

type Props = {
  src: string;
};

export function CapturePlayer({ src }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      return;
    }

    let cancelled = false;
    let hls: { destroy: () => void } | null = null;

    (async () => {
      try {
        const { default: Hls } = await import("hls.js");
        if (cancelled) return;
        if (!Hls.isSupported()) {
          setError("Your browser does not support HLS playback.");
          return;
        }
        const instance = new Hls({ enableWorker: true });
        instance.loadSource(src);
        instance.attachMedia(video);
        hls = instance;
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      }
    })();

    return () => {
      cancelled = true;
      hls?.destroy();
    };
  }, [src]);

  if (error) {
    return <p className="text-sm text-attacker-hi">HLS playback failed: {error}</p>;
  }

  return (
    <video
      ref={ref}
      controls
      preload="metadata"
      className="w-full rounded border border-border bg-black"
    >
      <track kind="captions" />
    </video>
  );
}
