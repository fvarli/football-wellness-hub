/**
 * Lightweight deterministic insights from player data.
 *
 * Rules are simple threshold-based comparisons.
 * Each rule returns an optional insight with a type (positive/warning/neutral).
 * No AI, no ML — just transparent logic a coach can verify.
 */

import type { PlayerRiskSnapshot, WellnessEntry, TrainingSession } from "./types";

export interface Insight {
  type: "positive" | "warning" | "neutral";
  text: string;
}

export function generatePlayerInsights(
  snap: PlayerRiskSnapshot,
  entries: WellnessEntry[],
  sessions: TrainingSession[],
): Insight[] {
  const insights: Insight[] = [];
  const recent3Sessions = sessions.slice(0, 3);

  // ── Wellness trend ──
  if (snap.wellnessTrend === "declining") {
    insights.push({ type: "warning", text: "Wellness scores are trending down over recent entries." });
  } else if (snap.wellnessTrend === "improving") {
    insights.push({ type: "positive", text: "Wellness scores are improving." });
  }

  // ── Low wellness score ──
  if (snap.latestWellnessScore !== null && snap.latestWellnessScore <= 4) {
    insights.push({ type: "warning", text: `Latest wellness score is low (${snap.latestWellnessScore.toFixed(1)}/10).` });
  } else if (snap.latestWellnessScore !== null && snap.latestWellnessScore >= 8) {
    insights.push({ type: "positive", text: `Wellness score is strong (${snap.latestWellnessScore.toFixed(1)}/10).` });
  }

  // ── Load spike ──
  if (recent3Sessions.length >= 2) {
    const latestLoad = recent3Sessions[0]?.sessionLoad ?? 0;
    const prevAvg = recent3Sessions.slice(1).reduce((s, e) => s + e.sessionLoad, 0) / (recent3Sessions.length - 1);
    if (prevAvg > 0 && latestLoad > prevAvg * 1.5) {
      insights.push({ type: "warning", text: `Latest session load (${latestLoad} AU) is significantly higher than recent average.` });
    }
  }

  // ── High peak load ──
  if (sessions.length > 0) {
    const peak = Math.max(...sessions.slice(0, 10).map((s) => s.sessionLoad));
    if (peak >= 700) {
      insights.push({ type: "warning", text: `Recent peak load is high (${peak} AU).` });
    }
  }

  // ── Combined: declining wellness + rising load ──
  if (snap.wellnessTrend === "declining" && recent3Sessions.length >= 2) {
    const loads = recent3Sessions.map((s) => s.sessionLoad);
    const loadRising = loads.length >= 2 && loads[0] > loads[loads.length - 1];
    if (loadRising) {
      insights.push({ type: "warning", text: "Declining wellness combined with increasing load — monitor recovery closely." });
    }
  }

  // ── Soreness flags ──
  if (snap.sorenessFlags.length >= 3) {
    insights.push({ type: "warning", text: `${snap.sorenessFlags.length} muscle groups flagged for soreness.` });
  } else if (snap.sorenessFlags.length === 0 && entries.length > 0) {
    insights.push({ type: "positive", text: "No muscle soreness flags." });
  }

  // ── ACWR ──
  if (snap.acwr !== null) {
    if (snap.acwr > 1.5) {
      insights.push({ type: "warning", text: `ACWR is high (${snap.acwr.toFixed(2)}) — injury risk elevated.` });
    } else if (snap.acwr >= 0.8 && snap.acwr <= 1.3) {
      insights.push({ type: "positive", text: `ACWR is in the optimal range (${snap.acwr.toFixed(2)}).` });
    } else if (snap.acwr < 0.8) {
      insights.push({ type: "neutral", text: `ACWR is low (${snap.acwr.toFixed(2)}) — player may be underprepared.` });
    }
  }

  // ── No data ──
  if (entries.length === 0 && sessions.length === 0) {
    return [{ type: "neutral", text: "No wellness or session data available yet." }];
  }

  return insights;
}
