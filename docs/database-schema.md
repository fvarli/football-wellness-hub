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

### wellness_body_map_selections

| Column | Type | Notes |
|---|---|---|
| id | UUID / CUID | Primary key |
| wellness_entry_id | FK → wellness_entries.id | Not null, cascade delete |
| region_key | TEXT | Canonical muscle key (e.g. "left_hamstring"). Not null. |
| label | TEXT | Human-readable label at time of entry |
| view | TEXT | "front" or "back" — which SVG view was used |
| side | TEXT | "left", "right", "center", or null |
| severity | INTEGER | 1-10 |

## Body Map Storage Decision

**Normalized child rows in `wellness_body_map_selections`, not embedded JSONB.**

Reasons:
- Future analytics require SQL-level queries on `region_key` — e.g. "all entries where left_hamstring severity > 7 in the last 30 days"
- Soreness recurrence tracking (which muscles are flagged repeatedly) is a core product feature that benefits from indexed `region_key` queries
- Per-muscle risk rules will join `region_key` across body map selections and training session data
- Database-level aggregation (COUNT, AVG severity per region per player) avoids loading and parsing JSON blobs in application code
- Proper foreign key constraints ensure referential integrity

### Application/API shape stays embedded

The TypeScript interface remains `WellnessEntry.bodyMap: BodyMapSelection[]`. The data access service assembles the embedded array on read and decomposes it on write. Pages never see the normalized structure.

```
Database:  wellness_entries  ←1:N→  wellness_body_map_selections
API/App:   WellnessEntry.bodyMap: BodyMapSelection[]
```

### Why not JSONB

JSONB would be simpler initially but creates problems as the product matures:
- No foreign key or type constraints on individual selections
- No database-level indexing on `region_key` or `severity`
- Aggregation queries require JSON extraction functions which are slower and harder to optimize
- Schema changes to the selection shape require data migration of blob contents

## Indexes

| Table | Index | Columns | Purpose |
|---|---|---|---|
| wellness_entries | unique | (player_id, date) | One entry per player per day |
| wellness_entries | btree | (player_id, date DESC) | Fast player wellness history query |
| wellness_body_map_selections | btree | (wellness_entry_id) | Fast join to parent entry |
| wellness_body_map_selections | btree | (region_key, severity) | Per-muscle analytics and risk queries |
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
  date         String
  fatigue      Int
  soreness     Int
  sleepQuality Int
  recovery     Int
  stress       Int
  mood         Int
  overallScore Float
  notes        String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  player       Player @relation(fields: [playerId], references: [id])
  bodyMapSelections WellnessBodyMapSelection[]

  @@unique([playerId, date])
  @@index([playerId, date(sort: Desc)])
}

model WellnessBodyMapSelection {
  id              String @id @default(cuid())
  wellnessEntryId String
  regionKey       String
  label           String
  view            String
  side            String?
  severity        Int

  wellnessEntry WellnessEntry @relation(fields: [wellnessEntryId], references: [id], onDelete: Cascade)

  @@index([wellnessEntryId])
  @@index([regionKey, severity])
}

model TrainingSession {
  id              String   @id @default(cuid())
  playerId        String
  date            String
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
