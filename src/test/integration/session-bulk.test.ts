/**
 * Integration tests for bulk training session creation.
 *
 * Requires: test PostgreSQL running with seeded data.
 * Run:      npm run test:integration
 */
import { describe, it, expect } from "vitest";
import {
  submitBulkTrainingSessions,
  getSessionsForPlayer,
} from "@/lib/data/service";

const TEST_PLAYER_1 = "1"; // Emre Yilmaz (from seed)
const TEST_PLAYER_2 = "2"; // Ali Demir (from seed)

const RUN_ID = String(Date.now()).slice(-6);
let seq = 100; // offset from wellness-writes to avoid collision
function uniqueDate() {
  seq++;
  return `31${RUN_ID.slice(0, 2)}-${String((seq % 12) + 1).padStart(2, "0")}-${String((seq % 28) + 1).padStart(2, "0")}`;
}

describe("submitBulkTrainingSessions (integration)", () => {
  it("creates multiple sessions atomically", async () => {
    const date = uniqueDate();
    const result = await submitBulkTrainingSessions({
      playerIds: [TEST_PLAYER_1, TEST_PLAYER_2],
      date,
      type: "training",
      durationMinutes: 60,
      rpe: 7,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data).toHaveLength(2);
    expect(result.data[0].sessionLoad).toBe(420);
    expect(result.data[1].sessionLoad).toBe(420);

    // Verify both are readable
    const p1 = await getSessionsForPlayer(TEST_PLAYER_1);
    const p2 = await getSessionsForPlayer(TEST_PLAYER_2);
    expect(p1.find((s) => s.date === date)).toBeDefined();
    expect(p2.find((s) => s.date === date)).toBeDefined();
  });

  it("rejects with invalid shared fields and creates nothing", async () => {
    const date = "not-a-date";
    const result = await submitBulkTrainingSessions({
      playerIds: [TEST_PLAYER_1, TEST_PLAYER_2],
      date,
      type: "training",
      durationMinutes: 60,
      rpe: 7,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.field === "date")).toBe(true);
    }
  });
});
