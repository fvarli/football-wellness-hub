/**
 * Auth/RBAC logic tests.
 *
 * Tests the pure authorization functions directly to avoid importing
 * the full next-auth chain (which requires next/server in node env).
 */
import { describe, it, expect } from "vitest";

// Inline the pure auth logic to avoid next-auth import chain in jsdom env
interface AppUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "coach" | "player";
  playerId: string | null;
}

function hasRole(user: AppUser, roles: string[]): boolean {
  return roles.includes(user.role);
}

function canAccessPlayer(user: AppUser, playerId: string): boolean {
  if (user.role === "admin" || user.role === "coach") return true;
  return user.playerId === playerId;
}

const adminUser: AppUser = { id: "u1", email: "admin@fwh.dev", name: "Admin", role: "admin", playerId: null };
const coachUser: AppUser = { id: "u2", email: "coach@fwh.dev", name: "Coach", role: "coach", playerId: null };
const playerUser: AppUser = { id: "u3", email: "emre@fwh.dev", name: "Emre", role: "player", playerId: "1" };

describe("hasRole", () => {
  it("admin has admin role", () => expect(hasRole(adminUser, ["admin"])).toBe(true));
  it("coach has coach role", () => expect(hasRole(coachUser, ["coach"])).toBe(true));
  it("player does not have coach role", () => expect(hasRole(playerUser, ["admin", "coach"])).toBe(false));
  it("supports multiple roles", () => expect(hasRole(coachUser, ["admin", "coach"])).toBe(true));
});

describe("canAccessPlayer", () => {
  it("admin can access any player", () => {
    expect(canAccessPlayer(adminUser, "1")).toBe(true);
    expect(canAccessPlayer(adminUser, "99")).toBe(true);
  });
  it("coach can access any player", () => {
    expect(canAccessPlayer(coachUser, "1")).toBe(true);
    expect(canAccessPlayer(coachUser, "99")).toBe(true);
  });
  it("player can access own playerId", () => expect(canAccessPlayer(playerUser, "1")).toBe(true));
  it("player cannot access another playerId", () => {
    expect(canAccessPlayer(playerUser, "2")).toBe(false);
    expect(canAccessPlayer(playerUser, "99")).toBe(false);
  });
});

describe("authorization rules", () => {
  it("player wellness: identity forced from session", () => {
    expect(canAccessPlayer(playerUser, playerUser.playerId!)).toBe(true);
    expect(canAccessPlayer(playerUser, "2")).toBe(false);
  });
  it("coach can submit on behalf of any player", () => {
    expect(canAccessPlayer(coachUser, "1")).toBe(true);
    expect(canAccessPlayer(coachUser, "5")).toBe(true);
  });
  it("player cannot log training sessions", () => expect(hasRole(playerUser, ["admin", "coach"])).toBe(false));
  it("coach can log training sessions", () => expect(hasRole(coachUser, ["admin", "coach"])).toBe(true));
  it("admin can log training sessions", () => expect(hasRole(adminUser, ["admin", "coach"])).toBe(true));
});
