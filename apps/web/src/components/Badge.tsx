import type { ReactNode } from "react";
import { cn } from "./cn";

type Tone = "neutral" | "attacker" | "defender" | "warn" | "ok";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-hi text-fg-muted",
  attacker: "bg-attacker/20 text-attacker-hi border-attacker/40",
  defender: "bg-defender/20 text-defender-hi border-defender/40",
  warn: "bg-warn/20 text-warn border-warn/40",
  ok: "bg-ok/20 text-ok border-ok/40",
};

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}
