# Roadmap

## Done

### Milestone 1 — Bootstrap
- Next.js 16 project with TypeScript, Tailwind CSS 4, ESLint, App Router, `src/` directory

### Milestone 2 — App Shell and Design System
- Sidebar navigation with role-aware sections (Staff / Player / System)
- Top header with title, notification indicator, avatar
- Responsive layout (sidebar collapses on mobile)
- Dashboard with mock stat cards
- Design tokens (colors, spacing, typography)

### Milestone 3 — Player List, Wellness Form, Check-in
- Demo player roster with search and status badges
- Player detail page with wellness history table
- Daily wellness check-in form (fatigue, soreness, sleep, recovery, stress, mood)
- 1-10 rating input with color-coded progress bar
- Squad-wide wellness overview table
- Route structure designed for future role-based access: `/dashboard`, `/players`, `/players/[id]`, `/wellness`, `/check-in`

### Milestone 4 — Anatomical Body Soreness Map
- Male front and back SVG anatomy from reference source
- 26 canonical muscle region keys with laterality (left/right)
- 7 shared regions rendering in both front and back views
- Severity 1-10 with 4-band solid color scale (Mild, Moderate, High, Severe)
- Interactive selection: focus region, pick severity, remove
- Read-only rendering for coach/detail views
- Hover feedback, focus-visible keyboard ring, native SVG tooltips
- Integration into check-in form (collapsible section) and player detail (summary)
- Vitest test suite (28 tests: data model + component interaction)
- Architecture and QA documentation

### Milestone 5 — Domain Model Foundation
- Unified domain model design documented in `docs/domain-model.md`
- Body map selections embedded directly in `WellnessEntry.bodyMap` (removed separate `bodyMapEntries` side-table)
- `TrainingSession` and `SessionType` types defined for workload tracking
- `PlayerRiskSnapshot`, `SorenessFlag`, `RiskLevel`, `TrendDirection` types defined for injury risk
- Source-of-truth vs derived field classification documented
- Phased implementation plan from frontend mock to backend persistence

### Milestone 6 — Workload Foundation
- Mock training session data for 8 players across 3 days (22 sessions: match, training, gym, recovery)
- `/workload` page with summary stat cards (total sessions, avg load, highest load)
- Session table: player name, date, type badge, duration, RPE, session load (AU)
- RPE color-coded (green/amber/red), load color-coded by intensity
- `getAllSessions()` and `getPlayerSessions()` data helpers
- Test suite for training session data integrity (8 cases)

### Milestone 7 — Risk Computation Module
- Pure computation layer in `src/lib/risk.ts` — no side effects, no global state
- ACWR: 7-day acute load / 28-day chronic load (4-week average weekly)
- Wellness trend: improving / stable / declining from recent vs prior entry scores
- Soreness flags: severity >= 7 in last 3 days, or recurring in 3+ of last 5 entries
- Composite risk level: critical / high / moderate / low from ACWR + trend + flags
- Full snapshot builder: `calculatePlayerRiskSnapshot()` assembles all derived metrics
- 30 unit tests covering all functions, edge cases, and boundary conditions

### Milestone 8 — Risk Display in UI
- Dashboard: live stat cards computed from risk snapshots (at-risk count, avg wellness, flagged players) + full squad risk table sorted by risk level
- Player list: per-player risk level badge alongside status and wellness score
- Player detail: risk profile card with ACWR value, risk level badge, wellness trend, soreness flag count + flag detail rows
- Presentational components: `RiskLevelBadge`, `TrendBadge`, `AcwrValue` in `risk-badge.tsx`
- 9 component tests for risk badge rendering
- All dashboard stat cards now driven by real computed data instead of hardcoded values

### Milestone 9 — Data Access Layer and Persistence Planning
- Data service abstraction in `src/lib/data/service.ts` — all pages read through this single entry point
- Pages no longer import `mock-data.ts` directly
- Persistence planning docs: `persistence-plan.md`, `data-access-layer.md`, `database-schema.md`
- Recommended stack: Next.js API routes + Prisma + PostgreSQL
- Body map storage decision: normalized child rows for analytics (API shape stays embedded)
- Database schema with indexes, audit fields, Prisma preview
- Migration path from mock arrays → Prisma queries documented

### Milestone 10 — Write Contracts, Validation, and API Routes
- Input validation module (`src/lib/validation.ts`) with pure validator functions
- Wellness check-in contract: 6 metrics validated 1-10, optional bodyMap validated against canonical region registry, duplicate regionKey rejection, overallScore derived server-side, labels resolved from registry
- Training session contract: type/duration/rpe validated, sessionLoad derived server-side (rpe × duration)
- Write methods in data service (`submitWellnessCheckIn`, `submitTrainingSession`) — validate then mutate in-memory arrays
- API route skeletons: `POST /api/wellness/check-in`, `POST /api/sessions` — delegate to service, return 201/400
- 22 new tests: 18 validation + 4 service write integration
- All validation returns `{ ok, data }` or `{ ok: false, errors }` discriminated union

## Current Stable Baseline

The application is a **complete frontend prototype with backend-ready write contracts**:
- All major UI screens built and navigable
- Wellness check-in form with structured body soreness input
- Workload session list with computed load metrics
- Risk computation layer with ACWR, wellness trend, soreness flags, and composite risk level
- Risk data displayed on dashboard, player list, and player detail pages
- Data access service layer with validated reads and writes
- API route skeletons for wellness check-in and training session creation
- Input validation with regionKey verification against canonical body-regions registry
- Polished responsive design
- 97 tests across 7 test files
- Mock data for 8 players with realistic wellness entries and training sessions

All code builds, lints, and tests cleanly.

## Next Likely Milestones

### Backend Persistence
- API routes or external backend for wellness entries and training sessions
- Database for players, entries, body map selections, sessions
- Replace mock data with real API calls
- All TypeScript interfaces are already designed for serialization

### Authentication and RBAC
- Login flow (likely OAuth or credential-based)
- Role assignment: Admin, Coach, Player
- Route protection via middleware or layout-level guards
- Sidebar section visibility based on role

### Analytics and Trends
- Wellness trend charts per player over time
- Body map heatmap history (which muscles are repeatedly sore)
- Squad-level trend visualization
- Exportable reports

### Advanced Risk Features
- Per-muscle-group risk scoring (correlate ACWR with body map regionKey patterns)
- Configurable risk thresholds and alert rules
- Push notifications for critical risk changes

## Dependencies and Sequencing

```
Backend Persistence
  ├── Authentication / RBAC
  └── Analytics / Trends
        └── Advanced Risk Features
```

Backend persistence is the critical-path blocker for multi-user and historical features. ACWR computation and basic risk display already work with mock data.

Body map `regionKey` is the designed join key for per-muscle-group risk correlation.

## Risks and Open Decisions

| Item | Status |
|---|---|
| Backend technology choice | Not decided. Options: Next.js API routes + Prisma, separate Express/NestJS service, or BaaS like Supabase. |
| Auth provider | Not decided. Options: NextAuth.js, Clerk, Auth0, custom. |
| Female body map | Deferred. The reference source includes female SVGs but they are not integrated. Adding them requires a gender/body-type selector in the check-in flow. |
| Real-time features | Not decided. WebSocket or polling for live dashboard updates depends on backend architecture. |
| Mobile native app | Not planned. The web app is responsive and works on mobile browsers. A native wrapper (Capacitor, React Native) could be considered later. |
| Data migration from spreadsheets | Likely needed if replacing an existing tracking process. Format TBD. |
