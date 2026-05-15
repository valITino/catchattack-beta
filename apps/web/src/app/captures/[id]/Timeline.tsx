/**
 * Capture timeline. Server-rendered SVG with marker lanes.
 *
 * Per BUILD_BRIEF.md §5: red stars = atomic steps (filled = detected),
 * blue circles = detection hits (filled = validated). Process spawns and
 * sysmon events occupy their own lanes.
 *
 * The component is intentionally simple SVG — virtualization (per the
 * brief's >10k events budget) lands in Phase 6 alongside the live mode.
 */

type Marker = {
  t_ms: number;
  kind: string;
  label: string;
  ref?: string | null;
  color?: "red" | "blue" | "neutral" | null;
  filled?: boolean | null;
};

type Props = {
  markers: Marker[];
  durationMs: number;
};

const LANES: Array<{ label: string; kinds: string[]; tone: "red" | "blue" | "neutral" }> = [
  {
    label: "Atomic steps",
    kinds: [
      "atomic_step_start",
      "atomic_step_end",
      "caldera_ability_start",
      "caldera_ability_end",
      "labeled_attack",
    ],
    tone: "red",
  },
  {
    label: "Detection hits",
    kinds: ["detection_hit"],
    tone: "blue",
  },
  {
    label: "Process spawns",
    kinds: ["process_spawn"],
    tone: "neutral",
  },
  {
    label: "Sysmon / network",
    kinds: ["sysmon_event", "network_connection"],
    tone: "neutral",
  },
  {
    label: "Operator notes",
    kinds: ["operator_note"],
    tone: "neutral",
  },
];

const toneFill: Record<string, string> = {
  red: "fill-attacker",
  blue: "fill-defender",
  neutral: "fill-fg-muted",
};

const toneStroke: Record<string, string> = {
  red: "stroke-attacker",
  blue: "stroke-defender",
  neutral: "stroke-fg-muted",
};

export function Timeline({ markers, durationMs }: Props) {
  const width = 1000;
  const laneHeight = 32;
  const padding = 70;
  const height = LANES.length * laneHeight + 24;
  const usableWidth = width - padding - 20;
  const total = Math.max(1, durationMs);

  function x(t_ms: number): number {
    return padding + (t_ms / total) * usableWidth;
  }

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Capture timeline"
        className="min-w-[800px]"
      >
        {/* Lane backgrounds + labels */}
        {LANES.map((lane, i) => {
          const y = i * laneHeight + 4;
          return (
            <g key={lane.label}>
              <rect
                x={padding}
                y={y}
                width={usableWidth}
                height={laneHeight - 6}
                className="fill-surface-hi/30"
              />
              <line
                x1={padding}
                y1={y + (laneHeight - 6) / 2}
                x2={width - 20}
                y2={y + (laneHeight - 6) / 2}
                className="stroke-border"
                strokeWidth={1}
              />
              <text
                x={padding - 8}
                y={y + laneHeight / 2}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-fg-muted text-[10px] font-medium"
              >
                {lane.label}
              </text>
            </g>
          );
        })}

        {/* Markers */}
        {LANES.flatMap((lane, i) => {
          const y = i * laneHeight + laneHeight / 2;
          return markers
            .filter((m) => lane.kinds.includes(m.kind))
            .map((m, j) => {
              const cx = x(m.t_ms);
              const filled = m.filled !== false;
              const tone = m.color ?? lane.tone;
              if (lane.tone === "red") {
                return (
                  <Star
                    key={`${lane.label}-${j}`}
                    cx={cx}
                    cy={y}
                    filled={filled}
                    tone={tone}
                    title={`${m.label} @ ${m.t_ms} ms`}
                  />
                );
              }
              return (
                <circle
                  key={`${lane.label}-${j}`}
                  cx={cx}
                  cy={y}
                  r={5}
                  className={filled ? toneFill[tone] : `fill-transparent ${toneStroke[tone]}`}
                  strokeWidth={2}
                >
                  <title>{`${m.label} @ ${m.t_ms} ms`}</title>
                </circle>
              );
            });
        })}

        {/* X-axis tick marks every quarter */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
          const tx = padding + frac * usableWidth;
          return (
            <g key={frac}>
              <line
                x1={tx}
                y1={4}
                x2={tx}
                y2={height - 14}
                className="stroke-border/60"
                strokeDasharray="2,4"
              />
              <text
                x={tx}
                y={height - 2}
                textAnchor="middle"
                className="fill-fg-muted text-[9px] font-mono"
              >
                {((frac * total) / 1000).toFixed(1)} s
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function Star({
  cx,
  cy,
  filled,
  tone,
  title,
}: {
  cx: number;
  cy: number;
  filled: boolean;
  tone: "red" | "blue" | "neutral";
  title: string;
}) {
  const r = 6;
  // 5-point star path centered at (0,0).
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI * i) / 5 - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r / 2.5;
    pts.push(`${cx + Math.cos(angle) * rr},${cy + Math.sin(angle) * rr}`);
  }
  return (
    <polygon
      points={pts.join(" ")}
      className={filled ? toneFill[tone] : `fill-transparent ${toneStroke[tone]}`}
      strokeWidth={2}
    >
      <title>{title}</title>
    </polygon>
  );
}
