/**
 * Edge middleware — lightweight auth check only.
 *
 * Uses auth.config.ts (Edge-safe) — no Prisma, no bcrypt, no Node crypto.
 * The authorized() callback in auth.config.ts handles route protection.
 */
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
