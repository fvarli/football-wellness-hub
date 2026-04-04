# Data Access Layer

## Architecture

```
Pages / Components
      │
      ▼
src/lib/data/service.ts    ← single import point for all data reads
      │
      ▼
src/lib/mock-data.ts       ← static arrays (current mock backend)
src/lib/risk.ts            ← pure computation (risk snapshots)
```

Pages never import `mock-data.ts` directly. They import from `@/lib/data/service`.

## Service API

All functions are currently synchronous. When backed by a database, they become `async`.

### Player

| Function | Signature | Notes |
|---|---|---|
| `getAllPlayers()` | `() => Player[]` | Full roster |
| `getPlayerById(id)` | `(id: string) => Player \| undefined` | Single player lookup |

### Wellness

| Function | Signature | Notes |
|---|---|---|
| `getWellnessForPlayer(playerId)` | `(playerId: string) => WellnessEntry[]` | Sorted by date DESC |
| `getLatestWellness(playerId)` | `(playerId: string) => WellnessEntry \| undefined` | Most recent entry |
| `getAllLatestWellness()` | `() => (WellnessEntry & { player: Player })[]` | Latest per player, enriched |

### Training Sessions

| Function | Signature | Notes |
|---|---|---|
| `getAllSessions()` | `() => (TrainingSession & { playerName: string })[]` | Sorted date DESC, name ASC |
| `getSessionsForPlayer(playerId)` | `(playerId: string) => TrainingSession[]` | Sorted date DESC |

### Risk (computed, not stored)

| Function | Signature | Notes |
|---|---|---|
| `getRiskSnapshot(playerId, asOf?)` | `(playerId: string, asOf?: string) => PlayerRiskSnapshot` | Single player |
| `getAllRiskSnapshots(asOf?)` | `(asOf?: string) => (PlayerRiskSnapshot & { player: Player })[]` | All players |
| `getAllRiskSnapshotsSorted(asOf?)` | `(asOf?: string) => (PlayerRiskSnapshot & { player: Player })[]` | Sorted by risk priority |

### Constants

| Export | Value | Notes |
|---|---|---|
| `MOCK_AS_OF` | `"2026-04-04"` | Reference date for mock data. Will become `new Date()` with real backend. |

## Write Methods

| Function | Signature | Notes |
|---|---|---|
| `submitWellnessCheckIn(input)` | `(input: unknown) => ValidationResult<WellnessEntry>` | Validates, derives overallScore, resolves bodyMap labels from registry, stores entry |
| `submitTrainingSession(input)` | `(input: unknown) => ValidationResult<TrainingSession>` | Validates, derives sessionLoad (rpe × duration), stores session |

Write methods accept `unknown` and validate internally. On success they return `{ ok: true, data }`. On failure, `{ ok: false, errors: string[] }`.

### Validation rules

**Wellness check-in:**
- playerId: non-empty string
- date: YYYY-MM-DD format
- 6 metrics (fatigue, soreness, sleepQuality, recovery, stress, mood): integer 1-10
- bodyMap: optional array; each item must have valid regionKey (checked against `MUSCLE_REGIONS`), severity 1-10, no duplicate regionKey
- overallScore: derived as mean of 6 metrics
- bodyMap labels: resolved from the region registry, not trusted from client input

**Training session:**
- playerId: non-empty string
- date: YYYY-MM-DD format
- type: one of training, match, gym, recovery
- durationMinutes: integer 1-600
- rpe: integer 1-10
- sessionLoad: derived server-side as rpe × durationMinutes (never accepted from client)

## API Routes

| Route | Method | Service function |
|---|---|---|
| `/api/wellness/check-in` | POST | `submitWellnessCheckIn` |
| `/api/sessions` | POST | `submitTrainingSession` |

Both return 201 + entity on success, 400 + `{ errors }` on validation failure.

## Page / Route → Service Mapping

| Consumer | Service functions used |
|---|---|
| `/dashboard` | `getAllRiskSnapshotsSorted`, `MOCK_AS_OF` |
| `/players` | `getAllPlayers`, `getLatestWellness`, `getAllRiskSnapshots` |
| `/players/[id]` | `getPlayerById`, `getWellnessForPlayer`, `getLatestWellness`, `getRiskSnapshot` |
| `/wellness` | `getAllLatestWellness` |
| `/workload` | `getAllSessions` |
| `/check-in` | None yet (form-only, writes to local state; will call API route when wired) |
| `/api/wellness/check-in` | `submitWellnessCheckIn` |
| `/api/sessions` | `submitTrainingSession` |

## Migration to Async

When the service functions become `async` (backed by Prisma or API calls):

1. Server components (`dashboard`, `players/[id]`, `wellness`, `workload`) already support `async` — just add `await`.
2. Client components (`players` list) will need to move data fetching to a server component wrapper or use `use()` / SWR.
3. The function signatures in `service.ts` change from `() => T` to `() => Promise<T>`.

## Body Map Shape: API vs Database

The application/API shape is always `WellnessEntry.bodyMap: BodyMapSelection[]`. Pages and components see an embedded array.

The database stores body map data as **normalized child rows** in `wellness_body_map_selections` (see `docs/database-schema.md`). The data service is responsible for:
- **On read:** joining child rows and assembling the `bodyMap` array
- **On write:** decomposing the `bodyMap` array into child row inserts

This normalization enables SQL-level queries on `region_key` for analytics, recurrence tracking, and per-muscle risk rules.

## Service Design Notes

- **Reads + writes.** Write operations validate input, derive computed fields, and mutate in-memory arrays. API routes delegate to the same service functions.
- **Thin by design.** The service is a single file of concrete functions, not an abstract interface hierarchy. This is appropriate for the current prototype phase.
- **If the service grows,** split by domain into separate modules: `data/players.ts`, `data/wellness.ts`, `data/sessions.ts`, `data/risk.ts`. Keep the current `service.ts` as a barrel re-export so page imports don't change.

## Files

| File | Role |
|---|---|
| `src/lib/data/service.ts` | Public API — all data reads route through here |
| `src/lib/mock-data.ts` | Private seed data — not imported by pages |
| `src/lib/risk.ts` | Pure computation — imported by service for snapshot building |
| `src/lib/types.ts` | Shared interfaces — used by all layers |
