/**
 * Auth.js configuration — Edge-safe.
 *
 * This file contains ONLY the config that is safe to run in Edge runtime
 * (middleware). No Prisma, no bcrypt, no Node-only imports.
 *
 * The Credentials provider authorize() function is defined in auth.ts
 * (Node-only) so it can use Prisma + bcrypt without leaking into Edge.
 */
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const authConfig: NextAuthConfig = {
  providers: [
    // Credentials provider is declared here for Edge awareness,
    // but authorize() is overridden in auth.ts (Node runtime)
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: string }).role;
        token.playerId = (user as { playerId: string | null }).playerId;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as { id: string }).id = token.sub!;
        (session.user as { role: string }).role = token.role as string;
        (session.user as { playerId: string | null }).playerId = token.playerId as string | null;
      }
      return session;
    },
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;

      // Public paths
      if (pathname.startsWith("/login") || pathname.startsWith("/api/auth")) {
        return true;
      }

      if (!isLoggedIn) return false;

      // Player role restrictions
      const role = auth?.user?.role as string | undefined;
      if (role === "player") {
        const playerId = (auth?.user as { playerId?: string })?.playerId;

        // Players can access their own player pages
        if (playerId && pathname.startsWith(`/players/${playerId}`)) return true;

        // Players can access these paths
        const allowed = ["/check-in", "/settings", "/api/", "/dashboard"];
        if (allowed.some((p) => pathname.startsWith(p))) return true;

        // Block staff-only pages
        if (pathname.startsWith("/players") || pathname.startsWith("/wellness") || pathname.startsWith("/workload")) {
          return Response.redirect(new URL("/dashboard", request.nextUrl.origin));
        }
      }

      return true;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
};
