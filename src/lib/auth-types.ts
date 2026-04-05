/** Extended session/user types for Auth.js */

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "coach" | "player";
  playerId: string | null;
}

declare module "next-auth" {
  interface Session {
    user: AppUser;
  }
}
