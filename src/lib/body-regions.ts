/**
 * Anatomical muscle-map region definitions.
 *
 * CANONICAL REGION MODEL
 * ======================
 * Each muscle has ONE canonical key regardless of how many SVG views
 * it appears in. View is metadata, not identity.
 *
 * Same muscle = same key, even if it has SVG paths in both front
 * and back views (e.g. shoulders, forearms, calves).
 *
 * VISUAL SOURCE
 * =============
 * Male front/back SVG anatomy derived from an anatomical muscle-map
 * reference. The original grouped muscles by name (e.g. "Shoulder"
 * for both sides). Each group is split into laterality-aware keys.
 *
 * SVG COORDINATE SYSTEMS
 * ======================
 * Front view: viewBox "0 0 180 505"
 * Back view:  viewBox "0 0 153 502"
 *
 * CANONICAL KEY → SVG VIEW MAPPING
 * ================================
 * Key                   Front   Back    Notes
 * ─────────────────────────────────────────────
 * left_shoulder         ✓       ✓       front delt / rear delt
 * right_shoulder        ✓       ✓
 * chest                 ✓               pectorals
 * left_biceps           ✓               front upper arm
 * right_biceps          ✓
 * left_forearm          ✓       ✓       anterior / posterior forearm
 * right_forearm         ✓       ✓
 * abdominals            ✓               rectus abdominis
 * left_oblique          ✓               external oblique
 * right_oblique         ✓
 * left_adductor         ✓               inner thigh
 * right_adductor        ✓
 * left_quadriceps       ✓               front thigh
 * right_quadriceps      ✓
 * left_calf             ✓       ✓       tibialis (front) / gastrocnemius (back)
 * right_calf            ✓       ✓
 * traps                         ✓       trapezius
 * left_triceps                  ✓       back upper arm
 * right_triceps                 ✓
 * left_latissimus               ✓       latissimus dorsi
 * right_latissimus              ✓
 * lower_back                    ✓       erector spinae / lumbar
 * left_glute                    ✓       gluteus maximus
 * right_glute                   ✓
 * left_hamstring                ✓       posterior thigh
 * right_hamstring               ✓
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
  // Shoulder (appears in both views)
  { key: "left_shoulder",     label: "L. Shoulder",    side: "left",   group: "shoulder" },
  { key: "right_shoulder",    label: "R. Shoulder",    side: "right",  group: "shoulder" },
  // Front-only upper body
  { key: "chest",             label: "Chest",          side: "center", group: "torso" },
  { key: "left_biceps",       label: "L. Biceps",      side: "left",   group: "arm" },
  { key: "right_biceps",      label: "R. Biceps",      side: "right",  group: "arm" },
  // Forearm (appears in both views)
  { key: "left_forearm",      label: "L. Forearm",     side: "left",   group: "arm" },
  { key: "right_forearm",     label: "R. Forearm",     side: "right",  group: "arm" },
  // Front-only torso
  { key: "abdominals",        label: "Abdominals",     side: "center", group: "torso" },
  { key: "left_oblique",      label: "L. Oblique",     side: "left",   group: "torso" },
  { key: "right_oblique",     label: "R. Oblique",     side: "right",  group: "torso" },
  // Front-only legs
  { key: "left_adductor",     label: "L. Adductor",    side: "left",   group: "leg" },
  { key: "right_adductor",    label: "R. Adductor",    side: "right",  group: "leg" },
  { key: "left_quadriceps",   label: "L. Quadriceps",  side: "left",   group: "leg" },
  { key: "right_quadriceps",  label: "R. Quadriceps",  side: "right",  group: "leg" },
  // Calf (appears in both views)
  { key: "left_calf",         label: "L. Calf",        side: "left",   group: "leg" },
  { key: "right_calf",        label: "R. Calf",        side: "right",  group: "leg" },
  // Back-only upper body
  { key: "traps",             label: "Trapezius",      side: "center", group: "back" },
  { key: "left_triceps",      label: "L. Triceps",     side: "left",   group: "arm" },
  { key: "right_triceps",     label: "R. Triceps",     side: "right",  group: "arm" },
  { key: "left_latissimus",   label: "L. Latissimus",  side: "left",   group: "back" },
  { key: "right_latissimus",  label: "R. Latissimus",  side: "right",  group: "back" },
  { key: "lower_back",        label: "Lower Back",     side: "center", group: "back" },
  // Back-only hip/legs
  { key: "left_glute",        label: "L. Glute",       side: "left",   group: "hip" },
  { key: "right_glute",       label: "R. Glute",       side: "right",  group: "hip" },
  { key: "left_hamstring",    label: "L. Hamstring",   side: "left",   group: "leg" },
  { key: "right_hamstring",   label: "R. Hamstring",   side: "right",  group: "leg" },
];

// ── View presence: which views each canonical key has SVG paths in ──

const REGION_VIEWS: Record<string, BodyMapView[]> = {
  left_shoulder:    ["front", "back"],
  right_shoulder:   ["front", "back"],
  chest:            ["front"],
  left_biceps:      ["front"],
  right_biceps:     ["front"],
  left_forearm:     ["front", "back"],
  right_forearm:    ["front", "back"],
  abdominals:       ["front"],
  left_oblique:     ["front"],
  right_oblique:    ["front"],
  left_adductor:    ["front"],
  right_adductor:   ["front"],
  left_quadriceps:  ["front"],
  right_quadriceps: ["front"],
  left_calf:        ["front", "back"],
  right_calf:       ["front", "back"],
  traps:            ["back"],
  left_triceps:     ["back"],
  right_triceps:    ["back"],
  left_latissimus:  ["back"],
  right_latissimus: ["back"],
  lower_back:       ["back"],
  left_glute:       ["back"],
  right_glute:      ["back"],
  left_hamstring:   ["back"],
  right_hamstring:  ["back"],
};

// ── Helpers ──

export function getRegionMeta(key: string): MuscleRegionMeta | undefined {
  return MUSCLE_REGIONS.find((r) => r.key === key);
}

/** Which views contain SVG paths for this region. */
export function getRegionViews(key: string): BodyMapView[] {
  return REGION_VIEWS[key] ?? [];
}

/**
 * Returns the "preferred" view for a region — used when the UI needs
 * to auto-switch tabs after selecting a region from the summary list.
 * For multi-view regions the first listed view wins (front).
 */
export function getPrimaryView(key: string): BodyMapView {
  const views = REGION_VIEWS[key];
  return views?.[0] ?? "front";
}
