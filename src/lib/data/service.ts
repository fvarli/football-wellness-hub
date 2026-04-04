/**
 * Data access service — the single entry point for all data reads and writes.
 *
 * Currently backed by in-memory mock arrays. When a real backend is
 * added, replace the function bodies here. No page code needs to change.
 *
 * Design decisions:
 * - Concrete functions, not abstract interfaces. We have one implementation.
 * - Synchronous for now. When backend arrives, signatures become async.
 * - Write methods validate input via validation.ts, then mutate in-memory arrays.
 * - Risk snapshots are computed on-the-fly from source data.
 * - asOfDate defaults to MOCK_AS_OF but is parameterized for testability.
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
} from "@/lib/types";
import { calculatePlayerRiskSnapshot } from "@/lib/risk";
import {
  validateWellnessCheckIn,
  validateTrainingSession,
  type ValidationResult,
  type ValidatedWellnessCheckIn,
  type ValidatedTrainingSession,
} from "@/lib/validation";

// ── Seed data (mock backend) ──
import {
  players as _players,
  wellnessEntries as _wellness,
  trainingSessions as _sessions,
  MOCK_AS_OF,
} from "@/lib/mock-data";

export { MOCK_AS_OF };

// ── Player ──

export function getAllPlayers(): Player[] {
  return _players;
}

export function getPlayerById(id: string): Player | undefined {
  return _players.find((p) => p.id === id);
}

// ── Wellness ──

export function getWellnessForPlayer(playerId: string): WellnessEntry[] {
  return _wellness
    .filter((e) => e.playerId === playerId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getLatestWellness(playerId: string): WellnessEntry | undefined {
  return getWellnessForPlayer(playerId)[0];
}

export function getAllLatestWellness(): (WellnessEntry & { player: Player })[] {
  return _players.map((player) => {
    const latest = getLatestWellness(player.id);
    return latest ? { ...latest, player } : null;
  }).filter(Boolean) as (WellnessEntry & { player: Player })[];
}

// ── Training Sessions ──

export function getAllSessions(): (TrainingSession & { playerName: string })[] {
  return _sessions
    .map((s) => {
      const p = _players.find((pl) => pl.id === s.playerId);
      return p ? { ...s, playerName: p.name } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b!.date.localeCompare(a!.date) || a!.playerName.localeCompare(b!.playerName)) as (TrainingSession & { playerName: string })[];
}

export function getSessionsForPlayer(playerId: string): TrainingSession[] {
  return _sessions
    .filter((s) => s.playerId === playerId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

// ── Risk Snapshots (computed, not persisted) ──

const RISK_ORDER: Record<RiskLevel, number> = { critical: 0, high: 1, moderate: 2, low: 3 };

export function getRiskSnapshot(playerId: string, asOf: string = MOCK_AS_OF): PlayerRiskSnapshot {
  return calculatePlayerRiskSnapshot(playerId, _sessions, _wellness, asOf);
}

export function getAllRiskSnapshots(
  asOf: string = MOCK_AS_OF,
): (PlayerRiskSnapshot & { player: Player })[] {
  return _players.map((p) => ({
    ...calculatePlayerRiskSnapshot(p.id, _sessions, _wellness, asOf),
    player: p,
  }));
}

/** All risk snapshots sorted by risk priority, flag count, wellness, name. */
export function getAllRiskSnapshotsSorted(
  asOf: string = MOCK_AS_OF,
): (PlayerRiskSnapshot & { player: Player })[] {
  return getAllRiskSnapshots(asOf).sort((a, b) =>
    (RISK_ORDER[a.riskLevel] - RISK_ORDER[b.riskLevel])
    || (b.sorenessFlags.length - a.sorenessFlags.length)
    || ((a.latestWellnessScore ?? 99) - (b.latestWellnessScore ?? 99))
    || a.player.name.localeCompare(b.player.name)
  );
}

// ── Writes ──

let _nextWellnessId = _wellness.length + 1;
let _nextSessionId = _sessions.length + 1;

/**
 * Submit a wellness check-in. Validates input, computes overallScore,
 * resolves body map labels from the region registry, and stores the entry.
 * Returns the created entry or validation errors.
 */
export function submitWellnessCheckIn(
  input: unknown,
): ValidationResult<WellnessEntry> {
  const result = validateWellnessCheckIn(input);
  if (!result.ok) return result;

  const d = result.data;
  const entry: WellnessEntry = {
    id: `w${_nextWellnessId++}`,
    playerId: d.playerId,
    date: d.date,
    fatigue: d.fatigue,
    soreness: d.soreness,
    sleepQuality: d.sleepQuality,
    recovery: d.recovery,
    stress: d.stress,
    mood: d.mood,
    overallScore: d.overallScore,
    notes: d.notes,
    bodyMap: d.bodyMap,
  };

  _wellness.push(entry);
  return { ok: true, data: entry };
}

/**
 * Log a training session. Validates input and derives sessionLoad server-side.
 * Returns the created session or validation errors.
 */
export function submitTrainingSession(
  input: unknown,
): ValidationResult<TrainingSession> {
  const result = validateTrainingSession(input);
  if (!result.ok) return result;

  const d = result.data;
  const session: TrainingSession = {
    id: `ts${_nextSessionId++}`,
    playerId: d.playerId,
    date: d.date,
    type: d.type,
    durationMinutes: d.durationMinutes,
    rpe: d.rpe,
    sessionLoad: d.sessionLoad,
    notes: d.notes,
  };

  _sessions.push(session);
  return { ok: true, data: session };
}

// Re-export validation types for API routes
export type { ValidationResult, ValidatedWellnessCheckIn, ValidatedTrainingSession };
