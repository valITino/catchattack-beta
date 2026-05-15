/**
 * Runtime config. Reads env vars once.
 *
 * AUTH_MODE | meaning                                  | Phase
 * ----------|------------------------------------------|-------
 * dev       | bypass auth; fixed operator identity     | 0–4 default
 * github    | GitHub OIDC via Auth.js v5               | prod
 * email     | magic-link email                         | optional
 */

export type AuthMode = "dev" | "github" | "email";

function readAuthMode(): AuthMode {
  const raw = (process.env.AUTH_MODE ?? "dev").toLowerCase();
  if (raw === "github" || raw === "email" || raw === "dev") return raw;
  return "dev";
}

export const config = {
  authMode: readAuthMode(),
  conductorUrl: process.env.CATCHATTACK_CONDUCTOR_URL ?? "http://localhost:7200",
  proxyUrl: process.env.CATCHATTACK_PROXY_URL ?? "http://localhost:7100/mcp/",
  approvalToken: process.env.CATCHATTACK_APPROVAL_TOKEN ?? "",
  devOperator: {
    id: "00000000-0000-0000-0000-000000000001",
    name: "dev-operator",
    email: "dev@catchattack.local",
  },
} as const;
