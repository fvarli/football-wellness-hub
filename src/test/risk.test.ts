import { describe, it, expect } from "vitest";
import type { TrainingSession, WellnessEntry, BodyMapSelection } from "@/lib/types";
import {
  calculateAcuteLoad,
  calculateChronicLoad,
  calculateAcwr,
  getLatestWellnessScore,
  calculateWellnessTrend,
  calculateSorenessFlags,
  calculateRiskLevel,
  calculatePlayerRiskSnapshot,
} from "@/lib/risk";

// ── Test data factories ──

function makeSession(overrides: Partial<TrainingSession> & { date: string }): TrainingSession {
  const rpe = overrides.rpe ?? 6;
  const dur = overrides.durationMinutes ?? 60;
  return {
    id: overrides.id ?? `ts-${Math.random()}`,
    playerId: overrides.playerId ?? "p1",
    date: overrides.date,
    type: overrides.type ?? "training",
    durationMinutes: dur,
    rpe,
    sessionLoad: overrides.sessionLoad ?? rpe * dur,
    notes: overrides.notes,
  };
}

function makeWellness(overrides: Partial<WellnessEntry> & { date: string }): WellnessEntry {
  return {
    id: overrides.id ?? `w-${Math.random()}`,
    playerId: overrides.playerId ?? "p1",
    date: overrides.date,
    fatigue: overrides.fatigue ?? 7,
    soreness: overrides.soreness ?? 7,
    sleepQuality: overrides.sleepQuality ?? 7,
    recovery: overrides.recovery ?? 7,
    stress: overrides.stress ?? 7,
    mood: overrides.mood ?? 7,
    overallScore: overrides.overallScore ?? 7,
    notes: overrides.notes,
    bodyMap: overrides.bodyMap ?? [],
  };
}

function bm(regionKey: string, severity: number): BodyMapSelection {
  return { regionKey, label: regionKey, view: "front", side: "left", severity };
}

// ── Tests ──

describe("calculateAcuteLoad", () => {
  it("sums load in the 7-day window", () => {
    const sessions = [
      makeSession({ date: "2026-04-04", sessionLoad: 400 }),
      makeSession({ date: "2026-04-03", sessionLoad: 300 }),
      makeSession({ date: "2026-03-29", sessionLoad: 500 }), // 6 days before 04-04
      makeSession({ date: "2026-03-28", sessionLoad: 200 }), // 7 days before = outside window
    ];
    expect(calculateAcuteLoad(sessions, "2026-04-04")).toBe(400 + 300 + 500);
  });

  it("returns 0 when no sessions in window", () => {
    const sessions = [makeSession({ date: "2026-01-01", sessionLoad: 999 })];
    expect(calculateAcuteLoad(sessions, "2026-04-04")).toBe(0);
  });

  it("includes asOfDate itself", () => {
    const sessions = [makeSession({ date: "2026-04-04", sessionLoad: 100 })];
    expect(calculateAcuteLoad(sessions, "2026-04-04")).toBe(100);
  });
});

describe("calculateChronicLoad", () => {
  it("returns total 28-day load divided by 4", () => {
    // 4 sessions of 500 each across 28 days → total 2000, chronic = 500
    const sessions = [
      makeSession({ date: "2026-04-04", sessionLoad: 500 }),
      makeSession({ date: "2026-03-28", sessionLoad: 500 }),
      makeSession({ date: "2026-03-21", sessionLoad: 500 }),
      makeSession({ date: "2026-03-14", sessionLoad: 500 }),
      makeSession({ date: "2026-03-07", sessionLoad: 999 }), // outside 28-day window
    ];
    expect(calculateChronicLoad(sessions, "2026-04-04")).toBe(2000 / 4);
  });

  it("returns 0 when no sessions in window", () => {
    expect(calculateChronicLoad([], "2026-04-04")).toBe(0);
  });
});

describe("calculateAcwr", () => {
  it("returns acute/chronic ratio rounded to 2 decimals", () => {
    // Build sessions spanning 14+ days so history check passes
    const sessions = [
      makeSession({ date: "2026-04-04", sessionLoad: 600 }),
      makeSession({ date: "2026-04-03", sessionLoad: 600 }), // acute = 1200
      makeSession({ date: "2026-03-20", sessionLoad: 400 }),
      makeSession({ date: "2026-03-15", sessionLoad: 400 }), // chronic total = 2000, /4 = 500
    ];
    const acwr = calculateAcwr(sessions, "2026-04-04");
    expect(acwr).not.toBeNull();
    // acute=1200, chronic=(600+600+400+400)/4=500
    expect(acwr).toBe(2.4);
  });

  it("returns null when fewer than 14 days of history", () => {
    const sessions = [
      makeSession({ date: "2026-04-04", sessionLoad: 600 }),
      makeSession({ date: "2026-03-25", sessionLoad: 400 }), // only 10 days back
    ];
    expect(calculateAcwr(sessions, "2026-04-04")).toBeNull();
  });

  it("returns null when chronic load is 0", () => {
    // Sessions exist but all have 0 load
    const sessions = [
      makeSession({ date: "2026-04-04", sessionLoad: 0 }),
      makeSession({ date: "2026-03-01", sessionLoad: 0 }), // 34 days back, passes history check
    ];
    expect(calculateAcwr(sessions, "2026-04-04")).toBeNull();
  });
});

describe("getLatestWellnessScore", () => {
  it("returns the most recent overallScore for a player", () => {
    const entries = [
      makeWellness({ date: "2026-04-03", overallScore: 6 }),
      makeWellness({ date: "2026-04-04", overallScore: 8 }),
      makeWellness({ date: "2026-04-02", overallScore: 5 }),
    ];
    expect(getLatestWellnessScore(entries, "p1")).toBe(8);
  });

  it("returns null when no entries for player", () => {
    expect(getLatestWellnessScore([], "p1")).toBeNull();
  });

  it("filters by playerId", () => {
    const entries = [
      makeWellness({ playerId: "p1", date: "2026-04-04", overallScore: 8 }),
      makeWellness({ playerId: "p2", date: "2026-04-04", overallScore: 3 }),
    ];
    expect(getLatestWellnessScore(entries, "p2")).toBe(3);
  });
});

describe("calculateWellnessTrend", () => {
  it("returns improving when recent scores are higher", () => {
    const entries = [
      makeWellness({ date: "2026-04-04", overallScore: 8 }),
      makeWellness({ date: "2026-04-03", overallScore: 8 }),
      makeWellness({ date: "2026-04-02", overallScore: 7.5 }),
      makeWellness({ date: "2026-04-01", overallScore: 5 }),
      makeWellness({ date: "2026-03-31", overallScore: 5 }),
      makeWellness({ date: "2026-03-30", overallScore: 5 }),
    ];
    expect(calculateWellnessTrend(entries, "p1", "2026-04-04")).toBe("improving");
  });

  it("returns declining when recent scores are lower", () => {
    const entries = [
      makeWellness({ date: "2026-04-04", overallScore: 4 }),
      makeWellness({ date: "2026-04-03", overallScore: 4 }),
      makeWellness({ date: "2026-04-02", overallScore: 4 }),
      makeWellness({ date: "2026-04-01", overallScore: 7 }),
      makeWellness({ date: "2026-03-31", overallScore: 7 }),
      makeWellness({ date: "2026-03-30", overallScore: 7 }),
    ];
    expect(calculateWellnessTrend(entries, "p1", "2026-04-04")).toBe("declining");
  });

  it("returns stable when scores are similar", () => {
    const entries = [
      makeWellness({ date: "2026-04-04", overallScore: 7 }),
      makeWellness({ date: "2026-04-03", overallScore: 7 }),
      makeWellness({ date: "2026-04-02", overallScore: 7 }),
      makeWellness({ date: "2026-04-01", overallScore: 7 }),
      makeWellness({ date: "2026-03-31", overallScore: 7 }),
      makeWellness({ date: "2026-03-30", overallScore: 7 }),
    ];
    expect(calculateWellnessTrend(entries, "p1", "2026-04-04")).toBe("stable");
  });

  it("returns stable when fewer than 2 entries", () => {
    const entries = [makeWellness({ date: "2026-04-04", overallScore: 3 })];
    expect(calculateWellnessTrend(entries, "p1", "2026-04-04")).toBe("stable");
  });
});

describe("calculateSorenessFlags", () => {
  it("flags muscles with severity >= 7 in last 3 days", () => {
    const entries = [
      makeWellness({ date: "2026-04-04", bodyMap: [bm("left_hamstring", 8)] }),
      makeWellness({ date: "2026-04-03", bodyMap: [] }),
    ];
    const flags = calculateSorenessFlags(entries, "p1", "2026-04-04");
    expect(flags).toHaveLength(1);
    expect(flags[0].regionKey).toBe("left_hamstring");
    expect(flags[0].latestSeverity).toBe(8);
    expect(flags[0].reason).toContain("Severity 8");
  });

  it("does not flag severity < 7", () => {
    const entries = [
      makeWellness({ date: "2026-04-04", bodyMap: [bm("left_hamstring", 6)] }),
    ];
    expect(calculateSorenessFlags(entries, "p1", "2026-04-04")).toHaveLength(0);
  });

  it("flags recurring muscles (3+ of last 5 entries)", () => {
    const entries = [
      makeWellness({ date: "2026-04-04", bodyMap: [bm("left_calf", 4)] }),
      makeWellness({ date: "2026-04-03", bodyMap: [bm("left_calf", 3)] }),
      makeWellness({ date: "2026-04-02", bodyMap: [bm("left_calf", 5)] }),
      makeWellness({ date: "2026-04-01", bodyMap: [] }),
      makeWellness({ date: "2026-03-31", bodyMap: [] }),
    ];
    const flags = calculateSorenessFlags(entries, "p1", "2026-04-04");
    expect(flags).toHaveLength(1);
    expect(flags[0].regionKey).toBe("left_calf");
    expect(flags[0].reason).toContain("3 of last 5");
  });

  it("does not double-flag a muscle matching both rules", () => {
    const entries = [
      makeWellness({ date: "2026-04-04", bodyMap: [bm("left_hamstring", 9)] }),
      makeWellness({ date: "2026-04-03", bodyMap: [bm("left_hamstring", 8)] }),
      makeWellness({ date: "2026-04-02", bodyMap: [bm("left_hamstring", 7)] }),
      makeWellness({ date: "2026-04-01", bodyMap: [bm("left_hamstring", 6)] }),
      makeWellness({ date: "2026-03-31", bodyMap: [bm("left_hamstring", 5)] }),
    ];
    const flags = calculateSorenessFlags(entries, "p1", "2026-04-04");
    expect(flags).toHaveLength(1); // high-severity rule catches it first
  });
});

describe("calculateRiskLevel", () => {
  it("returns critical when ACWR > 1.5", () => {
    expect(calculateRiskLevel(1.6, "stable", 0)).toBe("critical");
  });

  it("returns critical when ACWR > 1.3 and declining", () => {
    expect(calculateRiskLevel(1.4, "declining", 0)).toBe("critical");
  });

  it("returns high when ACWR > 1.3 alone", () => {
    expect(calculateRiskLevel(1.4, "stable", 0)).toBe("high");
  });

  it("returns high when 3+ soreness flags", () => {
    expect(calculateRiskLevel(1.0, "stable", 3)).toBe("high");
  });

  it("returns high when declining with any soreness", () => {
    expect(calculateRiskLevel(1.0, "declining", 1)).toBe("high");
  });

  it("returns moderate when ACWR < 0.8 (underprepared)", () => {
    expect(calculateRiskLevel(0.7, "stable", 0)).toBe("moderate");
  });

  it("returns moderate when 1-2 soreness flags", () => {
    expect(calculateRiskLevel(1.0, "stable", 1)).toBe("moderate");
  });

  it("returns moderate when declining with no flags", () => {
    expect(calculateRiskLevel(1.0, "declining", 0)).toBe("moderate");
  });

  it("returns low when everything is nominal", () => {
    expect(calculateRiskLevel(1.0, "stable", 0)).toBe("low");
    expect(calculateRiskLevel(1.1, "improving", 0)).toBe("low");
    expect(calculateRiskLevel(null, "stable", 0)).toBe("low");
  });
});

describe("calculatePlayerRiskSnapshot", () => {
  it("assembles a full snapshot from source data", () => {
    const sessions = [
      makeSession({ playerId: "p1", date: "2026-04-04", sessionLoad: 700 }),
      makeSession({ playerId: "p1", date: "2026-03-10", sessionLoad: 300 }), // history
    ];
    const entries = [
      makeWellness({ playerId: "p1", date: "2026-04-04", overallScore: 6.5, bodyMap: [bm("lower_back", 8)] }),
      makeWellness({ playerId: "p1", date: "2026-04-03", overallScore: 6 }),
    ];

    const snap = calculatePlayerRiskSnapshot("p1", sessions, entries, "2026-04-04");

    expect(snap.playerId).toBe("p1");
    expect(snap.acuteLoad).toBe(700);
    expect(snap.chronicLoad).toBe(1000 / 4); // (700+300)/4
    expect(snap.acwr).toBe(2.8); // 700/250
    expect(snap.latestWellnessScore).toBe(6.5);
    expect(snap.wellnessTrend).toBe("stable"); // only 2 entries, not enough for trend
    expect(snap.sorenessFlags).toHaveLength(1);
    expect(snap.sorenessFlags[0].regionKey).toBe("lower_back");
    expect(snap.riskLevel).toBe("critical"); // ACWR 2.8 > 1.5
    expect(snap.calculatedAt).toBeTruthy();
  });

  it("filters sessions by playerId", () => {
    const sessions = [
      makeSession({ playerId: "p1", date: "2026-04-04", sessionLoad: 500 }),
      makeSession({ playerId: "p2", date: "2026-04-04", sessionLoad: 999 }),
    ];
    const snap = calculatePlayerRiskSnapshot("p1", sessions, [], "2026-04-04");
    expect(snap.acuteLoad).toBe(500);
  });
});
