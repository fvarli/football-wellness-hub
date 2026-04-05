/**
 * Squad-level deterministic insights from risk snapshot data.
 *
 * Takes the same snapshot array the dashboard already fetches and
 * produces coach-readable team-wide observations. No AI, no ML —
 * just transparent threshold logic.
 */

import type { PlayerRiskSnapshot, Player } from "./types";

export type SnapshotWithPlayer = PlayerRiskSnapshot & { player: Player };

export interface SquadInsight {
  type: "positive" | "warning" | "neutral";
  text: string;
  playerIds: string[];
}

export function generateSquadInsights(
  snapshots: SnapshotWithPlayer[],
): SquadInsight[] {
  if (snapshots.length === 0) return [];

  const insights: SquadInsight[] = [];

  // (a) Declining wellness
  const declining = snapshots.filter((s) => s.wellnessTrend === "declining");
  if (declining.length > 0) {
    insights.push({
      type: "warning",
      text: `${declining.length} player(s) with declining wellness trend`,
      playerIds: declining.map((s) => s.playerId),
    });
  }

  // (b) High ACWR (>1.3)
  const highAcwr = snapshots.filter((s) => s.acwr !== null && s.acwr > 1.3);
  if (highAcwr.length > 0) {
    insights.push({
      type: "warning",
      text: `${highAcwr.length} player(s) with high ACWR (>1.3)`,
      playerIds: highAcwr.map((s) => s.playerId),
    });
  }

  // (c) 3+ soreness flags
  const manySore = snapshots.filter((s) => s.sorenessFlags.length >= 3);
  if (manySore.length > 0) {
    insights.push({
      type: "warning",
      text: `${manySore.length} player(s) with 3+ soreness flags`,
      playerIds: manySore.map((s) => s.playerId),
    });
  }

  // (d) Low wellness (<=4)
  const lowWellness = snapshots.filter(
    (s) => s.latestWellnessScore !== null && s.latestWellnessScore <= 4,
  );
  if (lowWellness.length > 0) {
    insights.push({
      type: "warning",
      text: `${lowWellness.length} player(s) with low wellness score (\u22644)`,
      playerIds: lowWellness.map((s) => s.playerId),
    });
  }

  // (e) No recent wellness data
  const noData = snapshots.filter((s) => s.latestWellnessScore === null);
  if (noData.length > 0) {
    insights.push({
      type: "neutral",
      text: `${noData.length} player(s) with no recent wellness data`,
      playerIds: noData.map((s) => s.playerId),
    });
  }

  // (f) Overloaded while fatigued (declining wellness + ACWR >1.0)
  const overloaded = snapshots.filter(
    (s) => s.wellnessTrend === "declining" && s.acwr !== null && s.acwr > 1.0,
  );
  if (overloaded.length > 0) {
    insights.push({
      type: "warning",
      text: `${overloaded.length} player(s) overloaded while fatigued (declining wellness + ACWR >1.0)`,
      playerIds: overloaded.map((s) => s.playerId),
    });
  }

  // (g) All clear — only if no warnings were generated
  const hasWarnings = insights.some((i) => i.type === "warning");
  if (!hasWarnings) {
    insights.push({
      type: "positive",
      text: "All clear \u2014 no squad-level warnings at this time.",
      playerIds: [],
    });
  }

  return insights;
}
