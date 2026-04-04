import { describe, it, expect } from "vitest";
import {
  submitWellnessCheckIn,
  submitTrainingSession,
  getWellnessForPlayer,
  getSessionsForPlayer,
} from "@/lib/data/service";

describe("submitWellnessCheckIn", () => {
  it("creates a wellness entry and makes it readable", () => {
    const before = getWellnessForPlayer("1").length;

    const result = submitWellnessCheckIn({
      playerId: "1",
      date: "2026-04-10",
      fatigue: 7, soreness: 7, sleepQuality: 7, recovery: 7, stress: 7, mood: 7,
      bodyMap: [{ regionKey: "chest", severity: 4, view: "front", side: "center" }],
    });

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
});

describe("submitTrainingSession", () => {
  it("creates a session with derived sessionLoad and makes it readable", () => {
    const before = getSessionsForPlayer("1").length;

    const result = submitTrainingSession({
      playerId: "1",
      date: "2026-04-10",
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
});
