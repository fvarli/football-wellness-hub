import { describe, it, expect } from "vitest";
import { generateSquadInsights, type SnapshotWithPlayer } from "@/lib/squad-insights";
import type { SorenessFlag } from "@/lib/types";

function makeSnap(overrides: Partial<SnapshotWithPlayer> & { playerId?: string; playerName?: string } = {}): SnapshotWithPlayer {
  const id = overrides.playerId ?? `p-${Math.random().toString(36).slice(2, 8)}`;
  return {
    playerId: id,
    calculatedAt: "2026-04-05T00:00:00Z",
    acuteLoad: 0,
    chronicLoad: 0,
    acwr: 1.0,
    latestWellnessScore: 7,
    wellnessTrend: "stable",
    sorenessFlags: [],
    riskLevel: "low",
    player: {
      id,
      name: overrides.playerName ?? "Test Player",
      position: "MF",
      number: 10,
      age: 25,
      status: "available",
    },
    ...overrides,
  } as SnapshotWithPlayer;
}

function flag(key: string): SorenessFlag {
  return { regionKey: key, label: key, reason: "test", latestSeverity: 7 };
}

function healthy() {
  return makeSnap({ wellnessTrend: "stable", acwr: 1.0, sorenessFlags: [], latestWellnessScore: 7 });
}

describe("generateSquadInsights", () => {
  it("returns empty array for empty input", () => {
    expect(generateSquadInsights([])).toEqual([]);
  });

  // Rule (a): declining wellness
  it("warns when players have declining wellness", () => {
    const snaps = [
      makeSnap({ playerId: "p1", wellnessTrend: "declining" }),
      makeSnap({ playerId: "p2", wellnessTrend: "declining" }),
      healthy(),
    ];
    const insights = generateSquadInsights(snaps);
    const match = insights.find((i) => i.text.includes("declining wellness"));
    expect(match).toBeDefined();
    expect(match!.type).toBe("warning");
    expect(match!.playerIds).toEqual(["p1", "p2"]);
  });

  it("does not warn about declining wellness when none declining", () => {
    const insights = generateSquadInsights([healthy(), healthy()]);
    expect(insights.find((i) => i.text.includes("declining wellness"))).toBeUndefined();
  });

  // Rule (b): high ACWR
  it("warns when players have ACWR >1.3", () => {
    const snaps = [makeSnap({ playerId: "p1", acwr: 1.5 }), healthy()];
    const match = generateSquadInsights(snaps).find((i) => i.text.includes("high ACWR"));
    expect(match).toBeDefined();
    expect(match!.playerIds).toEqual(["p1"]);
  });

  it("does not trigger high ACWR at exactly 1.3", () => {
    const snaps = [makeSnap({ acwr: 1.3 })];
    expect(generateSquadInsights(snaps).find((i) => i.text.includes("high ACWR"))).toBeUndefined();
  });

  // Rule (c): 3+ soreness flags
  it("warns when players have 3+ soreness flags", () => {
    const snaps = [
      makeSnap({ playerId: "p1", sorenessFlags: [flag("a"), flag("b"), flag("c")] }),
      makeSnap({ sorenessFlags: [flag("a"), flag("b")] }), // only 2 — should not match
    ];
    const match = generateSquadInsights(snaps).find((i) => i.text.includes("soreness flags"));
    expect(match).toBeDefined();
    expect(match!.playerIds).toHaveLength(1);
    expect(match!.playerIds[0]).toBe("p1");
  });

  // Rule (d): low wellness
  it("warns when players have low wellness (<=4)", () => {
    const snaps = [
      makeSnap({ playerId: "p1", latestWellnessScore: 3.5 }),
      makeSnap({ playerId: "p2", latestWellnessScore: 4 }),
      healthy(),
    ];
    const match = generateSquadInsights(snaps).find((i) => i.text.includes("low wellness"));
    expect(match).toBeDefined();
    expect(match!.playerIds).toEqual(["p1", "p2"]);
  });

  it("does not trigger low wellness at 4.1", () => {
    const snaps = [makeSnap({ latestWellnessScore: 4.1 })];
    expect(generateSquadInsights(snaps).find((i) => i.text.includes("low wellness"))).toBeUndefined();
  });

  // Rule (e): no recent data
  it("flags players with no recent wellness data as neutral", () => {
    const snaps = [makeSnap({ playerId: "p1", latestWellnessScore: null }), healthy()];
    const match = generateSquadInsights(snaps).find((i) => i.text.includes("no recent wellness"));
    expect(match).toBeDefined();
    expect(match!.type).toBe("neutral");
    expect(match!.playerIds).toEqual(["p1"]);
  });

  // Rule (f): overloaded while fatigued
  it("warns on declining wellness + ACWR >1.0", () => {
    const snaps = [makeSnap({ playerId: "p1", wellnessTrend: "declining", acwr: 1.2 })];
    const match = generateSquadInsights(snaps).find((i) => i.text.includes("overloaded while fatigued"));
    expect(match).toBeDefined();
    expect(match!.playerIds).toEqual(["p1"]);
  });

  it("does not trigger overloaded at ACWR exactly 1.0", () => {
    const snaps = [makeSnap({ wellnessTrend: "declining", acwr: 1.0 })];
    expect(generateSquadInsights(snaps).find((i) => i.text.includes("overloaded"))).toBeUndefined();
  });

  // Rule (g): all clear
  it("shows all-clear when no warnings exist", () => {
    const insights = generateSquadInsights([healthy(), healthy(), healthy()]);
    expect(insights).toHaveLength(1);
    expect(insights[0].type).toBe("positive");
    expect(insights[0].text).toContain("All clear");
  });

  it("does not show all-clear when warnings exist", () => {
    const snaps = [makeSnap({ wellnessTrend: "declining" }), healthy()];
    const insights = generateSquadInsights(snaps);
    expect(insights.find((i) => i.text.includes("All clear"))).toBeUndefined();
  });

  // playerIds correctness
  it("includes correct playerIds for each rule", () => {
    const snaps = [
      makeSnap({ playerId: "alpha", wellnessTrend: "declining" }),
      makeSnap({ playerId: "beta", wellnessTrend: "declining" }),
    ];
    const match = generateSquadInsights(snaps).find((i) => i.text.includes("declining"));
    expect(match!.playerIds).toEqual(["alpha", "beta"]);
  });
});
