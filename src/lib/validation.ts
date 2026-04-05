/**
 * Input validation for write operations.
 *
 * Pure functions — no side effects, no database calls.
 * Each validator returns { ok: true, data } or { ok: false, errors }.
 *
 * Contracts:
 * - Wellness check-in: 6 metrics (1-10), optional bodyMap, optional notes
 * - Training session:  type, durationMinutes, rpe (sessionLoad derived server-side)
 *
 * Body map rules:
 * - Every regionKey must exist in MUSCLE_REGIONS
 * - No duplicate regionKey in a single submission
 * - Severity 1-10
 */

import type { BodyMapView, BodySide, SessionType } from "./types";
import { MUSCLE_REGIONS } from "./body-regions";

// ── Result type ──

export interface WriteError {
  field?: string;   // omitted for form-level errors
  message: string;
}

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; errors: WriteError[] };

// ── Wellness check-in input ──

export interface WellnessCheckInInput {
  playerId: string;
  date: string;
  fatigue: number;
  soreness: number;
  sleepQuality: number;
  recovery: number;
  stress: number;
  mood: number;
  notes?: string;
  bodyMap?: BodyMapSelectionInput[];
}

export interface BodyMapSelectionInput {
  regionKey: string;
  severity: number;
  view: BodyMapView;
  side: BodySide | null;
}

/** Validated output — includes derived fields. */
export interface ValidatedWellnessCheckIn {
  playerId: string;
  date: string;
  fatigue: number;
  soreness: number;
  sleepQuality: number;
  recovery: number;
  stress: number;
  mood: number;
  overallScore: number;
  notes?: string;
  bodyMap: ValidatedBodyMapSelection[];
}

export interface ValidatedBodyMapSelection {
  regionKey: string;
  label: string;
  view: BodyMapView;
  side: BodySide | null;
  severity: number;
}

// ── Training session input ──

export interface TrainingSessionInput {
  playerId: string;
  date: string;
  type: SessionType;
  durationMinutes: number;
  rpe: number;
  notes?: string;
}

/** Validated output — includes derived sessionLoad. */
export interface ValidatedTrainingSession {
  playerId: string;
  date: string;
  type: SessionType;
  durationMinutes: number;
  rpe: number;
  sessionLoad: number;
  notes?: string;
}

// ── Helpers ──

const VALID_REGION_KEYS = new Set(MUSCLE_REGIONS.map((r) => r.key));
const VALID_SESSION_TYPES: SessionType[] = ["training", "match", "gym", "recovery"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function inRange(v: unknown, min: number, max: number): v is number {
  return typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;
}

// ── Validators ──

export function validateWellnessCheckIn(
  input: unknown,
): ValidationResult<ValidatedWellnessCheckIn> {
  const errors: WriteError[] = [];

  if (typeof input !== "object" || input === null) {
    return { ok: false, errors: [{ message: "Input must be an object" }] };
  }

  const raw = input as Record<string, unknown>;

  if (typeof raw.playerId !== "string" || raw.playerId.length === 0) {
    errors.push({ field: "playerId", message: "playerId is required" });
  }

  if (typeof raw.date !== "string" || !DATE_RE.test(raw.date)) {
    errors.push({ field: "date", message: "date must be YYYY-MM-DD format" });
  }

  const metrics = ["fatigue", "soreness", "sleepQuality", "recovery", "stress", "mood"] as const;
  for (const m of metrics) {
    if (!inRange(raw[m], 1, 10)) {
      errors.push({ field: m, message: `${m} must be an integer 1-10` });
    }
  }

  if (raw.notes !== undefined && typeof raw.notes !== "string") {
    errors.push({ field: "notes", message: "notes must be a string if provided" });
  }

  const bodyMapInput = raw.bodyMap;
  const validatedBodyMap: ValidatedBodyMapSelection[] = [];

  if (bodyMapInput !== undefined) {
    if (!Array.isArray(bodyMapInput)) {
      errors.push({ field: "bodyMap", message: "bodyMap must be an array if provided" });
    } else {
      const seenKeys = new Set<string>();

      for (let i = 0; i < bodyMapInput.length; i++) {
        const sel = bodyMapInput[i] as Record<string, unknown>;

        if (typeof sel !== "object" || sel === null) {
          errors.push({ field: `bodyMap[${i}]`, message: "must be an object" });
          continue;
        }

        const rk = sel.regionKey;
        if (typeof rk !== "string" || !VALID_REGION_KEYS.has(rk)) {
          errors.push({ field: `bodyMap[${i}].regionKey`, message: `invalid regionKey "${String(rk)}"` });
          continue;
        }

        if (seenKeys.has(rk)) {
          errors.push({ field: `bodyMap[${i}].regionKey`, message: `duplicate regionKey "${rk}"` });
          continue;
        }
        seenKeys.add(rk);

        if (!inRange(sel.severity, 1, 10)) {
          errors.push({ field: `bodyMap[${i}].severity`, message: "severity must be an integer 1-10" });
          continue;
        }

        const meta = MUSCLE_REGIONS.find((r) => r.key === rk)!;
        validatedBodyMap.push({
          regionKey: rk,
          label: meta.label,
          view: (sel.view as BodyMapView) ?? "front",
          side: (sel.side as BodySide | null) ?? meta.side,
          severity: sel.severity as number,
        });
      }
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const f = raw as Record<string, number>;
  const overallScore =
    Math.round(
      ((f.fatigue + f.soreness + f.sleepQuality + f.recovery + f.stress + f.mood) / 6) * 10,
    ) / 10;

  return {
    ok: true,
    data: {
      playerId: raw.playerId as string,
      date: raw.date as string,
      fatigue: f.fatigue,
      soreness: f.soreness,
      sleepQuality: f.sleepQuality,
      recovery: f.recovery,
      stress: f.stress,
      mood: f.mood,
      overallScore,
      notes: raw.notes as string | undefined,
      bodyMap: validatedBodyMap,
    },
  };
}

export function validateTrainingSession(
  input: unknown,
): ValidationResult<ValidatedTrainingSession> {
  const errors: WriteError[] = [];

  if (typeof input !== "object" || input === null) {
    return { ok: false, errors: [{ message: "Input must be an object" }] };
  }

  const raw = input as Record<string, unknown>;

  if (typeof raw.playerId !== "string" || raw.playerId.length === 0) {
    errors.push({ field: "playerId", message: "playerId is required" });
  }

  if (typeof raw.date !== "string" || !DATE_RE.test(raw.date)) {
    errors.push({ field: "date", message: "date must be YYYY-MM-DD format" });
  }

  if (typeof raw.type !== "string" || !VALID_SESSION_TYPES.includes(raw.type as SessionType)) {
    errors.push({ field: "type", message: `type must be one of: ${VALID_SESSION_TYPES.join(", ")}` });
  }

  if (!inRange(raw.durationMinutes, 1, 600)) {
    errors.push({ field: "durationMinutes", message: "durationMinutes must be an integer 1-600" });
  }

  if (!inRange(raw.rpe, 1, 10)) {
    errors.push({ field: "rpe", message: "rpe must be an integer 1-10" });
  }

  if (raw.notes !== undefined && typeof raw.notes !== "string") {
    errors.push({ field: "notes", message: "notes must be a string if provided" });
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const dur = raw.durationMinutes as number;
  const rpe = raw.rpe as number;

  return {
    ok: true,
    data: {
      playerId: raw.playerId as string,
      date: raw.date as string,
      type: raw.type as SessionType,
      durationMinutes: dur,
      rpe,
      sessionLoad: rpe * dur,
      notes: raw.notes as string | undefined,
    },
  };
}

// ── Bulk training session validation ──

export function validateBulkTrainingSessions(
  input: unknown,
): ValidationResult<ValidatedTrainingSession[]> {
  if (typeof input !== "object" || input === null) {
    return { ok: false, errors: [{ message: "Input must be an object" }] };
  }

  const raw = input as Record<string, unknown>;
  const errors: WriteError[] = [];

  // Validate playerIds
  if (!Array.isArray(raw.playerIds)) {
    return { ok: false, errors: [{ field: "playerIds", message: "playerIds must be an array" }] };
  }

  if (raw.playerIds.length === 0) {
    return { ok: false, errors: [{ field: "playerIds", message: "playerIds must not be empty" }] };
  }

  for (let i = 0; i < raw.playerIds.length; i++) {
    const pid = raw.playerIds[i];
    if (typeof pid !== "string" || pid.trim().length === 0) {
      errors.push({ field: `playerIds[${i}]`, message: "each playerId must be a non-empty string" });
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const playerIds = raw.playerIds as string[];
  const uniqueIds = new Set(playerIds);
  if (uniqueIds.size !== playerIds.length) {
    return { ok: false, errors: [{ field: "playerIds", message: "playerIds must not contain duplicates" }] };
  }

  // Validate shared fields using the first player — all share the same fields
  const sharedFields = { date: raw.date, type: raw.type, durationMinutes: raw.durationMinutes, rpe: raw.rpe, notes: raw.notes };
  const probe = validateTrainingSession({ playerId: playerIds[0], ...sharedFields });
  if (!probe.ok) return probe;

  // Build validated array for all players
  const validated: ValidatedTrainingSession[] = playerIds.map((pid) => ({
    ...probe.data,
    playerId: pid,
  }));

  return { ok: true, data: validated };
}
