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

## Page → Service Mapping

| Page | Service functions used |
|---|---|
| `/dashboard` | `getAllRiskSnapshotsSorted`, `MOCK_AS_OF` |
| `/players` | `getAllPlayers`, `getLatestWellness`, `getAllRiskSnapshots` |
| `/players/[id]` | `getPlayerById`, `getWellnessForPlayer`, `getLatestWellness`, `getRiskSnapshot` |
| `/wellness` | `getAllLatestWellness` |
| `/workload` | `getAllSessions` |
| `/check-in` | None (form-only, writes to local state) |

## Migration to Async

When the service functions become `async` (backed by Prisma or API calls):

1. Server components (`dashboard`, `players/[id]`, `wellness`, `workload`) already support `async` — just add `await`.
2. Client components (`players` list) will need to move data fetching to a server component wrapper or use `use()` / SWR.
3. The function signatures in `service.ts` change from `() => T` to `() => Promise<T>`.

## Files

| File | Role |
|---|---|
| `src/lib/data/service.ts` | Public API — all data reads route through here |
| `src/lib/mock-data.ts` | Private seed data — not imported by pages |
| `src/lib/risk.ts` | Pure computation — imported by service for snapshot building |
| `src/lib/types.ts` | Shared interfaces — used by all layers |
