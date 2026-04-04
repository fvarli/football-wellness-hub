# Persistence Plan

## Current State

All data lives in memory as static arrays in `src/lib/mock-data.ts`. Form submissions update local component state only — nothing persists across page reloads.

A data access service layer (`src/lib/data/service.ts`) now sits between pages and raw mock arrays. Pages import data functions from the service, not from mock-data directly. This means replacing the mock backend requires changes in one file.

## What Remains Mock-Only

| Data | Current backing | Writable? |
|---|---|---|
| Players | Static array | No (read-only roster) |
| Wellness entries | Static array | No (check-in form submits to local state only) |
| Body map selections | Embedded in wellness entries | No |
| Training sessions | Static array | No (no session creation UI yet) |
| Risk snapshots | Computed on-the-fly from above | N/A (derived) |

## Persistence Priority

| Entity | Priority | Reason |
|---|---|---|
| WellnessEntry (with bodyMap) | **P0** | Core product value. Check-in data is useless if it doesn't persist. |
| TrainingSession | **P0** | Required for meaningful ACWR calculation. |
| Player | **P1** | Needed for multi-user, but a hardcoded roster works for initial deployment. |
| PlayerRiskSnapshot | **P2** | Derived and recomputable. Cache for performance only. |

## Recommended Backend

For a Next.js App Router project of this size:

**Next.js API routes + Prisma + PostgreSQL (or SQLite for dev)**

Rationale:
- No separate backend service to deploy or maintain
- Prisma provides typed schema, migrations, and query builder
- PostgreSQL for production, SQLite for local development
- Server components can call Prisma directly without API routes for reads
- API routes handle writes (POST from client components)

Alternative: Supabase (hosted Postgres + auth + realtime). Lower ops burden but less control.

## Migration Path

### Step 1 — Add Prisma + schema (no behavior change)
- `npx prisma init`
- Define schema per `docs/database-schema.md`
- Body map selections stored as normalized child rows (`wellness_body_map_selections`), not JSONB
- The data service assembles `WellnessEntry.bodyMap: BodyMapSelection[]` on read and decomposes on write — the application/API shape stays the same
- Generate Prisma client
- Seed database from mock data arrays

### Step 2 — Replace service internals
- Change `src/lib/data/service.ts` function bodies from array reads to Prisma queries
- Make functions `async`
- Wellness reads include `bodyMapSelections` via Prisma `include` and map to the `bodyMap` array
- Update pages to `await` the data calls (server components already support this)

### Step 3 — Add write endpoints
- API route for wellness check-in submission (POST) — decomposes `bodyMap` array into child rows
- API route for training session creation (POST)
- Client components call these routes

### Step 4 — Remove mock-data.ts
- Move seed data to `prisma/seed.ts`
- Delete `src/lib/mock-data.ts`

## What Stays Frontend-Only

These are never persisted in a database:

| Data | Location | Reason |
|---|---|---|
| Canonical muscle region registry | `src/lib/body-regions.ts` | UI rendering metadata, not user data |
| Severity color bands | `src/components/body-map.tsx`, `body-map-summary.tsx` | Presentation logic |
| SVG path geometry | `male-front-svg.tsx`, `male-back-svg.tsx` | Static visual assets |
| Risk computation formulas | `src/lib/risk.ts` | Pure functions, no storage needed |
| WELLNESS_METRICS labels | `src/lib/types.ts` | UI display constants |
