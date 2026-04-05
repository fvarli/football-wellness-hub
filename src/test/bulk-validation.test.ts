import { describe, it, expect } from "vitest";
import { validateBulkTrainingSessions } from "@/lib/validation";

function validBulkInput(overrides: Record<string, unknown> = {}) {
  return {
    playerIds: ["1", "2", "3"],
    date: "2026-05-01",
    type: "training",
    durationMinutes: 60,
    rpe: 7,
    ...overrides,
  };
}

describe("validateBulkTrainingSessions", () => {
  it("accepts valid input for multiple players", () => {
    const result = validateBulkTrainingSessions(validBulkInput());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data).toHaveLength(3);
    expect(result.data[0].sessionLoad).toBe(420);
    expect(result.data[0].playerId).toBe("1");
    expect(result.data[1].playerId).toBe("2");
    expect(result.data[2].playerId).toBe("3");
  });

  it("rejects empty playerIds array", () => {
    const result = validateBulkTrainingSessions(validBulkInput({ playerIds: [] }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0].field).toBe("playerIds");
      expect(result.errors[0].message).toContain("empty");
    }
  });

  it("rejects non-array playerIds", () => {
    const result = validateBulkTrainingSessions(validBulkInput({ playerIds: "1" }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0].field).toBe("playerIds");
    }
  });

  it("rejects duplicate playerIds", () => {
    const result = validateBulkTrainingSessions(validBulkInput({ playerIds: ["1", "1", "2"] }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0].field).toBe("playerIds");
      expect(result.errors[0].message).toContain("duplicate");
    }
  });

  it("rejects blank playerId in array", () => {
    const result = validateBulkTrainingSessions(validBulkInput({ playerIds: ["1", "", "3"] }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0].field).toBe("playerIds[1]");
    }
  });

  it("rejects non-string playerId in array", () => {
    const result = validateBulkTrainingSessions(validBulkInput({ playerIds: ["1", 42] }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0].field).toContain("playerIds");
    }
  });

  it("rejects invalid shared fields (bad date)", () => {
    const result = validateBulkTrainingSessions(validBulkInput({ date: "not-a-date" }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.field === "date")).toBe(true);
    }
  });

  it("rejects rpe out of range", () => {
    const result = validateBulkTrainingSessions(validBulkInput({ rpe: 11 }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.field === "rpe")).toBe(true);
    }
  });

  it("allows notes to be omitted", () => {
    const input = validBulkInput();
    delete input.notes;
    const result = validateBulkTrainingSessions(input);
    expect(result.ok).toBe(true);
  });

  it("rejects non-object input", () => {
    const result = validateBulkTrainingSessions(null);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0].message).toContain("object");
    }
  });
});
