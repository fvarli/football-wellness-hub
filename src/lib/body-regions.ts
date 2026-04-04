/**
 * Anatomical muscle-map region definitions.
 *
 * VISUAL SOURCE
 * =============
 * Male front/back SVG anatomy derived from an anatomical muscle-map
 * reference. The original grouped muscles by name (e.g. "Shoulder" for
 * both sides). We split each group into laterality-aware canonical keys
 * where anatomically meaningful.
 *
 * SVG COORDINATE SYSTEMS
 * ======================
 * Front view: viewBox "0 0 180 505"  (≈ 179.84 × 504.36 in source)
 * Back view:  viewBox "0 0 153 502"  (≈ 153.02 × 501.95 in source)
 *
 * LATERALITY MAPPING
 * ==================
 * Source SVG group  →  App region keys
 * ─────────────────────────────────────
 * Shoulder (front)  →  left_shoulder, right_shoulder
 * Chest             →  chest  (center, single region)
 * Biceps            →  left_biceps, right_biceps
 * Arms/Forearms     →  left_forearm, right_forearm
 * Obliques          →  left_oblique, right_oblique
 * Abdominals        →  abdominals  (center)
 * Adductors         →  left_adductor, right_adductor
 * Quadriceps        →  left_quadriceps, right_quadriceps
 * Calves (front)    →  left_calf, right_calf
 * Traps (back)      →  traps  (center)
 * Shoulder (back)   →  left_shoulder_back, right_shoulder_back
 * Triceps           →  left_triceps, right_triceps
 * Arms (back)       →  left_forearm_back, right_forearm_back
 * Latissimus        →  left_latissimus, right_latissimus
 * Lower Back        →  lower_back  (center)
 * Glutes            →  left_glute, right_glute
 * Hamstrings        →  left_hamstring, right_hamstring
 * Calves (back)     →  left_calf_back, right_calf_back
 *
 * NOTE ON SHARED KEYS
 * ===================
 * Shoulders and forearms appear in both front and back views.
 * We use separate keys (left_shoulder vs left_shoulder_back) to allow
 * independent selection from each view. Calves similarly use left_calf
 * (front) vs left_calf_back (back). This keeps the data model clean
 * for future load/risk correlation per view context.
 *
 * FUTURE MILESTONES
 * =================
 * - Body Region Data: selections → backend storage
 * - Load/Risk Logic: regionKey is the join key for ACWR + injury-risk
 */

import type { BodyMapView, BodySide } from "./types";

// ── Region metadata (one entry per canonical key) ──

export interface MuscleRegionMeta {
  key: string;
  label: string;
  side: BodySide;
  group: string;
}

export const MUSCLE_REGIONS: MuscleRegionMeta[] = [
  // ── FRONT ──
  { key: "left_shoulder",     label: "L. Shoulder",    side: "left",   group: "shoulder" },
  { key: "right_shoulder",    label: "R. Shoulder",    side: "right",  group: "shoulder" },
  { key: "chest",             label: "Chest",          side: "center", group: "torso" },
  { key: "left_biceps",       label: "L. Biceps",      side: "left",   group: "arm" },
  { key: "right_biceps",      label: "R. Biceps",      side: "right",  group: "arm" },
  { key: "left_forearm",      label: "L. Forearm",     side: "left",   group: "arm" },
  { key: "right_forearm",     label: "R. Forearm",     side: "right",  group: "arm" },
  { key: "abdominals",        label: "Abdominals",     side: "center", group: "torso" },
  { key: "left_oblique",      label: "L. Oblique",     side: "left",   group: "torso" },
  { key: "right_oblique",     label: "R. Oblique",     side: "right",  group: "torso" },
  { key: "left_adductor",     label: "L. Adductor",    side: "left",   group: "leg" },
  { key: "right_adductor",    label: "R. Adductor",    side: "right",  group: "leg" },
  { key: "left_quadriceps",   label: "L. Quadriceps",  side: "left",   group: "leg" },
  { key: "right_quadriceps",  label: "R. Quadriceps",  side: "right",  group: "leg" },
  { key: "left_calf",         label: "L. Calf",        side: "left",   group: "leg" },
  { key: "right_calf",        label: "R. Calf",        side: "right",  group: "leg" },
  // ── BACK ──
  { key: "traps",             label: "Trapezius",      side: "center", group: "back" },
  { key: "left_shoulder_back",  label: "L. Rear Delt",  side: "left",   group: "shoulder" },
  { key: "right_shoulder_back", label: "R. Rear Delt",  side: "right",  group: "shoulder" },
  { key: "left_triceps",      label: "L. Triceps",     side: "left",   group: "arm" },
  { key: "right_triceps",     label: "R. Triceps",     side: "right",  group: "arm" },
  { key: "left_forearm_back", label: "L. Forearm",     side: "left",   group: "arm" },
  { key: "right_forearm_back",label: "R. Forearm",     side: "right",  group: "arm" },
  { key: "left_latissimus",   label: "L. Latissimus",  side: "left",   group: "back" },
  { key: "right_latissimus",  label: "R. Latissimus",  side: "right",  group: "back" },
  { key: "lower_back",        label: "Lower Back",     side: "center", group: "back" },
  { key: "left_glute",        label: "L. Glute",       side: "left",   group: "hip" },
  { key: "right_glute",       label: "R. Glute",       side: "right",  group: "hip" },
  { key: "left_hamstring",    label: "L. Hamstring",   side: "left",   group: "leg" },
  { key: "right_hamstring",   label: "R. Hamstring",   side: "right",  group: "leg" },
  { key: "left_calf_back",    label: "L. Calf",        side: "left",   group: "leg" },
  { key: "right_calf_back",   label: "R. Calf",        side: "right",  group: "leg" },
];

// ── Helpers ──

export function getRegionMeta(key: string): MuscleRegionMeta | undefined {
  return MUSCLE_REGIONS.find((r) => r.key === key);
}

/**
 * Returns the primary view for a region based on key naming.
 * Keys ending with _back are back-view regions.
 */
export function getPrimaryView(key: string): BodyMapView {
  const backKeys = [
    "traps", "lower_back",
    "left_shoulder_back", "right_shoulder_back",
    "left_triceps", "right_triceps",
    "left_forearm_back", "right_forearm_back",
    "left_latissimus", "right_latissimus",
    "left_glute", "right_glute",
    "left_hamstring", "right_hamstring",
    "left_calf_back", "right_calf_back",
  ];
  return backKeys.includes(key) ? "back" : "front";
}
