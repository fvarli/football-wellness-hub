/**
 * Data access service — the single entry point for all data reads and writes.
 *
 * Backed by Prisma + PostgreSQL. Body map selections are stored as normalized
 * child rows but assembled into WellnessEntry.bodyMap arrays on read.
 *
 * Design decisions:
 * - All functions are async (database-backed).
 * - Write methods validate input via validation.ts, then persist via Prisma.
 * - Risk snapshots are computed on-the-fly from persisted source data.
 * - MOCK_AS_OF is kept for backward compat; pages should migrate to real dates.
 *
 * Growth path:
 * If this file grows beyond ~20 functions, split by domain into
 * data/players.ts, data/wellness.ts, data/sessions.ts, data/risk.ts
 * and re-export from this file so page imports stay unchanged.
 */

import type {
  Player,
  WellnessEntry,
  TrainingSession,
  PlayerRiskSnapshot,
  RiskLevel,
  BodyMapSelection,
} from "@/lib/types";
import { calculatePlayerRiskSnapshot } from "@/lib/risk";
import {
  validateWellnessCheckIn,
  validateTrainingSession,
  validateBulkTrainingSessions,
  type ValidationResult,
  type WriteError,
  type ValidatedWellnessCheckIn,
  type ValidatedTrainingSession,
} from "@/lib/validation";
import { prisma } from "@/lib/db";

/** Reference date for risk computations. Will become today's date once data is live. */
export const MOCK_AS_OF = new Date().toISOString().slice(0, 10);

// ── Mappers (DB rows → app types) ──

function mapPlayer(row: {
  id: string; name: string; position: string; number: number; age: number; status: string;
}): Player {
  return { id: row.id, name: row.name, position: row.position, number: row.number, age: row.age, status: row.status as Player["status"] };
}

function mapWellnessEntry(row: {
  id: string; playerId: string; date: string;
  fatigue: number; soreness: number; sleepQuality: number; recovery: number; stress: number; mood: number;
  overallScore: number; notes: string | null;
  bodyMapSelections: { regionKey: string; label: string; view: string; side: string | null; severity: number }[];
}): WellnessEntry {
  return {
    id: row.id,
    playerId: row.playerId,
    date: row.date,
    fatigue: row.fatigue,
    soreness: row.soreness,
    sleepQuality: row.sleepQuality,
    recovery: row.recovery,
    stress: row.stress,
    mood: row.mood,
    overallScore: row.overallScore,
    notes: row.notes ?? undefined,
    bodyMap: row.bodyMapSelections.map((s) => ({
      regionKey: s.regionKey,
      label: s.label,
      view: s.view as BodyMapSelection["view"],
      side: s.side as BodyMapSelection["side"],
      severity: s.severity,
    })),
  };
}

function mapSession(row: {
  id: string; playerId: string; date: string; type: string;
  durationMinutes: number; rpe: number; sessionLoad: number; notes: string | null;
}): TrainingSession {
  return {
    id: row.id,
    playerId: row.playerId,
    date: row.date,
    type: row.type as TrainingSession["type"],
    durationMinutes: row.durationMinutes,
    rpe: row.rpe,
    sessionLoad: row.sessionLoad,
    notes: row.notes ?? undefined,
  };
}

// ── Player ──

export async function getAllPlayers(): Promise<Player[]> {
  const rows = await prisma.player.findMany({ orderBy: { name: "asc" } });
  return rows.map(mapPlayer);
}

export async function getPlayerById(id: string): Promise<Player | undefined> {
  const row = await prisma.player.findUnique({ where: { id } });
  return row ? mapPlayer(row) : undefined;
}

// ── Wellness ──

const WELLNESS_INCLUDE = { bodyMapSelections: true } as const;

export async function getWellnessForPlayer(playerId: string): Promise<WellnessEntry[]> {
  const rows = await prisma.wellnessEntry.findMany({
    where: { playerId },
    include: WELLNESS_INCLUDE,
    orderBy: { date: "desc" },
  });
  return rows.map(mapWellnessEntry);
}

export async function getLatestWellness(playerId: string): Promise<WellnessEntry | undefined> {
  const row = await prisma.wellnessEntry.findFirst({
    where: { playerId },
    include: WELLNESS_INCLUDE,
    orderBy: { date: "desc" },
  });
  return row ? mapWellnessEntry(row) : undefined;
}

export async function getAllLatestWellness(): Promise<(WellnessEntry & { player: Player })[]> {
  const players = await getAllPlayers();
  const result: (WellnessEntry & { player: Player })[] = [];
  for (const player of players) {
    const latest = await getLatestWellness(player.id);
    if (latest) result.push({ ...latest, player });
  }
  return result;
}

// ── Training Sessions ──

export async function getAllSessions(): Promise<(TrainingSession & { playerName: string })[]> {
  const rows = await prisma.trainingSession.findMany({
    include: { player: true },
    orderBy: [{ date: "desc" }, { player: { name: "asc" } }],
  });
  return rows.map((r) => ({ ...mapSession(r), playerName: r.player.name }));
}

export async function getSessionsForPlayer(playerId: string): Promise<TrainingSession[]> {
  const rows = await prisma.trainingSession.findMany({
    where: { playerId },
    orderBy: { date: "desc" },
  });
  return rows.map(mapSession);
}

// ── Risk Snapshots (computed from persisted source data, not stored) ──

const RISK_ORDER: Record<RiskLevel, number> = { critical: 0, high: 1, moderate: 2, low: 3 };

export async function getRiskSnapshot(playerId: string, asOf: string = MOCK_AS_OF): Promise<PlayerRiskSnapshot> {
  const sessions = await getSessionsForPlayer(playerId);
  const entries = await getWellnessForPlayer(playerId);
  return calculatePlayerRiskSnapshot(playerId, sessions, entries, asOf);
}

export async function getAllRiskSnapshots(
  asOf: string = MOCK_AS_OF,
): Promise<(PlayerRiskSnapshot & { player: Player })[]> {
  const players = await getAllPlayers();
  // Batch-load all data for efficiency
  const allSessions = await prisma.trainingSession.findMany();
  const allEntries = await prisma.wellnessEntry.findMany({ include: WELLNESS_INCLUDE });
  const sessionsMapped = allSessions.map(mapSession);
  const entriesMapped = allEntries.map(mapWellnessEntry);

  return players.map((p) => ({
    ...calculatePlayerRiskSnapshot(
      p.id,
      sessionsMapped.filter((s) => s.playerId === p.id),
      entriesMapped.filter((e) => e.playerId === p.id),
      asOf,
    ),
    player: p,
  }));
}

export async function getAllRiskSnapshotsSorted(
  asOf: string = MOCK_AS_OF,
): Promise<(PlayerRiskSnapshot & { player: Player })[]> {
  const snapshots = await getAllRiskSnapshots(asOf);
  return snapshots.sort((a, b) =>
    (RISK_ORDER[a.riskLevel] - RISK_ORDER[b.riskLevel])
    || (b.sorenessFlags.length - a.sorenessFlags.length)
    || ((a.latestWellnessScore ?? 99) - (b.latestWellnessScore ?? 99))
    || a.player.name.localeCompare(b.player.name)
  );
}

// ── Writes ──

export async function submitWellnessCheckIn(
  input: unknown,
): Promise<ValidationResult<WellnessEntry>> {
  const result = validateWellnessCheckIn(input);
  if (!result.ok) return result;

  const d = result.data;

  // Business rule: one wellness entry per player per day
  const existing = await prisma.wellnessEntry.findUnique({
    where: { playerId_date: { playerId: d.playerId, date: d.date } },
  });
  if (existing) {
    return {
      ok: false,
      errors: [{ field: "date", message: `A check-in already exists for this player on ${d.date}` }],
    };
  }

  const row = await prisma.wellnessEntry.create({
    data: {
      playerId: d.playerId,
      date: d.date,
      fatigue: d.fatigue,
      soreness: d.soreness,
      sleepQuality: d.sleepQuality,
      recovery: d.recovery,
      stress: d.stress,
      mood: d.mood,
      overallScore: d.overallScore,
      notes: d.notes ?? null,
      bodyMapSelections: {
        create: d.bodyMap.map((bm) => ({
          regionKey: bm.regionKey,
          label: bm.label,
          view: bm.view,
          side: bm.side,
          severity: bm.severity,
        })),
      },
    },
    include: WELLNESS_INCLUDE,
  });

  return { ok: true, data: mapWellnessEntry(row) };
}

/**
 * Update an existing wellness check-in by entry ID.
 * Validates input, replaces body map child rows, recomputes overallScore.
 * Returns the updated entry or validation/business-rule errors.
 */
export async function updateWellnessCheckIn(
  entryId: string,
  input: unknown,
): Promise<ValidationResult<WellnessEntry>> {
  const result = validateWellnessCheckIn(input);
  if (!result.ok) return result;

  const d = result.data;

  const existing = await prisma.wellnessEntry.findUnique({
    where: { id: entryId },
  });
  if (!existing) {
    return {
      ok: false,
      errors: [{ field: "id", message: `Wellness entry ${entryId} not found` }],
    };
  }

  // Ensure the playerId matches (prevent cross-player edits)
  if (existing.playerId !== d.playerId) {
    return {
      ok: false,
      errors: [{ field: "playerId", message: "Cannot change the player for an existing entry" }],
    };
  }

  // Replace body map: delete old selections, create new ones
  const row = await prisma.$transaction(async (tx) => {
    await tx.wellnessBodyMapSelection.deleteMany({
      where: { wellnessEntryId: entryId },
    });

    return tx.wellnessEntry.update({
      where: { id: entryId },
      data: {
        date: d.date,
        fatigue: d.fatigue,
        soreness: d.soreness,
        sleepQuality: d.sleepQuality,
        recovery: d.recovery,
        stress: d.stress,
        mood: d.mood,
        overallScore: d.overallScore,
        notes: d.notes ?? null,
        bodyMapSelections: {
          create: d.bodyMap.map((bm) => ({
            regionKey: bm.regionKey,
            label: bm.label,
            view: bm.view,
            side: bm.side,
            severity: bm.severity,
          })),
        },
      },
      include: WELLNESS_INCLUDE,
    });
  });

  return { ok: true, data: mapWellnessEntry(row) };
}

export async function submitTrainingSession(
  input: unknown,
): Promise<ValidationResult<TrainingSession>> {
  const result = validateTrainingSession(input);
  if (!result.ok) return result;

  const d = result.data;
  const row = await prisma.trainingSession.create({
    data: {
      playerId: d.playerId,
      date: d.date,
      type: d.type,
      durationMinutes: d.durationMinutes,
      rpe: d.rpe,
      sessionLoad: d.sessionLoad,
      notes: d.notes ?? null,
    },
  });

  return { ok: true, data: mapSession(row) };
}

/**
 * Update an existing training session by ID.
 * Validates input, derives sessionLoad, prevents cross-player edit.
 */
export async function updateTrainingSession(
  sessionId: string,
  input: unknown,
): Promise<ValidationResult<TrainingSession>> {
  const result = validateTrainingSession(input);
  if (!result.ok) return result;

  const d = result.data;

  const existing = await prisma.trainingSession.findUnique({ where: { id: sessionId } });
  if (!existing) {
    return { ok: false, errors: [{ field: "id", message: `Session ${sessionId} not found` }] };
  }

  if (existing.playerId !== d.playerId) {
    return { ok: false, errors: [{ field: "playerId", message: "Cannot change the player for an existing session" }] };
  }

  const row = await prisma.trainingSession.update({
    where: { id: sessionId },
    data: {
      date: d.date,
      type: d.type,
      durationMinutes: d.durationMinutes,
      rpe: d.rpe,
      sessionLoad: d.sessionLoad,
      notes: d.notes ?? null,
    },
  });

  return { ok: true, data: mapSession(row) };
}

/**
 * Delete a training session by ID. Returns success or not-found error.
 */
export async function deleteTrainingSession(
  sessionId: string,
): Promise<ValidationResult<{ id: string }>> {
  const existing = await prisma.trainingSession.findUnique({ where: { id: sessionId } });
  if (!existing) {
    return { ok: false, errors: [{ field: "id", message: `Session ${sessionId} not found` }] };
  }

  await prisma.trainingSession.delete({ where: { id: sessionId } });
  return { ok: true, data: { id: sessionId } };
}

/**
 * Create multiple training sessions atomically (one per player, shared fields).
 * Validates all rows before any mutation. Uses a single transaction.
 */
export async function submitBulkTrainingSessions(
  input: unknown,
): Promise<ValidationResult<TrainingSession[]>> {
  const result = validateBulkTrainingSessions(input);
  if (!result.ok) return result;

  const sessions = await prisma.$transaction(
    result.data.map((d) =>
      prisma.trainingSession.create({
        data: {
          playerId: d.playerId,
          date: d.date,
          type: d.type,
          durationMinutes: d.durationMinutes,
          rpe: d.rpe,
          sessionLoad: d.sessionLoad,
          notes: d.notes ?? null,
        },
      }),
    ),
  );

  return { ok: true, data: sessions.map(mapSession) };
}

// Re-export validation types for API routes
export type { ValidationResult, WriteError, ValidatedWellnessCheckIn, ValidatedTrainingSession };
