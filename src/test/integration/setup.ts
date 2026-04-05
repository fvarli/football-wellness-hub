/**
 * Integration test setup.
 *
 * Loads .env.test for DATABASE_URL pointing to the test database.
 * Tests run against a real PostgreSQL instance.
 *
 * Setup: DATABASE_URL="postgresql://testuser:testpass@localhost:5555/fwh_test" npx prisma db push && npx tsx prisma/seed.ts
 * Run:   npm run test:integration
 */
import { config } from "dotenv";
config({ path: ".env.test" });
