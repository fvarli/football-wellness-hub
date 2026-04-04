# Database Schema Design

Target schema for when persistence is added. Not implemented yet — this is the design reference.

## Tables

### players

| Column | Type | Notes |
|---|---|---|
| id | UUID / CUID | Primary key |
| name | TEXT | Not null |
| position | TEXT | GK, CB, LB, etc. |
| number | INTEGER | Squad number |
| age | INTEGER | |
| status | TEXT | "available", "injured", "resting" |
| created_at | TIMESTAMP | Auto-set |
| updated_at | TIMESTAMP | Auto-set on update |

### wellness_entries

| Column | Type | Notes |
|---|---|---|
| id | UUID / CUID | Primary key |
| player_id | FK → players.id | Not null |
| date | DATE | One entry per player per day (unique constraint on player_id + date) |
| fatigue | INTEGER | 1-10 |
| soreness | INTEGER | 1-10 |
| sleep_quality | INTEGER | 1-10 |
| recovery | INTEGER | 1-10 |
| stress | INTEGER | 1-10 |
| mood | INTEGER | 1-10 |
| overall_score | DECIMAL(3,1) | Derived: mean of 6 metrics. Stored for fast reads. |
| body_map | JSONB | Array of BodyMapSelection objects |
| notes | TEXT | Nullable |
| submitted_by | FK → users.id | Future: who submitted (player or coach on behalf) |
| created_at | TIMESTAMP | Auto-set |
| updated_at | TIMESTAMP | Auto-set on update |

### training_sessions

| Column | Type | Notes |
|---|---|---|
| id | UUID / CUID | Primary key |
| player_id | FK → players.id | Not null |
| date | DATE | Multiple sessions per day allowed |
| type | TEXT | "training", "match", "gym", "recovery" |
| duration_minutes | INTEGER | Not null |
| rpe | INTEGER | 1-10 |
| session_load | INTEGER | Derived: rpe * duration_minutes. Stored for fast aggregation. |
| notes | TEXT | Nullable |
| logged_by | FK → users.id | Future: who logged the session |
| created_at | TIMESTAMP | Auto-set |
| updated_at | TIMESTAMP | Auto-set on update |

## Body Map Storage Decision

**Embedded JSON (JSONB column) in wellness_entries.**

Reasons:
- Body map selections are always read/written together with the wellness entry
- No cross-entry queries needed on individual selections (risk computation reads all entries for a player and processes in application code)
- JSON serialization shape matches the TypeScript interface exactly
- No join overhead
- Simpler schema

A child table (`body_map_selections` with FK to wellness_entries) would be justified if:
- We need SQL-level queries like "all entries where left_hamstring severity > 7"
- We need database-level indexing on regionKey or severity

For now, JSONB is the right choice. The risk computation module already handles filtering in application code.

### JSONB Shape

```json
[
  {
    "regionKey": "left_hamstring",
    "label": "L. Hamstring",
    "view": "back",
    "side": "right",
    "severity": 7
  }
]
```

## Indexes

| Table | Index | Columns | Purpose |
|---|---|---|---|
| wellness_entries | unique | (player_id, date) | One entry per player per day |
| wellness_entries | btree | (player_id, date DESC) | Fast player wellness history query |
| training_sessions | btree | (player_id, date DESC) | Fast player session history query |
| training_sessions | btree | (date DESC) | Squad-wide session listing |

## Audit Fields

Every table gets `created_at` and `updated_at` automatically. When authentication is added:
- `submitted_by` on wellness_entries (the player who checked in, or coach on behalf)
- `logged_by` on training_sessions (the coach/admin who logged it)

These are nullable until auth is implemented.

## PlayerRiskSnapshot — Not a Table

Risk snapshots are derived data recomputed from wellness entries and training sessions. They are **not stored in the database** unless performance requires caching.

If caching is needed later, options:
- Materialized view refreshed on data change
- Dedicated `risk_snapshots` table with TTL-based invalidation
- Application-level cache (Redis)

Current approach: compute on every page render. Acceptable for <50 players.

## Prisma Schema Preview

```prisma
model Player {
  id        String   @id @default(cuid())
  name      String
  position  String
  number    Int
  age       Int
  status    String   @default("available")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  wellnessEntries  WellnessEntry[]
  trainingSessions TrainingSession[]
}

model WellnessEntry {
  id           String   @id @default(cuid())
  playerId     String
  date         String   // ISO YYYY-MM-DD
  fatigue      Int
  soreness     Int
  sleepQuality Int
  recovery     Int
  stress       Int
  mood         Int
  overallScore Float
  bodyMap      Json     @default("[]")
  notes        String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  player Player @relation(fields: [playerId], references: [id])

  @@unique([playerId, date])
  @@index([playerId, date(sort: Desc)])
}

model TrainingSession {
  id              String   @id @default(cuid())
  playerId        String
  date            String   // ISO YYYY-MM-DD
  type            String
  durationMinutes Int
  rpe             Int
  sessionLoad     Int
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  player Player @relation(fields: [playerId], references: [id])

  @@index([playerId, date(sort: Desc)])
  @@index([date(sort: Desc)])
}
```
