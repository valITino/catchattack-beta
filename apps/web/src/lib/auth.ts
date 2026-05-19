/**
 * Auth.js v5 configuration.
 *
 * Three modes selected by `AUTH_MODE`:
 * - dev    — no real authentication; every request is the dev operator.
 * - github — GitHub OIDC.
 * - email  — magic-link email (requires SMTP).
 *
 * Per BUILD_BRIEF_ADDENDUM.md §F, configurable so the operator can test
 * the UI locally without going through OAuth every reload.
 */

import NextAuth, { type NextAuthConfig, type Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";

import { config as appConfig } from "./config";

function buildConfig(): NextAuthConfig {
  if (appConfig.authMode === "github") {
    return {
      providers: [
        GitHubProvider({
          clientId: process.env.AUTH_GITHUB_ID,
          clientSecret: process.env.AUTH_GITHUB_SECRET,
        }),
      ],
      session: { strategy: "jwt" },
    };
  }

  // dev + email both use the credentials provider with a pre-filled
  // operator identity so the app boots without external services. Real
  // email magic-link wiring goes in when AUTH_MODE=email and SMTP is
  // configured — Phase 6+.
  return {
    providers: [
      CredentialsProvider({
        id: "dev",
        name: "Dev operator",
        credentials: {},
        async authorize() {
          return {
            id: appConfig.devOperator.id,
            name: appConfig.devOperator.name,
            email: appConfig.devOperator.email,
          };
        },
      }),
    ],
    session: { strategy: "jwt" },
    pages: {
      signIn: "/",
    },
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth(buildConfig());

/**
 * Drop-in for server components: returns either the real session or a
 * synthetic dev-operator session in dev mode (so server components don't
 * have to litter the codebase with login redirects).
 */
export async function currentSession(): Promise<Session> {
  const session = await auth();
  if (session) return session;
  if (appConfig.authMode === "dev") {
    return {
      user: {
        id: appConfig.devOperator.id,
        name: appConfig.devOperator.name,
        email: appConfig.devOperator.email,
      },
      expires: new Date(Date.now() + 86_400_000).toISOString(),
    } as Session;
  }
  // In github/email mode an unauthenticated request has no user; the caller
  // decides whether to redirect. Route-level enforcement is not yet wired —
  // dev mode is the supported path until Phase 6+ auth lands.
  return { user: undefined, expires: new Date().toISOString() } as Session;
}
