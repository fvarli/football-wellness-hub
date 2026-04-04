# Product Requirements

## Core User Stories

### Player

- **As a player**, I can open the check-in page and submit my daily wellness in under a minute so that I don't skip it.
- **As a player**, I can rate fatigue, soreness, sleep, recovery, stress, and mood on a 1-10 scale.
- **As a player**, I can mark specific muscles that are sore, tight, or painful on an anatomical body map and assign a severity to each.

### Coach / Staff

- **As a coach**, I can see a dashboard with squad-level stats so I know the team's readiness at a glance.
- **As a coach**, I can browse the player list, see each player's latest wellness score and status, and drill into detail.
- **As a coach**, I can view a player's full wellness history and body soreness entries in read-only form.
- **As a coach**, I can scan the wellness overview table to spot players with low scores across the squad.

## Player Check-in Flow

1. Player navigates to `/check-in`.
2. Rates 6 wellness metrics (1-10 each, higher = better). A progress bar shows completion.
3. Optionally expands the Body Soreness Map section.
4. Taps muscle regions on the anatomical SVG to focus them, then picks a severity (1-10, higher = worse).
5. Adds optional free-text notes.
6. Submits via `POST /api/wellness/check-in`. A loading spinner shows during the request. On success, a confirmation appears with the count of marked body areas. On validation failure, error messages appear above the form and all entered values are preserved. Only one check-in per player per day is allowed — a duplicate POST is rejected with a clear error. To update an existing entry, use `PUT /api/wellness/check-in` with the entry's `entryId`. Body map selections are fully replaced on update (not merged).

### Why Severity Is Not Auto-Assigned

Clicking a muscle opens the severity picker but does not create a selection. The player must explicitly choose a severity. This prevents phantom entries from casual or exploratory taps and ensures every persisted soreness record reflects a deliberate input.

## Coach Read-Only Review Flow

1. Coach navigates to `/players` and selects a player.
2. Player detail page shows: profile header, latest wellness scores broken down by metric, body soreness summary (if any), and a wellness history table.
3. Body soreness is displayed as a static list with region labels, severity badges, and severity bands. No interactive editing.
4. Coach can also view `/wellness` for a squad-wide heatmap table.

## Why Soreness Tracking Matters

Muscle soreness patterns correlate with training load, fatigue accumulation, and injury risk. Structured per-muscle tracking enables:

- Early detection of overuse patterns (e.g., recurring hamstring soreness after match days)
- Data for acute:chronic workload ratio (ACWR) calculations per muscle group
- Historical trend analysis for individual players
- Objective input for return-to-play decisions

The body map is the foundation layer. Load calculations and risk scoring are planned future milestones that depend on this data.

## Body Map Product Rules

1. Each muscle has one canonical key. View (front/back) is presentation, not identity.
2. Left and right sides are tracked separately. Laterality matters clinically.
3. Severity is 1-10: 1 = minimal, 10 = severe. Four visual bands: Mild (1-3), Moderate (4-6), High (7-8), Severe (9-10).
4. A selection is only created when the user explicitly picks a severity number.
5. The same muscle tapped from front or back view maps to the same canonical key. No duplicates.
6. Read-only mode shows data without any editing affordance.
7. Seven muscles appear in both front and back SVG views: both shoulders, both forearms, both calves, and trapezius.

See `docs/body-map-architecture.md` for the full technical specification.

## Non-Goals for Current Milestone

| Item | Reason |
|---|---|
| Backend / database | Frontend prototype phase. Mock data only. |
| Authentication / RBAC | Route structure is role-aware but no auth enforcement. |
| ACWR / load calculations | Requires backend persistence first. |
| Injury risk engine | Depends on ACWR + historical data. |
| Charts / trend visualization | Deferred to analytics milestone. |
| Female body map | Male only for now. |
| Push notifications | Requires auth + backend. |
| Exercise / rehab recommendations | Out of scope for wellness tracking. |
