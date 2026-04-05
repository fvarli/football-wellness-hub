import { describe, it, expect } from "vitest";
import { generatePlayerInsights } from "@/lib/insights";
import type { PlayerRiskSnapshot, WellnessEntry, TrainingSession } from "@/lib/types";

function makeSnap(overrides: Partial<PlayerRiskSnapshot> = {}): PlayerRiskSnapshot {
  return {
    playerId: "1",
    calculatedAt: "2026-04-05T00:00:00Z",
    acuteLoad: 0,
    chronicLoad: 0,
    acwr: null,
    latestWellnessScore: 7,
    wellnessTrend: "stable",
    sorenessFlags: [],
    riskLevel: "low",
    ...overrides,
  };
}

function makeEntry(overrides: Partial<WellnessEntry> = {}): WellnessEntry {
  return {
    id: "w1", playerId: "1", date: "2026-04-04",
    fatigue: 7, soreness: 7, sleepQuality: 7, recovery: 7, stress: 7, mood: 7,
    overallScore: 7, bodyMap: [],
    ...overrides,
  };
}

function makeSession(overrides: Partial<TrainingSession> = {}): TrainingSession {
  return {
    id: "ts1", playerId: "1", date: "2026-04-04",
    type: "training", durationMinutes: 75, rpe: 6, sessionLoad: 450,
    ...overrides,
  };
}

describe("generatePlayerInsights", () => {
  it("returns neutral message when no data", () => {
    const insights = generatePlayerInsights(makeSnap({ latestWellnessScore: null }), [], []);
    expect(insights).toHaveLength(1);
    expect(insights[0].type).toBe("neutral");
    expect(insights[0].text).toContain("No wellness or session data");
  });

  it("warns on declining wellness", () => {
    const insights = generatePlayerInsights(
      makeSnap({ wellnessTrend: "declining" }),
      [makeEntry()],
      [],
    );
    expect(insights.some((i) => i.type === "warning" && i.text.includes("trending down"))).toBe(true);
  });

  it("positive on improving wellness", () => {
    const insights = generatePlayerInsights(
      makeSnap({ wellnessTrend: "improving" }),
      [makeEntry()],
      [],
    );
    expect(insights.some((i) => i.type === "positive" && i.text.includes("improving"))).toBe(true);
  });

  it("warns on low wellness score", () => {
    const insights = generatePlayerInsights(
      makeSnap({ latestWellnessScore: 3.5 }),
      [makeEntry()],
      [],
    );
    expect(insights.some((i) => i.type === "warning" && i.text.includes("low"))).toBe(true);
  });

  it("positive on high wellness score", () => {
    const insights = generatePlayerInsights(
      makeSnap({ latestWellnessScore: 8.5 }),
      [makeEntry()],
      [],
    );
    expect(insights.some((i) => i.type === "positive" && i.text.includes("strong"))).toBe(true);
  });

  it("warns on load spike", () => {
    const insights = generatePlayerInsights(
      makeSnap(),
      [makeEntry()],
      [
        makeSession({ sessionLoad: 800, date: "2026-04-04" }),
        makeSession({ sessionLoad: 400, date: "2026-04-03" }),
        makeSession({ sessionLoad: 350, date: "2026-04-02" }),
      ],
    );
    expect(insights.some((i) => i.type === "warning" && i.text.includes("significantly higher"))).toBe(true);
  });

  it("warns on high peak load", () => {
    const insights = generatePlayerInsights(
      makeSnap(),
      [makeEntry()],
      [makeSession({ sessionLoad: 720 })],
    );
    expect(insights.some((i) => i.type === "warning" && i.text.includes("peak load is high"))).toBe(true);
  });

  it("warns on declining wellness + rising load", () => {
    const insights = generatePlayerInsights(
      makeSnap({ wellnessTrend: "declining" }),
      [makeEntry()],
      [
        makeSession({ sessionLoad: 600, date: "2026-04-04" }),
        makeSession({ sessionLoad: 400, date: "2026-04-03" }),
      ],
    );
    expect(insights.some((i) => i.text.includes("Declining wellness combined"))).toBe(true);
  });

  it("warns on multiple soreness flags", () => {
    const insights = generatePlayerInsights(
      makeSnap({ sorenessFlags: [
        { regionKey: "a", label: "A", reason: "r", latestSeverity: 8 },
        { regionKey: "b", label: "B", reason: "r", latestSeverity: 7 },
        { regionKey: "c", label: "C", reason: "r", latestSeverity: 6 },
      ] }),
      [makeEntry()],
      [],
    );
    expect(insights.some((i) => i.text.includes("3 muscle groups flagged"))).toBe(true);
  });

  it("positive on no soreness flags", () => {
    const insights = generatePlayerInsights(
      makeSnap({ sorenessFlags: [] }),
      [makeEntry()],
      [],
    );
    expect(insights.some((i) => i.type === "positive" && i.text.includes("No muscle soreness"))).toBe(true);
  });

  it("warns on high ACWR", () => {
    const insights = generatePlayerInsights(
      makeSnap({ acwr: 1.6 }),
      [makeEntry()],
      [],
    );
    expect(insights.some((i) => i.text.includes("ACWR is high"))).toBe(true);
  });

  it("positive on optimal ACWR", () => {
    const insights = generatePlayerInsights(
      makeSnap({ acwr: 1.1 }),
      [makeEntry()],
      [],
    );
    expect(insights.some((i) => i.type === "positive" && i.text.includes("optimal"))).toBe(true);
  });
});
