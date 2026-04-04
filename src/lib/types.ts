export type PlayerStatus = "available" | "injured" | "resting";

export interface Player {
  id: string;
  name: string;
  position: string;
  number: number;
  age: number;
  status: PlayerStatus;
}

export interface WellnessEntry {
  id: string;
  playerId: string;
  date: string; // ISO date string YYYY-MM-DD
  fatigue: number; // 1-10, higher = better (less fatigued)
  soreness: number; // 1-10, higher = better (less sore)
  sleepQuality: number; // 1-10, higher = better
  recovery: number; // 1-10, higher = better
  stress: number; // 1-10, higher = better (less stressed)
  mood: number; // 1-10, higher = better
  notes?: string;
  overallScore: number; // average of 6 metrics
  bodyMap: BodyMapSelection[]; // per-muscle soreness (empty array if none)
}

export type WellnessMetric = keyof Pick<
  WellnessEntry,
  "fatigue" | "soreness" | "sleepQuality" | "recovery" | "stress" | "mood"
>;

export const WELLNESS_METRICS: {
  key: WellnessMetric;
  label: string;
  lowLabel: string;
  highLabel: string;
}[] = [
  { key: "fatigue", label: "Fatigue", lowLabel: "Exhausted", highLabel: "Fresh" },
  { key: "soreness", label: "Muscle Soreness", lowLabel: "Very sore", highLabel: "No soreness" },
  { key: "sleepQuality", label: "Sleep Quality", lowLabel: "Very poor", highLabel: "Excellent" },
  { key: "recovery", label: "Recovery", lowLabel: "Not recovered", highLabel: "Fully recovered" },
  { key: "stress", label: "Stress", lowLabel: "Very stressed", highLabel: "Relaxed" },
  { key: "mood", label: "Mood", lowLabel: "Very low", highLabel: "Great" },
];

// ── Body Map v2: Anatomical Muscle Map ─────────────────────

export type BodyMapView = "front" | "back";
export type BodySide = "left" | "right" | "center";

/**
 * Stored per wellness entry. Self-describing so consumers don't
 * need the region registry to render labels/context.
 */
export interface BodyMapSelection {
  regionKey: string;
  label: string;
  view: BodyMapView;
  side: BodySide | null;
  severity: number; // 1-10: 1 = minimal discomfort, 10 = severe pain
}

// ── Training / Workload ────────────────────────────────────

export type SessionType = "training" | "match" | "gym" | "recovery";

/**
 * A single training or match session for a player.
 * sessionLoad is derived: rpe × durationMinutes.
 */
export interface TrainingSession {
  id: string;
  playerId: string;
  date: string;             // ISO YYYY-MM-DD
  type: SessionType;
  durationMinutes: number;
  rpe: number;              // 1-10 (Borg CR-10)
  sessionLoad: number;      // DERIVED: rpe × durationMinutes (AU)
  notes?: string;
}

// ── Risk / Derived Metrics ─────────────────────────────────

export type TrendDirection = "improving" | "stable" | "declining";
export type RiskLevel = "low" | "moderate" | "high" | "critical";

/** A muscle flagged by the risk engine due to severity or recurrence. */
export interface SorenessFlag {
  regionKey: string;        // canonical muscle key
  label: string;
  reason: string;           // e.g. "severity 8+ in last 3 days"
  latestSeverity: number;
}

/**
 * Derived snapshot of a player's current risk profile.
 * Recalculated from source data; not user-editable.
 */
export interface PlayerRiskSnapshot {
  playerId: string;
  calculatedAt: string;     // ISO timestamp
  // Workload
  acuteLoad: number;        // sum sessionLoad last 7 days
  chronicLoad: number;      // avg weekly sessionLoad last 28 days
  acwr: number | null;      // acuteLoad / chronicLoad (null if insufficient data)
  // Wellness
  latestWellnessScore: number | null;
  wellnessTrend: TrendDirection;
  // Soreness
  sorenessFlags: SorenessFlag[];
  // Overall
  riskLevel: RiskLevel;
}
