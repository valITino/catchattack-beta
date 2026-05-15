/**
 * Server-side MCP proxy client.
 *
 * The Web UI is itself an MCP host (per BUILD_BRIEF.md §5: "The web UI is
 * itself an MCP host for read-only operations"). Server components call
 * MCP tools directly via JSON-RPC over the proxy's `/mcp` streamable-HTTP
 * endpoint.
 *
 * Phase 5: uses the fastmcp protocol's stateless-http JSON-RPC framing.
 * We hand-roll a tiny client to avoid pulling the full `@modelcontextprotocol/sdk`
 * into a Next.js bundle.
 */

import { config } from "./config";

type JSONRPCResponse<T> = {
  jsonrpc: "2.0";
  id: number | string;
  result?: T;
  error?: { code: number; message: string; data?: unknown };
};

let _id = 0;

async function rpc<T>(method: string, params: unknown): Promise<T> {
  _id += 1;
  const res = await fetch(config.proxyUrl, {
    method: "POST",
    cache: "no-store",
    headers: {
      "content-type": "application/json",
      accept: "application/json,text/event-stream",
      ...(config.approvalToken ? { "x-catchattack-approval-token": config.approvalToken } : {}),
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: _id,
      method,
      params,
    }),
  });
  if (!res.ok) {
    throw new Error(`mcp ${method}: ${res.status}`);
  }
  const body = (await res.json()) as JSONRPCResponse<T>;
  if (body.error) {
    throw new Error(`mcp ${method}: ${body.error.message}`);
  }
  return body.result as T;
}

/**
 * Call a tool by its dotted name (`agents.list_agents`,
 * `evidence.summarize_capture`, …). The proxy translates to underscored
 * form internally.
 */
export async function callTool<T = unknown>(
  dottedTool: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  // FastMCP exposes namespaced tools as `<ns>_<tool>` over MCP protocol.
  const underscored = dottedTool.includes(".") ? dottedTool.replace(".", "_") : dottedTool;
  type CallToolResult = {
    content?: Array<{ type: string; text?: string }>;
    structuredContent?: T;
    isError?: boolean;
  };
  const result = await rpc<CallToolResult>("tools/call", {
    name: underscored,
    arguments: args,
  });
  if (result.structuredContent !== undefined) return result.structuredContent;
  const text = result.content?.find((c) => c.type === "text")?.text;
  if (text) {
    try {
      return JSON.parse(text) as T;
    } catch {
      return text as unknown as T;
    }
  }
  return {} as T;
}
