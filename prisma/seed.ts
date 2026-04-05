import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashSync } from "bcryptjs";
import { players, wellnessEntries, trainingSessions } from "../src/lib/mock-data";

const connectionString = process.env.DATABASE_URL ?? "";
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Clear (order matters for FK constraints)
  await prisma.wellnessBodyMapSelection.deleteMany();
  await prisma.wellnessEntry.deleteMany();
  await prisma.trainingSession.deleteMany();
  await prisma.user.deleteMany();
  await prisma.player.deleteMany();

  // Players
  for (const p of players) {
    await prisma.player.create({
      data: { id: p.id, name: p.name, position: p.position, number: p.number, age: p.age, status: p.status },
    });
  }
  console.log(`  ${players.length} players`);

  // Wellness entries + body map
  for (const e of wellnessEntries) {
    await prisma.wellnessEntry.create({
      data: {
        id: e.id, playerId: e.playerId, date: e.date,
        fatigue: e.fatigue, soreness: e.soreness, sleepQuality: e.sleepQuality,
        recovery: e.recovery, stress: e.stress, mood: e.mood,
        overallScore: e.overallScore, notes: e.notes ?? null,
        bodyMapSelections: {
          create: e.bodyMap.map((bm) => ({
            regionKey: bm.regionKey, label: bm.label,
            view: bm.view, side: bm.side, severity: bm.severity,
          })),
        },
      },
    });
  }
  console.log(`  ${wellnessEntries.length} wellness entries`);

  // Training sessions
  for (const s of trainingSessions) {
    await prisma.trainingSession.create({
      data: {
        id: s.id, playerId: s.playerId, date: s.date, type: s.type,
        durationMinutes: s.durationMinutes, rpe: s.rpe,
        sessionLoad: s.sessionLoad, notes: s.notes ?? null,
      },
    });
  }
  console.log(`  ${trainingSessions.length} training sessions`);

  // Demo users (password: "password123" for all)
  const hashedPassword = hashSync("password123", 10);

  await prisma.user.create({
    data: {
      email: "admin@fwh.dev",
      hashedPassword,
      name: "Admin User",
      role: "admin",
      playerId: null,
    },
  });

  await prisma.user.create({
    data: {
      email: "coach@fwh.dev",
      hashedPassword,
      name: "Coach User",
      role: "coach",
      playerId: null,
    },
  });

  // Player user linked to Emre Yılmaz (player id "1")
  await prisma.user.create({
    data: {
      email: "emre@fwh.dev",
      hashedPassword,
      name: "Emre Yılmaz",
      role: "player",
      playerId: "1",
    },
  });

  console.log("  3 users (admin, coach, player)");
  console.log("Seed complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
