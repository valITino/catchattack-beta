/**
 * Server-only: walk the detections/ directory and parse minimal Sigma
 * metadata. No upstream dependency; this is the BFF's view of the DAC
 * repo.
 */

import { promises as fs } from "node:fs";
import path from "node:path";

export type RuleSummary = {
  path: string;
  title: string;
  id: string | null;
  level: string | null;
  status: string | null;
  techniques: string[];
  platform: string;
};

function detectionsRoot(): string {
  return path.resolve(process.cwd(), "..", "..", "detections");
}

export async function listRules(): Promise<RuleSummary[]> {
  const root = detectionsRoot();
  let files: string[];
  try {
    files = await walk(root);
  } catch {
    return [];
  }
  const out: RuleSummary[] = [];
  for (const file of files) {
    if (!/\.ya?ml$/i.test(file)) continue;
    const text = await fs.readFile(file, "utf-8").catch(() => "");
    if (!text) continue;
    out.push(parse(file, text, root));
  }
  return out.sort((a, b) => a.title.localeCompare(b.title));
}

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
  const get = (key: string): string | null => {
    const m = text.match(new RegExp(`^${key}:\\s*(.+?)\\s*$`, "m"));
    return m?.[1]?.replace(/^["']|["']$/g, "") ?? null;
  };
  const techs = [...text.matchAll(/attack\.(t\d{4}(?:\.\d{3})?)/gi)].map((m) =>
    (m[1] ?? "").toUpperCase(),
  );
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
