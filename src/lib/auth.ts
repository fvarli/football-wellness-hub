/**
 * Auth.js — Node runtime only.
 *
 * This file extends the Edge-safe config from auth.config.ts with
 * the Credentials authorize() function that requires Prisma + bcrypt.
 *
 * Only import this from:
 * - API route handlers (Node runtime)
 * - Server components (Node runtime)
 * - auth-utils.ts (used by server components)
 *
 * Do NOT import this from middleware.ts — use auth.config.ts instead.
 */
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compareSync } from "bcryptjs";
import { prisma } from "./db";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) return null;

        const valid = compareSync(credentials.password as string, user.hashedPassword);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          playerId: user.playerId,
        };
      },
    }),
  ],
});
