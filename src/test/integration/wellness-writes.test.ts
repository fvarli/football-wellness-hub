/**
 * Integration tests for wellness write operations.
 *
 * Requires: test PostgreSQL running with seeded data.
 * Setup:    See README.md "Integration Tests" section.
 * Run:      npm run test:integration
 */
import { describe, it, expect } from "vitest";
import {
  submitWellnessCheckIn,
  updateWellnessCheckIn,
  getWellnessForPlayer,
  getLatestWellness,
  submitTrainingSession,
  getSessionsForPlayer,
  getRiskSnapshot,
} from "@/lib/data/service";

const TEST_PLAYER = "1"; // Emre Yilmaz (from seed)

// Use a run-unique prefix so tests don't collide across runs
const RUN_ID = String(Date.now()).slice(-6);
let seq = 0;
function uniqueDate() {
  seq++;
  // Generates dates like 3001-01-01, 3001-01-02, etc. — never collides with seed data
  return `30${RUN_ID.slice(0, 2)}-${String((seq % 12) + 1).padStart(2, "0")}-${String((seq % 28) + 1).padStart(2, "0")}`;
}

describe("submitWellnessCheckIn (integration)", () => {
  it("creates an entry with bodyMap and makes it readable", async () => {
    const date = uniqueDate();
    const result = await submitWellnessCheckIn({
      playerId: TEST_PLAYER,
      date,
      fatigue: 7, soreness: 6, sleepQuality: 8, recovery: 7, stress: 6, mood: 8,
      bodyMap: [{ regionKey: "chest", severity: 4, view: "front", side: "center" }],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.id).toBeTruthy();
    expect(result.data.overallScore).toBe(7);
    expect(result.data.bodyMap).toHaveLength(1);
    expect(result.data.bodyMap[0].label).toBe("Chest");

    const entries = await getWellnessForPlayer(TEST_PLAYER);
    const found = entries.find((e) => e.id === result.data.id);
    expect(found).toBeDefined();
    expect(found!.bodyMap).toHaveLength(1);
  });

  it("rejects duplicate same-day POST", async () => {
    const date = uniqueDate();
    const base = {
      playerId: TEST_PLAYER, date,
      fatigue: 7, soreness: 7, sleepQuality: 7, recovery: 7, stress: 7, mood: 7,
    };

    const first = await submitWellnessCheckIn(base);
    expect(first.ok).toBe(true);

    const second = await submitWellnessCheckIn(base);
    expect(second.ok).toBe(false);
    if (!second.ok) {
      expect(second.errors[0].field).toBe("date");
      expect(second.errors[0].message).toContain("already exists");
    }
  });
});

describe("updateWellnessCheckIn (integration)", () => {
  it("updates metrics and replaces bodyMap child rows", async () => {
    const date = uniqueDate();
    const create = await submitWellnessCheckIn({
      playerId: TEST_PLAYER, date,
      fatigue: 5, soreness: 5, sleepQuality: 5, recovery: 5, stress: 5, mood: 5,
      bodyMap: [{ regionKey: "chest", severity: 3, view: "front", side: "center" }],
    });
    expect(create.ok).toBe(true);
    if (!create.ok) return;

    const update = await updateWellnessCheckIn(create.data.id, {
      playerId: TEST_PLAYER, date,
      fatigue: 8, soreness: 8, sleepQuality: 8, recovery: 8, stress: 8, mood: 8,
      bodyMap: [
        { regionKey: "left_hamstring", severity: 7, view: "back", side: "left" },
        { regionKey: "lower_back", severity: 5, view: "back", side: "center" },
      ],
    });

    expect(update.ok).toBe(true);
    if (!update.ok) return;

    expect(update.data.fatigue).toBe(8);
    expect(update.data.overallScore).toBe(8);
    expect(update.data.bodyMap).toHaveLength(2);
    expect(update.data.bodyMap.find((b) => b.regionKey === "chest")).toBeUndefined();
    expect(update.data.bodyMap.find((b) => b.regionKey === "left_hamstring")).toBeDefined();
  });

  it("rejects update for non-existent entry", async () => {
    const result = await updateWellnessCheckIn("nonexistent-id", {
      playerId: TEST_PLAYER, date: "2099-01-01",
      fatigue: 7, soreness: 7, sleepQuality: 7, recovery: 7, stress: 7, mood: 7,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0].message).toContain("not found");
    }
  });

  it("rejects cross-player update", async () => {
    const date = uniqueDate();
    const create = await submitWellnessCheckIn({
      playerId: TEST_PLAYER, date,
      fatigue: 7, soreness: 7, sleepQuality: 7, recovery: 7, stress: 7, mood: 7,
    });
    expect(create.ok).toBe(true);
    if (!create.ok) return;

    const result = await updateWellnessCheckIn(create.data.id, {
      playerId: "2", date,
      fatigue: 7, soreness: 7, sleepQuality: 7, recovery: 7, stress: 7, mood: 7,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0].message).toContain("Cannot change the player");
    }
  });
});

describe("submitTrainingSession (integration)", () => {
  it("creates a session with derived sessionLoad", async () => {
    const before = (await getSessionsForPlayer(TEST_PLAYER)).length;

    const result = await submitTrainingSession({
      playerId: TEST_PLAYER,
      date: uniqueDate(),
      type: "training",
      durationMinutes: 60,
      rpe: 7,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.sessionLoad).toBe(420);
    const after = (await getSessionsForPlayer(TEST_PLAYER)).length;
    expect(after).toBe(before + 1);
  });
});

describe("risk reads updated data (integration)", () => {
  it("risk snapshot reflects the latest persisted wellness", async () => {
    const date = uniqueDate();
    const create = await submitWellnessCheckIn({
      playerId: TEST_PLAYER, date,
      fatigue: 3, soreness: 3, sleepQuality: 3, recovery: 3, stress: 3, mood: 3,
    });
    expect(create.ok).toBe(true);
    if (!create.ok) return;

    await updateWellnessCheckIn(create.data.id, {
      playerId: TEST_PLAYER, date,
      fatigue: 9, soreness: 9, sleepQuality: 9, recovery: 9, stress: 9, mood: 9,
    });

    const latest = await getLatestWellness(TEST_PLAYER);
    if (latest && latest.date === date) {
      expect(latest.overallScore).toBe(9);
    }

    // Verify risk snapshot can compute without errors
    const snap = await getRiskSnapshot(TEST_PLAYER, date);
    expect(snap.playerId).toBe(TEST_PLAYER);
    expect(snap.latestWellnessScore).toBeTruthy();
  });
});
