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

// ── Body Map ────────────────────────────────────────────────

export type BodyView = "front" | "back";

export interface BodyRegionDef {
  id: string;
  label: string;
  view: BodyView;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

export interface BodyMapSelection {
  regionId: string;
  severity: number; // 1-10: 1 = minimal discomfort, 10 = severe pain
}

export const BODY_REGIONS: BodyRegionDef[] = [
  // Front view
  { id: "left-shoulder",  label: "L. Shoulder",  view: "front", cx: 54,  cy: 96,  rx: 14, ry: 12 },
  { id: "right-shoulder", label: "R. Shoulder",  view: "front", cx: 146, cy: 96,  rx: 14, ry: 12 },
  { id: "groin",          label: "Groin",         view: "front", cx: 100, cy: 210, rx: 16, ry: 10 },
  { id: "left-quad",      label: "L. Quadricep",  view: "front", cx: 82,  cy: 252, rx: 12, ry: 28 },
  { id: "right-quad",     label: "R. Quadricep",  view: "front", cx: 118, cy: 252, rx: 12, ry: 28 },
  { id: "left-knee",      label: "L. Knee",       view: "front", cx: 80,  cy: 302, rx: 10, ry: 14 },
  { id: "right-knee",     label: "R. Knee",       view: "front", cx: 120, cy: 302, rx: 10, ry: 14 },
  { id: "left-ankle",     label: "L. Ankle",      view: "front", cx: 74,  cy: 380, rx: 8,  ry: 10 },
  { id: "right-ankle",    label: "R. Ankle",      view: "front", cx: 126, cy: 380, rx: 8,  ry: 10 },
  // Back view
  { id: "lower-back",      label: "Lower Back",    view: "back", cx: 100, cy: 165, rx: 22, ry: 18 },
  { id: "left-hamstring",  label: "L. Hamstring",  view: "back", cx: 82,  cy: 252, rx: 12, ry: 28 },
  { id: "right-hamstring", label: "R. Hamstring",  view: "back", cx: 118, cy: 252, rx: 12, ry: 28 },
  { id: "left-calf",       label: "L. Calf",       view: "back", cx: 78,  cy: 345, rx: 10, ry: 22 },
  { id: "right-calf",      label: "R. Calf",       view: "back", cx: 122, cy: 345, rx: 10, ry: 22 },
];
