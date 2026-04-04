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
