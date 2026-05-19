import type { ReactNode } from "react";
import { cn } from "./cn";

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-border bg-surface p-4", className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <h2 className="mb-3 text-sm font-medium text-fg-muted">{children}</h2>;
}
