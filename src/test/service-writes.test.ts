/**
 * Service write tests.
 *
 * These test the validation + business logic layer without requiring a database.
 * Full database integration tests require `npm run db:migrate` + a running PostgreSQL.
 */
import { describe, it, expect } from "vitest";
import { validateWellnessCheckIn, validateTrainingSession } from "@/lib/validation";

function validCheckin(overrides: Record<string, unknown> = {}) {
  return {
    playerId: "1",
    date: "2026-05-01",
    fatigue: 7, soreness: 7, sleepQuality: 7, recovery: 7, stress: 7, mood: 7,
    ...overrides,
  };
}

describe("wellness write contract", () => {
  it("validates and derives overallScore", () => {
    const result = validateWellnessCheckIn(validCheckin());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.overallScore).toBe(7);
    }
  });

  it("validates body map and resolves labels", () => {
    const result = validateWellnessCheckIn(validCheckin({
      bodyMap: [{ regionKey: "chest", severity: 4, view: "front", side: "center" }],
    }));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.bodyMap).toHaveLength(1);
      expect(result.data.bodyMap[0].label).toBe("Chest");
    }
  });

  it("rejects invalid input", () => {
    const result = validateWellnessCheckIn({ playerId: "1" });
    expect(result.ok).toBe(false);
  });

  it("returns WriteError shape on failure", () => {
    const result = validateWellnessCheckIn({ playerId: "1" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      for (const err of result.errors) {
        expect(err).toHaveProperty("message");
        expect(typeof err.message).toBe("string");
      }
    }
  });
});

describe("wellness update contract (validation layer)", () => {
  it("update uses the same validation as create", () => {
    // The update endpoint revalidates the full payload through validateWellnessCheckIn
    const valid = validateWellnessCheckIn(validCheckin({ date: "2026-06-01" }));
    expect(valid.ok).toBe(true);

    // Invalid input is rejected the same way
    const invalid = validateWellnessCheckIn(validCheckin({ fatigue: 0 }));
    expect(invalid.ok).toBe(false);
  });

  it("body map replacement uses the same validation as create", () => {
    const result = validateWellnessCheckIn(validCheckin({
      bodyMap: [
        { regionKey: "left_hamstring", severity: 7, view: "back", side: "left" },
        { regionKey: "lower_back", severity: 5, view: "back", side: "center" },
      ],
    }));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.bodyMap).toHaveLength(2);
    }
  });

  it("rejects duplicate regionKey in update body map", () => {
    const result = validateWellnessCheckIn(validCheckin({
      bodyMap: [
        { regionKey: "chest", severity: 5, view: "front", side: "center" },
        { regionKey: "chest", severity: 3, view: "front", side: "center" },
      ],
    }));
    expect(result.ok).toBe(false);
  });
});

describe("training session write contract", () => {
  it("validates and derives sessionLoad", () => {
    const result = validateTrainingSession({
      playerId: "1",
      date: "2026-05-01",
      type: "training",
      durationMinutes: 60,
      rpe: 7,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.sessionLoad).toBe(420);
    }
  });

  it("rejects invalid input", () => {
    const result = validateTrainingSession({ playerId: "1", type: "invalid" });
    expect(result.ok).toBe(false);
  });

  it("update uses the same validation as create", () => {
    const valid = validateTrainingSession({
      playerId: "1", date: "2026-06-01", type: "match", durationMinutes: 90, rpe: 8,
    });
    expect(valid.ok).toBe(true);
    if (valid.ok) expect(valid.data.sessionLoad).toBe(720);

    const invalid = validateTrainingSession({ playerId: "1", type: "yoga" });
    expect(invalid.ok).toBe(false);
  });
});
