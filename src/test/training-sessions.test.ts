import { describe, it, expect } from "vitest";
import { trainingSessions, getAllSessions, getPlayerSessions, players } from "@/lib/mock-data";

describe("training session mock data", () => {
  it("every session has sessionLoad = rpe * durationMinutes", () => {
    for (const s of trainingSessions) {
      expect(s.sessionLoad).toBe(s.rpe * s.durationMinutes);
    }
  });

  it("every session references a valid player id", () => {
    const playerIds = new Set(players.map((p) => p.id));
    for (const s of trainingSessions) {
      expect(playerIds.has(s.playerId)).toBe(true);
    }
  });

  it("session ids are unique", () => {
    const ids = trainingSessions.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("session types are valid", () => {
    const validTypes = ["training", "match", "gym", "recovery"];
    for (const s of trainingSessions) {
      expect(validTypes).toContain(s.type);
    }
  });
});

describe("getAllSessions", () => {
  it("returns sessions sorted by date DESC then player name ASC", () => {
    const sessions = getAllSessions();
    for (let i = 1; i < sessions.length; i++) {
      const prev = sessions[i - 1];
      const curr = sessions[i];
      const dateCmp = prev.date.localeCompare(curr.date);
      if (dateCmp === 0) {
        expect(prev.playerName.localeCompare(curr.playerName)).toBeLessThanOrEqual(0);
      } else {
        // date descending: prev.date >= curr.date
        expect(dateCmp).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("includes playerName from the player record", () => {
    const sessions = getAllSessions();
    for (const s of sessions) {
      expect(s.playerName.length).toBeGreaterThan(0);
    }
  });
});

describe("getPlayerSessions", () => {
  it("returns only sessions for the given player", () => {
    const sessions = getPlayerSessions("1");
    expect(sessions.length).toBeGreaterThan(0);
    for (const s of sessions) {
      expect(s.playerId).toBe("1");
    }
  });

  it("returns sessions sorted by date DESC", () => {
    const sessions = getPlayerSessions("1");
    for (let i = 1; i < sessions.length; i++) {
      expect(sessions[i - 1].date.localeCompare(sessions[i].date)).toBeGreaterThanOrEqual(0);
    }
  });
});
