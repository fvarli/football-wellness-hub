# Domain Model

This document defines the data model for Football Wellness Hub. It covers what exists today, what needs to be added for workload/risk tracking, and how the models relate.

## Entity Relationship Overview

```
Player
  │
  ├── 1:N ── WellnessEntry (one per day per player)
  │            │
  │            └── 1:N ── BodyMapSelection (soreness per muscle per entry)
  │
  ├── 1:N ── TrainingSession (one per session per player)
  │
  └── 1:1 ── PlayerRiskSnapshot (latest derived metrics, recalculated)
```

## Models

### 1. Player

The core entity. Represents a squad member.

```typescript
interface Player {
  id: string;
  name: string;
  position: string;       // GK, CB, LB, RB, CM, CAM, ST, etc.
  number: number;          // squad number
  age: number;
  status: PlayerStatus;    // "available" | "injured" | "resting"
}
```

| Field | Source | Notes |
|---|---|---|
| id | System-generated | Primary key. Currently simple string, will become UUID or DB-generated. |
| name | Admin input | Display name. |
| position | Admin input | Free text for now. Could become an enum. |
| number | Admin input | Squad number. |
| age | Admin input | Integer. Could derive from date of birth later. |
| status | Admin/coach input | Determines availability. Body map soreness data may inform this in the future but does not set it automatically. |

**Exists today:** Yes, in `src/lib/types.ts` and `src/lib/mock-data.ts`.

---

### 2. WellnessEntry

A player's daily subjective wellness check-in. One entry per player per day.

```typescript
interface WellnessEntry {
  id: string;
  playerId: string;        // FK → Player.id
  date: string;            // ISO YYYY-MM-DD
  fatigue: number;         // 1-10, higher = better (less fatigued)
  soreness: number;        // 1-10, higher = better (less sore)
  sleepQuality: number;    // 1-10, higher = better
  recovery: number;        // 1-10, higher = better
  stress: number;          // 1-10, higher = better (less stressed)
  mood: number;            // 1-10, higher = better
  notes?: string;
  overallScore: number;    // DERIVED: average of the 6 metrics
  bodyMap: BodyMapSelection[];  // EMBEDDED: muscle-level soreness
}
```

| Field | Source | Notes |
|---|---|---|
| id | System-generated | Primary key. |
| playerId | System (from auth context) | Links to the player who submitted. |
| date | System (submission date) | One entry per player per day. Later submissions on the same day should update, not duplicate. |
| fatigue..mood | Player input | Six subjective 1-10 ratings. Higher = better. |
| notes | Player input | Optional free text. |
| overallScore | **Derived** | `mean(fatigue, soreness, sleepQuality, recovery, stress, mood)`. Computed on write, stored for fast reads. |
| bodyMap | Player input | Array of per-muscle soreness selections. Embedded directly in the entry. |

**Exists today:** Yes, in `src/lib/types.ts` and `src/lib/mock-data.ts`. Body map data is embedded in each `WellnessEntry` as a `bodyMap` array. A deprecated `getBodyMapForEntry()` helper remains for backward compatibility but reads from `entry.bodyMap` internally.

---

### 3. BodyMapSelection

A single muscle-level soreness mark within a wellness entry. Zero or more per entry.

```typescript
interface BodyMapSelection {
  regionKey: string;       // canonical key from body-regions.ts (e.g. "left_hamstring")
  label: string;           // human-readable ("L. Hamstring")
  view: BodyMapView;       // "front" | "back" — which SVG view was used
  side: BodySide | null;   // "left" | "right" | "center" | null
  severity: number;        // 1-10, higher = worse
}
```

| Field | Source | Notes |
|---|---|---|
| regionKey | Player input (via SVG click + severity pick) | **Join key** for future per-muscle ACWR and risk logic. Must match a key in `MUSCLE_REGIONS`. |
| label | Derived from regionKey | Self-describing for display without registry lookup. |
| view | System (which SVG was clicked) | Informational. Not part of identity. |
| side | Derived from regionKey | Laterality. |
| severity | Player input | 1 = minimal, 10 = severe. Only persisted when explicitly chosen. |

**Exists today:** Yes, in `src/lib/types.ts`. No changes needed.

---

### 4. TrainingSession (NEW)

A training or match session logged by coaching staff. One per session per player.

```typescript
interface TrainingSession {
  id: string;
  playerId: string;        // FK → Player.id
  date: string;            // ISO YYYY-MM-DD
  type: SessionType;       // "training" | "match" | "gym" | "recovery"
  durationMinutes: number; // total session duration
  rpe: number;             // 1-10, Rate of Perceived Exertion (player-reported)
  sessionLoad: number;     // DERIVED: rpe × durationMinutes (arbitrary units)
  notes?: string;
}

type SessionType = "training" | "match" | "gym" | "recovery";
```

| Field | Source | Notes |
|---|---|---|
| id | System-generated | Primary key. |
| playerId | System | The player this session is for. |
| date | Coach/admin input | Session date. Multiple sessions per day are allowed (e.g. morning training + afternoon gym). |
| type | Coach/admin input | Categorizes the session. Affects how load is weighted in ACWR. |
| durationMinutes | Coach/admin input | Session length. |
| rpe | Player input (post-session) | Collected ~30 min after session. Standard Borg CR-10 scale. |
| sessionLoad | **Derived** | `rpe × durationMinutes`. Stored for fast aggregation. The fundamental unit for ACWR. |
| notes | Coach/admin input | Optional. |

**Exists today:** TypeScript interface defined in `src/lib/types.ts`. No mock data or UI yet.

---

### 5. PlayerRiskSnapshot (NEW)

Derived metrics for a player, recalculated whenever new data arrives. Not user-editable.

```typescript
interface PlayerRiskSnapshot {
  playerId: string;           // FK → Player.id
  calculatedAt: string;       // ISO timestamp of last recalculation
  // Workload
  acuteLoad: number;          // sum of sessionLoad over last 7 days
  chronicLoad: number;        // avg weekly sessionLoad over last 28 days
  acwr: number | null;        // DERIVED: acuteLoad / chronicLoad (null if insufficient data)
  // Wellness
  latestWellnessScore: number | null;
  wellnessTrend: TrendDirection;  // "improving" | "stable" | "declining"
  // Soreness
  sorenessFlags: SorenessFlag[];  // muscles with recurring or high-severity soreness
  // Overall
  riskLevel: RiskLevel;       // "low" | "moderate" | "high" | "critical"
}

type TrendDirection = "improving" | "stable" | "declining";
type RiskLevel = "low" | "moderate" | "high" | "critical";

interface SorenessFlag {
  regionKey: string;          // canonical muscle key
  label: string;
  reason: string;             // e.g. "severity 8+ in last 3 days", "recurring 5+ days"
  latestSeverity: number;
}
```

| Field | Source | Notes |
|---|---|---|
| playerId | System | One snapshot per player. |
| calculatedAt | System | Timestamp of last recalculation. |
| acuteLoad | **Derived** | Sum of `sessionLoad` for last 7 calendar days. |
| chronicLoad | **Derived** | Average weekly `sessionLoad` over last 28 days (4-week rolling). |
| acwr | **Derived** | `acuteLoad / chronicLoad`. Null when `chronicLoad` is zero or insufficient history (<14 days of data). |
| latestWellnessScore | **Derived** | Most recent `WellnessEntry.overallScore`. |
| wellnessTrend | **Derived** | Compares last 3 days of wellness scores. |
| sorenessFlags | **Derived** | Muscles flagged by rule engine (high severity, recurring pattern). Uses `regionKey` as join key to body map data. |
| riskLevel | **Derived** | Composite score from ACWR range + wellness trend + soreness flags. |

**Exists today:** TypeScript interfaces defined in `src/lib/types.ts` (`PlayerRiskSnapshot`, `SorenessFlag`, `RiskLevel`, `TrendDirection`). No computation or UI yet.

---

## Source-of-Truth vs Derived

| Data | Type | Persistence |
|---|---|---|
| Player profile | Source | Database |
| Wellness ratings (6 metrics) | Source | Database (per entry) |
| Body map selections (regionKey + severity) | Source | Database (embedded in entry) |
| Wellness overallScore | **Derived** | Stored on write for fast reads |
| Training session (type, duration, RPE) | Source | Database |
| Session load (RPE x duration) | **Derived** | Stored on write |
| Acute/chronic load, ACWR | **Derived** | Recalculated, cached in snapshot |
| Wellness trend | **Derived** | Recalculated |
| Soreness flags | **Derived** | Recalculated from body map history |
| Risk level | **Derived** | Recalculated from all derived signals |

**Rule:** Derived fields are recomputable from source data. They are stored for read performance, not as source of truth. If source data is corrected, derived fields must be recalculated.

## Frontend-Only vs Backend

| Data | Current | Future |
|---|---|---|
| Player list | Mock array in `mock-data.ts` | Database table |
| Wellness entries | Mock array in `mock-data.ts` | Database table |
| Body map selections | Embedded in `WellnessEntry.bodyMap` in `mock-data.ts` | Database (JSON column or child table within wellness entry) |
| Training sessions | **Types defined**, no mock data yet | Database table |
| Risk snapshots | **Types defined**, no computation yet | Database table or materialized view |
| Canonical muscle regions | Static registry in `body-regions.ts` | **Stays frontend.** This is UI metadata, not user data. |
| Severity colors/bands | Component code | **Stays frontend.** Presentation logic. |

## Key Join Relationships

```
Player.id
  ← WellnessEntry.playerId
  ← TrainingSession.playerId
  ← PlayerRiskSnapshot.playerId

WellnessEntry.bodyMap[].regionKey
  → MUSCLE_REGIONS[].key        (display metadata)
  → SorenessFlag[].regionKey    (risk correlation)
```

The `regionKey` is the bridge between athlete-reported soreness and derived risk signals. It must remain stable across body map UI updates.

## Phased Implementation Plan

### Phase 1 — Embed Body Map in Wellness Entry ✅

`bodyMap: BodyMapSelection[]` is embedded in `WellnessEntry`. The separate `bodyMapEntries` side-table has been removed. Player detail page reads `entry.bodyMap` directly.

### Phase 2 — Add Training Session UI + Mock Data ✅

22 mock training sessions across 3 days for 8 players. `/workload` page shows session list with summary cards. `getAllSessions()` and `getPlayerSessions()` helpers provide sorted, enriched data access.

### Phase 3a — Risk Computation Module ✅

Pure functions implemented in `src/lib/risk.ts`:
- `calculateAcuteLoad` — 7-day session load sum
- `calculateChronicLoad` — 28-day average weekly load
- `calculateAcwr` — acute/chronic ratio (null if insufficient history)
- `getLatestWellnessScore` — most recent overallScore
- `calculateWellnessTrend` — improving/stable/declining from recent vs prior entries
- `calculateSorenessFlags` — high-severity or recurring muscle flags
- `calculateRiskLevel` — composite rule-based level from ACWR + trend + flags
- `calculatePlayerRiskSnapshot` — assembles full snapshot from source data

30 unit tests cover all functions and edge cases.

### Phase 3b — Risk Display in UI

Next: integrate `calculatePlayerRiskSnapshot` into dashboard and player detail pages.

**Files:** dashboard updates, player detail updates

### Phase 4 — Backend Persistence

Replace mock data with API calls. All interfaces stay the same — only the data access layer changes.

**Files:** New API routes or service layer, mock-data.ts → api-client.ts
