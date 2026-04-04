import type { Player, WellnessEntry, BodyMapSelection, TrainingSession, PlayerRiskSnapshot } from "./types";
import { calculatePlayerRiskSnapshot } from "./risk";

/** The reference date for all mock-data computations. */
export const MOCK_AS_OF = "2026-04-04";

export const players: Player[] = [
  { id: "1", name: "Emre Yılmaz", position: "GK", number: 1, age: 28, status: "available" },
  { id: "2", name: "Carlos Mendes", position: "CB", number: 4, age: 26, status: "available" },
  { id: "3", name: "Liam O'Brien", position: "CB", number: 5, age: 24, status: "injured" },
  { id: "4", name: "Kenji Tanaka", position: "LB", number: 3, age: 22, status: "available" },
  { id: "5", name: "André Souza", position: "RB", number: 2, age: 25, status: "available" },
  { id: "6", name: "Mehmet Kaya", position: "CM", number: 8, age: 27, status: "available" },
  { id: "7", name: "Jonas Eriksen", position: "CAM", number: 10, age: 23, status: "resting" },
  { id: "8", name: "David Okafor", position: "ST", number: 9, age: 25, status: "available" },
];

function avg(...nums: number[]): number {
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

export const wellnessEntries: WellnessEntry[] = [
  // Emre Yılmaz
  { id: "w1", playerId: "1", date: "2026-04-04", fatigue: 7, soreness: 8, sleepQuality: 9, recovery: 8, stress: 7, mood: 8, overallScore: avg(7, 8, 9, 8, 7, 8), bodyMap: [] },
  { id: "w2", playerId: "1", date: "2026-04-03", fatigue: 6, soreness: 7, sleepQuality: 8, recovery: 7, stress: 6, mood: 7, overallScore: avg(6, 7, 8, 7, 6, 7), bodyMap: [] },
  // Carlos Mendes — mild quad tightness
  { id: "w3", playerId: "2", date: "2026-04-04", fatigue: 5, soreness: 4, sleepQuality: 6, recovery: 5, stress: 6, mood: 6, overallScore: avg(5, 4, 6, 5, 6, 6), bodyMap: [
    { regionKey: "left_quadriceps", label: "L. Quadriceps", view: "front", side: "left", severity: 3 },
  ] },
  { id: "w4", playerId: "2", date: "2026-04-03", fatigue: 6, soreness: 5, sleepQuality: 7, recovery: 6, stress: 7, mood: 7, overallScore: avg(6, 5, 7, 6, 7, 7), bodyMap: [] },
  // Liam O'Brien (injured)
  { id: "w5", playerId: "3", date: "2026-04-04", fatigue: 3, soreness: 2, sleepQuality: 5, recovery: 3, stress: 4, mood: 4, overallScore: avg(3, 2, 5, 3, 4, 4), bodyMap: [
    { regionKey: "right_hamstring", label: "R. Hamstring", view: "back", side: "right", severity: 7 },
    { regionKey: "right_adductor", label: "R. Adductor", view: "front", side: "right", severity: 4 },
  ] },
  { id: "w6", playerId: "3", date: "2026-04-02", fatigue: 4, soreness: 3, sleepQuality: 5, recovery: 3, stress: 5, mood: 4, overallScore: avg(4, 3, 5, 3, 5, 4), bodyMap: [
    { regionKey: "right_hamstring", label: "R. Hamstring", view: "back", side: "right", severity: 8 },
    { regionKey: "right_adductor", label: "R. Adductor", view: "front", side: "right", severity: 5 },
  ] },
  // Kenji Tanaka
  { id: "w7", playerId: "4", date: "2026-04-04", fatigue: 8, soreness: 9, sleepQuality: 8, recovery: 8, stress: 7, mood: 9, overallScore: avg(8, 9, 8, 8, 7, 9), bodyMap: [] },
  { id: "w8", playerId: "4", date: "2026-04-03", fatigue: 7, soreness: 8, sleepQuality: 7, recovery: 7, stress: 8, mood: 8, overallScore: avg(7, 8, 7, 7, 8, 8), bodyMap: [] },
  // André Souza
  { id: "w9", playerId: "5", date: "2026-04-04", fatigue: 6, soreness: 6, sleepQuality: 7, recovery: 6, stress: 5, mood: 7, overallScore: avg(6, 6, 7, 6, 5, 7), bodyMap: [] },
  { id: "w10", playerId: "5", date: "2026-04-03", fatigue: 7, soreness: 7, sleepQuality: 8, recovery: 7, stress: 6, mood: 7, overallScore: avg(7, 7, 8, 7, 6, 7), bodyMap: [] },
  // Mehmet Kaya — lower back + left oblique
  { id: "w11", playerId: "6", date: "2026-04-04", fatigue: 4, soreness: 5, sleepQuality: 6, recovery: 5, stress: 4, mood: 5, overallScore: avg(4, 5, 6, 5, 4, 5), bodyMap: [
    { regionKey: "lower_back", label: "Lower Back", view: "back", side: "center", severity: 5 },
    { regionKey: "left_oblique", label: "L. Oblique", view: "front", side: "left", severity: 3 },
  ] },
  { id: "w12", playerId: "6", date: "2026-04-03", fatigue: 5, soreness: 6, sleepQuality: 6, recovery: 5, stress: 5, mood: 6, overallScore: avg(5, 6, 6, 5, 5, 6), bodyMap: [] },
  // Jonas Eriksen (resting) — left calf
  { id: "w13", playerId: "7", date: "2026-04-03", fatigue: 5, soreness: 6, sleepQuality: 7, recovery: 6, stress: 6, mood: 6, overallScore: avg(5, 6, 7, 6, 6, 6), bodyMap: [
    { regionKey: "left_calf", label: "L. Calf", view: "back", side: "left", severity: 4 },
  ] },
  { id: "w14", playerId: "7", date: "2026-04-02", fatigue: 4, soreness: 5, sleepQuality: 6, recovery: 5, stress: 5, mood: 5, overallScore: avg(4, 5, 6, 5, 5, 5), bodyMap: [] },
  // David Okafor
  { id: "w15", playerId: "8", date: "2026-04-04", fatigue: 7, soreness: 7, sleepQuality: 8, recovery: 7, stress: 8, mood: 8, overallScore: avg(7, 7, 8, 7, 8, 8), bodyMap: [] },
  { id: "w16", playerId: "8", date: "2026-04-03", fatigue: 8, soreness: 8, sleepQuality: 9, recovery: 8, stress: 7, mood: 9, overallScore: avg(8, 8, 9, 8, 7, 9), bodyMap: [] },
];

// ── Training Sessions ──

function load(rpe: number, dur: number): number { return rpe * dur; }

export const trainingSessions: TrainingSession[] = [
  // 2026-04-04 — match day
  { id: "ts1",  playerId: "1", date: "2026-04-04", type: "match",    durationMinutes: 90, rpe: 8, sessionLoad: load(8, 90) },
  { id: "ts2",  playerId: "2", date: "2026-04-04", type: "match",    durationMinutes: 90, rpe: 7, sessionLoad: load(7, 90) },
  { id: "ts3",  playerId: "4", date: "2026-04-04", type: "match",    durationMinutes: 90, rpe: 7, sessionLoad: load(7, 90) },
  { id: "ts4",  playerId: "5", date: "2026-04-04", type: "match",    durationMinutes: 90, rpe: 6, sessionLoad: load(6, 90) },
  { id: "ts5",  playerId: "6", date: "2026-04-04", type: "match",    durationMinutes: 78, rpe: 8, sessionLoad: load(8, 78) },
  { id: "ts6",  playerId: "8", date: "2026-04-04", type: "match",    durationMinutes: 90, rpe: 7, sessionLoad: load(7, 90) },
  // 2026-04-04 — recovery / rest day for injured & resting
  { id: "ts7",  playerId: "3", date: "2026-04-04", type: "recovery", durationMinutes: 30, rpe: 2, sessionLoad: load(2, 30) },
  { id: "ts8",  playerId: "7", date: "2026-04-04", type: "recovery", durationMinutes: 25, rpe: 3, sessionLoad: load(3, 25) },
  // 2026-04-03 — training day
  { id: "ts9",  playerId: "1", date: "2026-04-03", type: "training", durationMinutes: 75, rpe: 6, sessionLoad: load(6, 75) },
  { id: "ts10", playerId: "2", date: "2026-04-03", type: "training", durationMinutes: 75, rpe: 5, sessionLoad: load(5, 75) },
  { id: "ts11", playerId: "4", date: "2026-04-03", type: "training", durationMinutes: 75, rpe: 5, sessionLoad: load(5, 75) },
  { id: "ts12", playerId: "5", date: "2026-04-03", type: "training", durationMinutes: 75, rpe: 6, sessionLoad: load(6, 75) },
  { id: "ts13", playerId: "6", date: "2026-04-03", type: "training", durationMinutes: 75, rpe: 7, sessionLoad: load(7, 75) },
  { id: "ts14", playerId: "7", date: "2026-04-03", type: "gym",      durationMinutes: 45, rpe: 4, sessionLoad: load(4, 45) },
  { id: "ts15", playerId: "8", date: "2026-04-03", type: "training", durationMinutes: 75, rpe: 5, sessionLoad: load(5, 75) },
  // 2026-04-02 — training day
  { id: "ts16", playerId: "1", date: "2026-04-02", type: "training", durationMinutes: 80, rpe: 7, sessionLoad: load(7, 80) },
  { id: "ts17", playerId: "2", date: "2026-04-02", type: "training", durationMinutes: 80, rpe: 6, sessionLoad: load(6, 80) },
  { id: "ts18", playerId: "3", date: "2026-04-02", type: "recovery", durationMinutes: 30, rpe: 2, sessionLoad: load(2, 30) },
  { id: "ts19", playerId: "4", date: "2026-04-02", type: "training", durationMinutes: 80, rpe: 6, sessionLoad: load(6, 80) },
  { id: "ts20", playerId: "5", date: "2026-04-02", type: "training", durationMinutes: 80, rpe: 5, sessionLoad: load(5, 80) },
  { id: "ts21", playerId: "6", date: "2026-04-02", type: "training", durationMinutes: 80, rpe: 6, sessionLoad: load(6, 80) },
  { id: "ts22", playerId: "8", date: "2026-04-02", type: "training", durationMinutes: 80, rpe: 6, sessionLoad: load(6, 80) },
];

export function getAllSessions(): (TrainingSession & { playerName: string })[] {
  return trainingSessions
    .map((s) => {
      const p = players.find((pl) => pl.id === s.playerId);
      return p ? { ...s, playerName: p.name } : null;
    })
    .filter(Boolean)
    .sort((a, b) => b!.date.localeCompare(a!.date) || a!.playerName.localeCompare(b!.playerName)) as (TrainingSession & { playerName: string })[];
}

export function getPlayerSessions(playerId: string): TrainingSession[] {
  return trainingSessions
    .filter((s) => s.playerId === playerId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** @deprecated Use entry.bodyMap directly. Kept for backward compatibility during migration. */
export function getBodyMapForEntry(entryId: string): BodyMapSelection[] {
  const entry = wellnessEntries.find((e) => e.id === entryId);
  return entry?.bodyMap ?? [];
}

export function getPlayer(id: string): Player | undefined {
  return players.find((p) => p.id === id);
}

export function getPlayerWellness(playerId: string): WellnessEntry[] {
  return wellnessEntries
    .filter((e) => e.playerId === playerId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getLatestWellness(playerId: string): WellnessEntry | undefined {
  return getPlayerWellness(playerId)[0];
}

export function getAllLatestWellness(): (WellnessEntry & { player: Player })[] {
  return players.map((player) => {
    const latest = getLatestWellness(player.id);
    return latest ? { ...latest, player } : null;
  }).filter(Boolean) as (WellnessEntry & { player: Player })[];
}

/** Risk snapshot for every player, computed from mock data. */
export function getAllRiskSnapshots(
  asOf: string = MOCK_AS_OF,
): (PlayerRiskSnapshot & { player: Player })[] {
  return players.map((p) => ({
    ...calculatePlayerRiskSnapshot(p.id, trainingSessions, wellnessEntries, asOf),
    player: p,
  }));
}
