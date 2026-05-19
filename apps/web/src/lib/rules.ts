/**
 * Server-only: walk the detections/ directory and parse minimal Sigma
 * metadata. No upstream dependency; this is the BFF's view of the DAC
 * repo.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { cache } from "react";

export type RuleSummary = {
  path: string;
  title: string;
  id: string | null;
  level: string | null;
  status: string | null;
  techniques: string[];
  platform: string;
};

const YAML_FILE = /\.ya?ml$/i;
const TECHNIQUE = /attack\.(t\d{4}(?:\.\d{3})?)/gi;
const QUOTE_TRIM = /^["']|["']$/g;

// Top-level scalar keys we pull from each rule, with their regexes
// compiled once at module load rather than per file.
const SCALAR_KEYS = ["title", "id", "level", "status"] as const;
const KEY_RE: Record<(typeof SCALAR_KEYS)[number], RegExp> = {
  title: /^title:\s*(.+?)\s*$/m,
  id: /^id:\s*(.+?)\s*$/m,
  level: /^level:\s*(.+?)\s*$/m,
  status: /^status:\s*(.+?)\s*$/m,
};

function detectionsRoot(): string {
  return path.resolve(process.cwd(), "..", "..", "detections");
}

/**
 * Walk detections/ and parse minimal Sigma metadata. Wrapped in React
 * `cache()` so multiple consumers in one render (and the /rules and
 * /coverage pages) share a single tree walk.
 */
export const listRules = cache(async (): Promise<RuleSummary[]> => {
  const root = detectionsRoot();
  let files: string[];
  try {
    files = await walk(root);
  } catch {
    return [];
  }
  const out: RuleSummary[] = [];
  for (const file of files) {
    if (!YAML_FILE.test(file)) continue;
    const text = await fs.readFile(file, "utf-8").catch(() => "");
    if (!text) continue;
    out.push(parse(file, text, root));
  }
  return out.sort((a, b) => a.title.localeCompare(b.title));
});

async function walk(dir: string): Promise<string[]> {
  const out: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(full)));
    else if (e.isFile()) out.push(full);
  }
  return out;
}

function parse(filePath: string, text: string, root: string): RuleSummary {
  const get = (key: (typeof SCALAR_KEYS)[number]): string | null => {
    const m = text.match(KEY_RE[key]);
    return m?.[1]?.replace(QUOTE_TRIM, "") ?? null;
  };
  const techs = [...text.matchAll(TECHNIQUE)].map((m) => (m[1] ?? "").toUpperCase());
  const relative = path.relative(root, filePath);
  const platform = relative.split(path.sep)[1] ?? "?";

  return {
    path: relative,
    title: get("title") ?? path.basename(filePath),
    id: get("id"),
    level: get("level"),
    status: get("status"),
    techniques: [...new Set(techs)],
    platform,
  };
}
