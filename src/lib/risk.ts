/**
 * Risk computation — pure functions for workload and injury-risk metrics.
 *
 * All functions are deterministic and side-effect-free. They accept
 * data arrays and an asOfDate, returning computed values. No global
 * state, no imports from mock-data.
 *
 * FORMULAS
 * ========
 * acuteLoad   = sum(sessionLoad) for sessions in [asOfDate - 6d, asOfDate]  (7-day window)
 * chronicLoad = sum(sessionLoad over 28 days) / 4                           (4-week avg weekly load)
 * acwr        = acuteLoad / chronicLoad                                     (null if chronicLoad=0 or <14 days of data)
 *
 * THRESHOLDS
 * ==========
 * ACWR risk bands (Blanchard & Gabbett simplified):
 *   < 0.8   → underprepared
 *   0.8–1.3 → optimal
 *   1.3–1.5 → caution
 *   > 1.5   → high risk
 *
 * Wellness trend: compare mean of last 3 entries to mean of prior 3 entries.
 *   diff > +0.5  → improving
 *   diff < -0.5  → declining
 *   otherwise    → stable
 *
 * Soreness flags: any muscle with severity >= 7 in the last 3 days,
 *   or appearing in 3+ of the last 5 entries.
 *
 * Risk level composite:
 *   critical → ACWR > 1.5 OR (ACWR > 1.3 AND declining wellness)
 *   high     → ACWR > 1.3 OR sorenessFlags.length >= 3 OR (declining AND sorenessFlags.length >= 1)
 *   moderate → ACWR outside 0.8–1.3 OR sorenessFlags.length >= 1 OR declining wellness
 *   low      → everything else
 */

import type {
  TrainingSession,
  WellnessEntry,
  PlayerRiskSnapshot,
  SorenessFlag,
  TrendDirection,
  RiskLevel,
} from "./types";

// ── Date helpers ──

function daysBefore(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function isInRange(dateStr: string, fromInclusive: string, toInclusive: string): boolean {
  return dateStr >= fromInclusive && dateStr <= toInclusive;
}

// ── Workload ──

/** Sum of sessionLoad in the 7-day window ending on asOfDate (inclusive). */
export function calculateAcuteLoad(sessions: TrainingSession[], asOfDate: string): number {
  const from = daysBefore(asOfDate, 6);
  return sessions
    .filter((s) => isInRange(s.date, from, asOfDate))
    .reduce((sum, s) => sum + s.sessionLoad, 0);
}

/** Average weekly sessionLoad over the 28-day window ending on asOfDate. */
export function calculateChronicLoad(sessions: TrainingSession[], asOfDate: string): number {
  const from = daysBefore(asOfDate, 27);
  const total = sessions
    .filter((s) => isInRange(s.date, from, asOfDate))
    .reduce((sum, s) => sum + s.sessionLoad, 0);
  return total / 4; // 4 weeks
}

/**
 * Acute:Chronic Workload Ratio.
 * Returns null if chronicLoad is 0 or fewer than 14 days of session history.
 */
export function calculateAcwr(sessions: TrainingSession[], asOfDate: string): number | null {
  const earliest = daysBefore(asOfDate, 13); // need at least 14 days
  const hasEnoughHistory = sessions.some((s) => s.date <= earliest);
  if (!hasEnoughHistory) return null;

  const chronic = calculateChronicLoad(sessions, asOfDate);
  if (chronic === 0) return null;

  const acute = calculateAcuteLoad(sessions, asOfDate);
  return Math.round((acute / chronic) * 100) / 100;
}

// ── Wellness ──

/** Most recent overallScore for a player, or null. */
export function getLatestWellnessScore(entries: WellnessEntry[], playerId: string): number | null {
  const sorted = entries
    .filter((e) => e.playerId === playerId)
    .sort((a, b) => b.date.localeCompare(a.date));
  return sorted[0]?.overallScore ?? null;
}

/**
 * Compare mean of last 3 wellness entries to mean of prior 3 entries.
 * If fewer than 2 entries exist, returns "stable".
 */
export function calculateWellnessTrend(
  entries: WellnessEntry[],
  playerId: string,
  asOfDate: string,
): TrendDirection {
  const sorted = entries
    .filter((e) => e.playerId === playerId && e.date <= asOfDate)
    .sort((a, b) => b.date.localeCompare(a.date));

  if (sorted.length < 2) return "stable";

  const recent = sorted.slice(0, 3);
  const prior = sorted.slice(3, 6);

  if (prior.length === 0) return "stable";

  const recentAvg = recent.reduce((s, e) => s + e.overallScore, 0) / recent.length;
  const priorAvg = prior.reduce((s, e) => s + e.overallScore, 0) / prior.length;
  const diff = recentAvg - priorAvg;

  if (diff > 0.5) return "improving";
  if (diff < -0.5) return "declining";
  return "stable";
}

// ── Soreness ──

/**
 * Flag muscles with:
 *  - severity >= 7 in the last 3 days, OR
 *  - appearing in 3+ of the last 5 wellness entries.
 */
export function calculateSorenessFlags(
  entries: WellnessEntry[],
  playerId: string,
  asOfDate: string,
): SorenessFlag[] {
  const sorted = entries
    .filter((e) => e.playerId === playerId && e.date <= asOfDate)
    .sort((a, b) => b.date.localeCompare(a.date));

  const last3Days = daysBefore(asOfDate, 2);
  const flags = new Map<string, SorenessFlag>();

  // Rule 1: high severity in last 3 days
  for (const entry of sorted.filter((e) => e.date >= last3Days)) {
    for (const bm of entry.bodyMap) {
      if (bm.severity >= 7 && !flags.has(bm.regionKey)) {
        flags.set(bm.regionKey, {
          regionKey: bm.regionKey,
          label: bm.label,
          reason: `Severity ${bm.severity} on ${entry.date}`,
          latestSeverity: bm.severity,
        });
      }
    }
  }

  // Rule 2: recurring in 3+ of last 5 entries
  const last5 = sorted.slice(0, 5);
  const regionCounts = new Map<string, { count: number; label: string; latestSev: number }>();
  for (const entry of last5) {
    const seen = new Set<string>();
    for (const bm of entry.bodyMap) {
      if (!seen.has(bm.regionKey)) {
        seen.add(bm.regionKey);
        const prev = regionCounts.get(bm.regionKey);
        regionCounts.set(bm.regionKey, {
          count: (prev?.count ?? 0) + 1,
          label: bm.label,
          latestSev: prev?.latestSev ?? bm.severity,
        });
      }
    }
  }
  for (const [key, val] of regionCounts) {
    if (val.count >= 3 && !flags.has(key)) {
      flags.set(key, {
        regionKey: key,
        label: val.label,
        reason: `Reported in ${val.count} of last 5 entries`,
        latestSeverity: val.latestSev,
      });
    }
  }

  return [...flags.values()].sort((a, b) => b.latestSeverity - a.latestSeverity);
}

// ── Risk level ──

/**
 * Rule-based composite risk level.
 * Inputs: ACWR (may be null), wellness trend, soreness flag count.
 */
export function calculateRiskLevel(
  acwr: number | null,
  trend: TrendDirection,
  flagCount: number,
): RiskLevel {
  // Critical
  if (acwr !== null && acwr > 1.5) return "critical";
  if (acwr !== null && acwr > 1.3 && trend === "declining") return "critical";

  // High
  if (acwr !== null && acwr > 1.3) return "high";
  if (flagCount >= 3) return "high";
  if (trend === "declining" && flagCount >= 1) return "high";

  // Moderate
  if (acwr !== null && (acwr < 0.8 || acwr > 1.3)) return "moderate";
  if (flagCount >= 1) return "moderate";
  if (trend === "declining") return "moderate";

  return "low";
}

// ── Snapshot ──

/** Build a full risk snapshot for a player from source data. */
export function calculatePlayerRiskSnapshot(
  playerId: string,
  sessions: TrainingSession[],
  wellnessEntries: WellnessEntry[],
  asOfDate: string,
): PlayerRiskSnapshot {
  const playerSessions = sessions.filter((s) => s.playerId === playerId);

  const acuteLoad = calculateAcuteLoad(playerSessions, asOfDate);
  const chronicLoad = calculateChronicLoad(playerSessions, asOfDate);
  const acwr = calculateAcwr(playerSessions, asOfDate);
  const latestWellnessScore = getLatestWellnessScore(wellnessEntries, playerId);
  const wellnessTrend = calculateWellnessTrend(wellnessEntries, playerId, asOfDate);
  const sorenessFlags = calculateSorenessFlags(wellnessEntries, playerId, asOfDate);
  const riskLevel = calculateRiskLevel(acwr, wellnessTrend, sorenessFlags.length);

  return {
    playerId,
    calculatedAt: new Date().toISOString(),
    acuteLoad,
    chronicLoad,
    acwr,
    latestWellnessScore,
    wellnessTrend,
    sorenessFlags,
    riskLevel,
  };
}
