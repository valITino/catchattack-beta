import type { Route } from "next";
import Link from "next/link";

const items: Array<{ href: Route; label: string }> = [
  { href: "/coverage", label: "Coverage" },
  { href: "/captures", label: "Captures" },
  { href: "/rules", label: "Rules" },
  { href: "/rules/prs", label: "PR queue" },
  { href: "/agents", label: "Agents" },
  { href: "/runs", label: "Runs" },
];

export function Nav() {
  return (
    <nav aria-label="Main navigation" className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-3">
        <Link href="/" className="font-semibold tracking-tight">
          <span className="text-attacker">Catch</span>
          <span className="text-defender">Attack</span>
        </Link>
        <ul className="flex flex-wrap items-center gap-1 text-sm">
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="rounded px-3 py-1.5 text-fg-muted hover:bg-surface-hi hover:text-fg"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
