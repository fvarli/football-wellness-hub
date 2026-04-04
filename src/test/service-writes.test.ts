import { describe, it, expect } from "vitest";
import {
  submitWellnessCheckIn,
  submitTrainingSession,
  getWellnessForPlayer,
  getSessionsForPlayer,
  getAllSessions,
} from "@/lib/data/service";

function validCheckin(overrides: Record<string, unknown> = {}) {
  return {
    playerId: "1",
    fatigue: 7, soreness: 7, sleepQuality: 7, recovery: 7, stress: 7, mood: 7,
    ...overrides,
  };
}

describe("submitWellnessCheckIn", () => {
  it("creates a wellness entry and makes it readable", () => {
    const before = getWellnessForPlayer("1").length;

    const result = submitWellnessCheckIn(validCheckin({
      date: "2026-05-01",
      bodyMap: [{ regionKey: "chest", severity: 4, view: "front", side: "center" }],
    }));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.id).toBeTruthy();
      expect(result.data.overallScore).toBe(7);
      expect(result.data.bodyMap).toHaveLength(1);
      expect(result.data.bodyMap[0].label).toBe("Chest");
    }

    expect(getWellnessForPlayer("1").length).toBe(before + 1);
  });

  it("rejects invalid input without mutating data", () => {
    const before = getWellnessForPlayer("1").length;

    const result = submitWellnessCheckIn({ playerId: "1" });
    expect(result.ok).toBe(false);

    expect(getWellnessForPlayer("1").length).toBe(before);
  });

  it("rejects duplicate same-day submission for the same player", () => {
    // First submit should succeed
    const first = submitWellnessCheckIn(validCheckin({ date: "2026-06-15" }));
    expect(first.ok).toBe(true);

    // Second submit for same player + date should fail
    const second = submitWellnessCheckIn(validCheckin({ date: "2026-06-15" }));
    expect(second.ok).toBe(false);
    if (!second.ok) {
      expect(second.errors[0].field).toBe("date");
      expect(second.errors[0].message).toContain("already exists");
      expect(second.errors[0].message).toContain("2026-06-15");
    }
  });

  it("allows same date for different players", () => {
    const r1 = submitWellnessCheckIn(validCheckin({ playerId: "4", date: "2026-06-20" }));
    const r2 = submitWellnessCheckIn(validCheckin({ playerId: "5", date: "2026-06-20" }));
    expect(r1.ok).toBe(true);
    expect(r2.ok).toBe(true);
  });

  it("returns WriteError shape on failure", () => {
    const result = submitWellnessCheckIn({ playerId: "1" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      for (const err of result.errors) {
        expect(err).toHaveProperty("message");
        expect(typeof err.message).toBe("string");
      }
    }
  });
});

describe("submitTrainingSession", () => {
  it("creates a session with derived sessionLoad and makes it readable", () => {
    const before = getSessionsForPlayer("1").length;

    const result = submitTrainingSession({
      playerId: "1",
      date: "2026-05-01",
      type: "training",
      durationMinutes: 60,
      rpe: 7,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.id).toBeTruthy();
      expect(result.data.sessionLoad).toBe(420);
    }

    expect(getSessionsForPlayer("1").length).toBe(before + 1);
  });

  it("rejects invalid input without mutating data", () => {
    const before = getSessionsForPlayer("1").length;

    const result = submitTrainingSession({ playerId: "1", type: "invalid" });
    expect(result.ok).toBe(false);

    expect(getSessionsForPlayer("1").length).toBe(before);
  });

  it("created session appears in getAllSessions", () => {
    const result = submitTrainingSession({
      playerId: "2",
      date: "2026-07-01",
      type: "match",
      durationMinutes: 90,
      rpe: 8,
    });
    expect(result.ok).toBe(true);

    const all = getAllSessions();
    const found = all.find((s) => s.id === (result.ok ? result.data.id : ""));
    expect(found).toBeDefined();
    expect(found.sessionLoad).toBe(720);
    expect(found.playerName).toBe("Carlos Mendes");
  });
});
