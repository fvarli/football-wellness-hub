# Persistence Plan

## Current State

Data is persisted in PostgreSQL via Prisma 7. The data access service (`src/lib/data/service.ts`) provides async functions backed by Prisma queries. Pages and API routes import from the service — no direct database access elsewhere.

Body map selections are stored as normalized child rows (`WellnessBodyMapSelection`) but assembled into `WellnessEntry.bodyMap` arrays by the service on read.

## What Is Persisted

| Entity | Table | Status |
|---|---|---|
| Players | `Player` | Persisted, read-only (seeded from mock data) |
| Wellness entries | `WellnessEntry` | Persisted, writable via `POST /api/wellness/check-in` |
| Body map selections | `WellnessBodyMapSelection` | Persisted as child rows, assembled into bodyMap array on read |
| Training sessions | `TrainingSession` | Persisted, writable via `POST /api/sessions` |
| Risk snapshots | N/A | Computed on-the-fly from persisted source data, not stored |

## What Stays Frontend-Only

| Data | Location | Reason |
|---|---|---|
| Canonical muscle region registry | `src/lib/body-regions.ts` | UI rendering metadata, not user data |
| Severity color bands | `src/components/body-map.tsx`, `body-map-summary.tsx` | Presentation logic |
| SVG path geometry | `male-front-svg.tsx`, `male-back-svg.tsx` | Static visual assets |
| Risk computation formulas | `src/lib/risk.ts` | Pure functions, no storage needed |
| WELLNESS_METRICS labels | `src/lib/types.ts` | UI display constants |

## Setup

### First-time setup

```bash
# 1. Configure DATABASE_URL in .env
# 2. Create the database
createdb football_wellness_hub

# 3. Run migrations
npm run db:migrate

# 4. Seed with demo data
npm run db:seed
```

### Scripts

| Script | Command | Purpose |
|---|---|---|
| `db:migrate` | `npx prisma migrate dev` | Apply schema migrations (dev DB) |
| `db:seed` | `npx tsx prisma/seed.ts` | Populate database from mock data |
| `db:reset` | `npx prisma migrate reset --force` | Drop + recreate + re-seed |
| `db:test:setup` | Push schema + seed to test DB | Uses `.env.test` DATABASE_URL |
| `test:integration` | `vitest --config vitest.integration.config.ts` | Run DB-backed tests |
| `test:all` | Unit + integration tests | Runs sequentially |

## Stack

- **Prisma 7** — ORM and migration tool
- **PostgreSQL** — production database
- **@prisma/adapter-pg** — PostgreSQL driver adapter for Prisma 7
- **prisma.config.ts** — connection URL configuration (reads from `.env`)

## Migration History

| Step | Status |
|---|---|
| Add Prisma + schema | Done |
| Replace service internals with Prisma queries | Done |
| Make all service functions async | Done |
| Update all page components to await | Done |
| Create seed script from mock data | Done |
| Add API routes for writes | Done (previous milestone) |
| Remove mock-data as runtime source | Done — mock-data.ts remains only as seed input |
