import { auth } from "./auth";
import type { AppUser } from "./auth-types";

/** Get the current authenticated user from the server session. Returns null if not authenticated. */
export async function getCurrentUser(): Promise<AppUser | null> {
  const session = await auth();
  if (!session?.user) return null;
  return session.user as AppUser;
}

/** Get the current user or throw (for pages that require auth). */
export async function requireUser(): Promise<AppUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  return user;
}

/** Check if the user has one of the specified roles. */
export function hasRole(user: AppUser, roles: string[]): boolean {
  return roles.includes(user.role);
}

/** Check if the user can access a specific player's data. */
export function canAccessPlayer(user: AppUser, playerId: string): boolean {
  if (user.role === "admin" || user.role === "coach") return true;
  return user.playerId === playerId;
}
