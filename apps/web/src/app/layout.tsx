import "./globals.css";
import { Nav } from "@/components/Nav";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "CatchAttack",
  description:
    "Run an attack, see it live, get a validated Sigma rule auto-deployed — all backed by the same MCP fleet.",
};

export const viewport: Viewport = {
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
