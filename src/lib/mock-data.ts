import type { Player, WellnessEntry, BodyMapSelection } from "./types";

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
  { id: "w1", playerId: "1", date: "2026-04-04", fatigue: 7, soreness: 8, sleepQuality: 9, recovery: 8, stress: 7, mood: 8, overallScore: avg(7, 8, 9, 8, 7, 8) },
  { id: "w2", playerId: "1", date: "2026-04-03", fatigue: 6, soreness: 7, sleepQuality: 8, recovery: 7, stress: 6, mood: 7, overallScore: avg(6, 7, 8, 7, 6, 7) },
  // Carlos Mendes
  { id: "w3", playerId: "2", date: "2026-04-04", fatigue: 5, soreness: 4, sleepQuality: 6, recovery: 5, stress: 6, mood: 6, overallScore: avg(5, 4, 6, 5, 6, 6) },
  { id: "w4", playerId: "2", date: "2026-04-03", fatigue: 6, soreness: 5, sleepQuality: 7, recovery: 6, stress: 7, mood: 7, overallScore: avg(6, 5, 7, 6, 7, 7) },
  // Liam O'Brien (injured — lower scores)
  { id: "w5", playerId: "3", date: "2026-04-04", fatigue: 3, soreness: 2, sleepQuality: 5, recovery: 3, stress: 4, mood: 4, overallScore: avg(3, 2, 5, 3, 4, 4) },
  { id: "w6", playerId: "3", date: "2026-04-02", fatigue: 4, soreness: 3, sleepQuality: 5, recovery: 3, stress: 5, mood: 4, overallScore: avg(4, 3, 5, 3, 5, 4) },
  // Kenji Tanaka
  { id: "w7", playerId: "4", date: "2026-04-04", fatigue: 8, soreness: 9, sleepQuality: 8, recovery: 8, stress: 7, mood: 9, overallScore: avg(8, 9, 8, 8, 7, 9) },
  { id: "w8", playerId: "4", date: "2026-04-03", fatigue: 7, soreness: 8, sleepQuality: 7, recovery: 7, stress: 8, mood: 8, overallScore: avg(7, 8, 7, 7, 8, 8) },
  // André Souza
  { id: "w9", playerId: "5", date: "2026-04-04", fatigue: 6, soreness: 6, sleepQuality: 7, recovery: 6, stress: 5, mood: 7, overallScore: avg(6, 6, 7, 6, 5, 7) },
  { id: "w10", playerId: "5", date: "2026-04-03", fatigue: 7, soreness: 7, sleepQuality: 8, recovery: 7, stress: 6, mood: 7, overallScore: avg(7, 7, 8, 7, 6, 7) },
  // Mehmet Kaya
  { id: "w11", playerId: "6", date: "2026-04-04", fatigue: 4, soreness: 5, sleepQuality: 6, recovery: 5, stress: 4, mood: 5, overallScore: avg(4, 5, 6, 5, 4, 5) },
  { id: "w12", playerId: "6", date: "2026-04-03", fatigue: 5, soreness: 6, sleepQuality: 6, recovery: 5, stress: 5, mood: 6, overallScore: avg(5, 6, 6, 5, 5, 6) },
  // Jonas Eriksen (resting)
  { id: "w13", playerId: "7", date: "2026-04-03", fatigue: 5, soreness: 6, sleepQuality: 7, recovery: 6, stress: 6, mood: 6, overallScore: avg(5, 6, 7, 6, 6, 6) },
  { id: "w14", playerId: "7", date: "2026-04-02", fatigue: 4, soreness: 5, sleepQuality: 6, recovery: 5, stress: 5, mood: 5, overallScore: avg(4, 5, 6, 5, 5, 5) },
  // David Okafor
  { id: "w15", playerId: "8", date: "2026-04-04", fatigue: 7, soreness: 7, sleepQuality: 8, recovery: 7, stress: 8, mood: 8, overallScore: avg(7, 7, 8, 7, 8, 8) },
  { id: "w16", playerId: "8", date: "2026-04-03", fatigue: 8, soreness: 8, sleepQuality: 9, recovery: 8, stress: 7, mood: 9, overallScore: avg(8, 8, 9, 8, 7, 9) },
];

// Body-map mock data keyed by wellness-entry id
export const bodyMapEntries: Record<string, BodyMapSelection[]> = {
  // Liam O'Brien (injured) — right hamstring + right knee
  w5: [
    { regionId: "right-hamstring", severity: 7 },
    { regionId: "right-knee", severity: 4 },
  ],
  w6: [
    { regionId: "right-hamstring", severity: 8 },
    { regionId: "right-knee", severity: 5 },
  ],
  // Carlos Mendes — mild quad tightness
  w3: [
    { regionId: "left-quad", severity: 3 },
  ],
  // Mehmet Kaya — lower back + groin
  w11: [
    { regionId: "lower-back", severity: 5 },
    { regionId: "groin", severity: 3 },
  ],
  // Jonas Eriksen (resting) — left calf
  w13: [
    { regionId: "left-calf", severity: 4 },
  ],
};

export function getBodyMapForEntry(entryId: string): BodyMapSelection[] {
  return bodyMapEntries[entryId] ?? [];
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
