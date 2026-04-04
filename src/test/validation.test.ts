import { describe, it, expect } from "vitest";
import { validateWellnessCheckIn, validateTrainingSession } from "@/lib/validation";

// ── Wellness check-in ──

function validCheckin(overrides: Record<string, unknown> = {}) {
  return {
    playerId: "1",
    date: "2026-04-05",
    fatigue: 7,
    soreness: 6,
    sleepQuality: 8,
    recovery: 7,
    stress: 6,
    mood: 8,
    ...overrides,
  };
}

describe("validateWellnessCheckIn", () => {
  it("accepts a valid check-in without body map", () => {
    const r = validateWellnessCheckIn(validCheckin());
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.playerId).toBe("1");
      expect(r.data.overallScore).toBe(7); // (7+6+8+7+6+8)/6 = 7.0
      expect(r.data.bodyMap).toEqual([]);
    }
  });

  it("accepts a valid check-in with body map", () => {
    const r = validateWellnessCheckIn(validCheckin({
      bodyMap: [
        { regionKey: "left_hamstring", severity: 7, view: "back", side: "left" },
        { regionKey: "chest", severity: 3, view: "front", side: "center" },
      ],
    }));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.bodyMap).toHaveLength(2);
      expect(r.data.bodyMap[0].label).toBe("L. Hamstring");
      expect(r.data.bodyMap[1].label).toBe("Chest");
    }
  });

  it("computes overallScore as the mean of 6 metrics", () => {
    const r = validateWellnessCheckIn(validCheckin({
      fatigue: 10, soreness: 10, sleepQuality: 10, recovery: 10, stress: 10, mood: 4,
    }));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.overallScore).toBe(9); // (10*5+4)/6 = 9.0
    }
  });

  it("rejects missing playerId", () => {
    const r = validateWellnessCheckIn(validCheckin({ playerId: "" }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors).toContain("playerId is required");
  });

  it("rejects invalid date format", () => {
    const r = validateWellnessCheckIn(validCheckin({ date: "04/05/2026" }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors).toContain("date must be YYYY-MM-DD format");
  });

  it("rejects metric out of range", () => {
    const r = validateWellnessCheckIn(validCheckin({ fatigue: 0 }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors).toContain("fatigue must be an integer 1-10");
  });

  it("rejects metric that is not an integer", () => {
    const r = validateWellnessCheckIn(validCheckin({ soreness: 5.5 }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors).toContain("soreness must be an integer 1-10");
  });

  it("rejects invalid regionKey in bodyMap", () => {
    const r = validateWellnessCheckIn(validCheckin({
      bodyMap: [{ regionKey: "fake_muscle", severity: 5, view: "front", side: null }],
    }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]).toContain('invalid regionKey "fake_muscle"');
  });

  it("rejects duplicate regionKey in bodyMap", () => {
    const r = validateWellnessCheckIn(validCheckin({
      bodyMap: [
        { regionKey: "chest", severity: 5, view: "front", side: "center" },
        { regionKey: "chest", severity: 3, view: "front", side: "center" },
      ],
    }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]).toContain('duplicate regionKey "chest"');
  });

  it("rejects bodyMap severity out of range", () => {
    const r = validateWellnessCheckIn(validCheckin({
      bodyMap: [{ regionKey: "chest", severity: 11, view: "front", side: "center" }],
    }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]).toContain("severity must be an integer 1-10");
  });

  it("collects multiple errors at once", () => {
    const r = validateWellnessCheckIn({ playerId: "", date: "bad", fatigue: 0 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.length).toBeGreaterThanOrEqual(3);
  });

  it("rejects non-object input", () => {
    const r = validateWellnessCheckIn("not an object");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors).toContain("Input must be an object");
  });
});

// ── Training session ──

function validSession(overrides: Record<string, unknown> = {}) {
  return {
    playerId: "1",
    date: "2026-04-05",
    type: "training",
    durationMinutes: 75,
    rpe: 6,
    ...overrides,
  };
}

describe("validateTrainingSession", () => {
  it("accepts a valid session and derives sessionLoad", () => {
    const r = validateTrainingSession(validSession());
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.sessionLoad).toBe(75 * 6);
      expect(r.data.type).toBe("training");
    }
  });

  it("rejects invalid session type", () => {
    const r = validateTrainingSession(validSession({ type: "yoga" }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]).toContain("type must be one of");
  });

  it("rejects durationMinutes out of range", () => {
    const r = validateTrainingSession(validSession({ durationMinutes: 0 }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]).toContain("durationMinutes must be an integer 1-600");
  });

  it("rejects rpe out of range", () => {
    const r = validateTrainingSession(validSession({ rpe: 11 }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]).toContain("rpe must be an integer 1-10");
  });

  it("derives sessionLoad as rpe * durationMinutes", () => {
    const r = validateTrainingSession(validSession({ rpe: 8, durationMinutes: 90 }));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.sessionLoad).toBe(720);
  });

  it("rejects non-object input", () => {
    const r = validateTrainingSession(null);
    expect(r.ok).toBe(false);
  });
});
