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

### Milestone 11 — Check-in Form Wired to API
- Wellness form submits via `fetch POST /api/wellness/check-in` instead of local-only state
- Loading spinner on submit button during request
- Validation errors from API displayed as an error summary above the form; entered values preserved
- Success screen shows body area count from the API response
- "Submit Another" resets form completely
- Demo `playerId` hardcoded until auth exists
- 5 new tests: successful submit, API error display, network error, success reset, loading state

### Milestone 12 — Wellness Write Business Rules
- One check-in per player per day enforced in service layer (duplicate rejected with clear error)
- Error shape standardized to `WriteError { field?: string; message: string }` across all write paths
- Field-level error attribution on all validation and business rule failures
- Duplicate-date check runs after validation passes, before data mutation
- 106 tests across 8 test files (4 new: duplicate rejection, cross-player same date, error shape stability)

### Milestone 13 — Training Session Creation UI
- `/workload/log` page with session creation form: date, type selector, duration, RPE rating, notes
- Live session load preview (RPE x duration) shown before submit
- Submits via `fetch POST /api/sessions` with loading, success, error, and reset states
- "Log Session" link added to workload page header
- `SessionForm` component matches wellness form UX patterns (error summary, loading spinner, success screen)
- 6 new component tests + 1 new service integration test (session readable after creation)

### Milestone 14 — PostgreSQL Persistence via Prisma
- Prisma 7 schema with 4 tables: Player, WellnessEntry, WellnessBodyMapSelection, TrainingSession
- Body map stored as normalized child rows; assembled into bodyMap array on read by the service
- `src/lib/db.ts` Prisma client singleton with `@prisma/adapter-pg`
- All service functions converted to async Prisma queries
- All server component pages updated to async/await with `force-dynamic`
- Players list restructured: server component (data fetch) + client component (search UI)
- Seed script (`prisma/seed.ts`) populates database from existing mock data
- `mock-data.ts` remains as seed input only, not as runtime storage
- Risk snapshots still computed on-the-fly (not persisted)
- 111 tests across 9 test files (service-writes tests refactored to test validation layer directly)

### Milestone 15 — Persistence Hardening + Wellness Update Flow
- `updateWellnessCheckIn(entryId, input)` in service layer — validates, finds entry, prevents cross-player edit, replaces body map child rows in Prisma transaction
- `PUT /api/wellness/check-in` route — requires `entryId` in body, returns 200 on success
- POST still rejects same-day duplicates; PUT is the explicit update path
- Integration test suite (`src/test/integration/`) with separate vitest config (node environment, requires DB)
- `npm run test:integration` script added
- 3 new unit tests for update validation contract
- 6 integration tests: create + duplicate rejection, update + body map replacement, not-found, cross-player rejection, risk reads updated data
- README.md rewritten with full setup, routes, scripts, architecture
- 114 unit tests + 6 integration tests

### Milestone 16 — Wellness Edit UI
- `/players/[id]/edit-checkin` page — pre-fills wellness form from latest entry data
- `WellnessForm` supports `mode="create"` (POST) and `mode="edit"` (PUT) via `initialEntry` prop
- Edit mode: pre-fills all 6 metrics, notes, body map selections; body map section auto-opens if selections exist
- Edit mode: sends PUT with `entryId`; success shows "Check-in Updated" with "Back to Player" button
- Player detail page: "Edit" link on the latest check-in card
- 3 new unit tests: pre-fill verification, PUT method + entryId sent, edit-mode success UI
- Integration tests ready (6 cases, require running PostgreSQL with `npm run test:integration`)
- 117 unit tests across 9 test files

### Milestone 17 — Integration Test Execution + DB Hardening
- Dedicated test PostgreSQL via Docker (port 5555, separate from dev)
- `.env.test` for test database connection
- `npm run db:test:setup` — pushes schema + seeds test DB in one command
- `npm run test:integration` — 7 DB-backed tests (node environment, loads `.env.test`)
- `npm run test:all` — runs unit tests then integration tests sequentially
- Prisma seed script updated for Prisma 7 adapter pattern
- Integration tests cover: create + bodyMap readable, duplicate POST rejection, update + bodyMap replacement, not-found rejection, cross-player rejection, training session create, risk reads updated data
- All 4 checks pass: `npm test` (117), `npm run test:integration` (7), `npm run build`, `npm run lint`

### Milestone 18 — Authentication + RBAC
- Auth.js v5 with credentials provider and JWT sessions
- User model with email, hashedPassword, name, role (admin/coach/player), optional playerId link
- Login page at `/login` with demo accounts
- Middleware-based route protection: unauthenticated users redirected to login
- Player role restrictions: can only access own check-in, own player detail, dashboard
- Coach/admin: full squad access + session logging
- API routes derive identity from session (no trusted client playerId)
- Players' playerId forced from session on write routes
- Training session creation restricted to coach/admin roles
- Sidebar navigation filtered by role (Staff sections for coach/admin, Player section for players)
- Sign-out button in header
- Hardcoded demo playerId removed from all pages
- Seed script creates 3 demo users (admin, coach, player linked to Emre Yilmaz)
- All databases switched to local PostgreSQL (Docker removed)
- 117 unit tests + 7 integration tests, all passing

### Auth Completion — Session Propagation + RBAC Tests + Coach Player Picker
- All protected pages pass session `userRole`/`userName` to AppShell → Sidebar
- Sidebar shows real user name and role for every page
- 13 auth/RBAC unit tests covering hasRole, canAccessPlayer, documented authorization rules
- Coach/admin player picker at `/check-in`: dropdown selects player, then opens WellnessForm
- Players see own check-in form directly; coaches/admins see player picker
- Staff sidebar includes "Submit Check-in" link
- No hardcoded playerId anywhere in the codebase
- 142 unit tests + 7 integration tests, all passing

### Workload Player Picker
- `/workload/log` now uses a proper player dropdown (matching check-in UX)
- Free-text playerId input removed from SessionForm
- SessionForm receives `playerId` + `playerName` as required props
- `PlayerPickerSession` component wraps dropdown + form
- Server component fetches player list, passes to client picker
- Success screen shows player name with session load

### Player Workload Visibility
- `/players/[id]` now shows "Recent Sessions" section with training session data
- Mini summary stats: total sessions, average load, peak load
- Session table: date, type badge, duration, RPE chip, load (color-coded)
- Up to 10 most recent sessions shown, sorted by date descending
- Wellness + risk + workload all visible together on one player page

### Compact Trend Visualization
- Zero-dependency SVG `Sparkline` component — polyline + filled area + endpoint dot
- Wellness score trend (green) and session load trend (amber) shown side by side
- Up to 10 data points per chart, oldest first
- Current value displayed prominently next to each chart
- Graceful empty state when fewer than 2 data points
- Placed between Risk Profile and Latest Check-in on player detail

### Interpreted Trend Insights
- Pure function `generatePlayerInsights()` in `src/lib/insights.ts`
- 12 deterministic insight rules: wellness trend (up/down), low/high wellness score, load spike, peak load, combined decline+load, soreness flags (many/none), ACWR range (high/optimal/low)
- Each insight typed as positive (green), warning (orange), or neutral (gray)
- Displayed as compact colored rows below the sparklines in the Trends card
- Empty state: hidden when no insights generated; "No data" when zero entries + sessions
- 12 unit tests covering every rule and edge case
- 142 unit tests + 7 integration tests total

### Squad-Level Insights on Dashboard
- Pure function `generateSquadInsights()` in `src/lib/squad-insights.ts`
- 7 squad-level rules: declining wellness, high ACWR, 3+ soreness flags, low wellness, no recent data, overloaded+fatigued, all-clear
- Each insight carries `playerIds[]` for linking to player detail pages
- `SquadInsightsCard` component renders insights with clickable player name links
- Placed between stat cards and risk table on dashboard
- 14 unit tests covering all rules, boundaries, and edge cases
- No new DB queries — reuses existing `getAllRiskSnapshotsSorted()` data

### Prisma Runtime Fix + Player Analytics Page
- Fixed Prisma/Turbopack `node:path` runtime error: reverted from custom `src/generated/prisma` output to standard `@prisma/client` import path
- Removed stale `src/generated/` directory and all imports referencing it
- Added `serverExternalPackages` to next.config.ts for server-only deps
- Prisma generator changed from `prisma-client` to `prisma-client-js` (standard provider)
- New route: `/players/[id]/analytics` with wellness + load trend charts
- `AnalyticsChart` component with 7d/14d/30d/All time window controls
- Sparkline component made responsive with `viewBox` instead of fixed `width`
- Insight summary ("What stands out") reuses `generatePlayerInsights()` from `insights.ts`
- "View Analytics" link on player detail header card
- Access control: same as player detail (coach/admin + own player)
- Turbopack remains enabled — no webpack fallback needed

## Current Stable Baseline

The application is a **full-stack application with complete authentication, RBAC, analytics, and PostgreSQL persistence**:
- All major UI screens built with session-aware navigation
- Auth.js v5 authentication with credentials provider and JWT sessions
- Role-based access control: admin, coach, player — enforced via middleware + API routes
- Dashboard shows stat cards, squad-level insights with linked player names, and risk table
- Player detail shows risk profile, trend sparklines + interpreted insights, latest check-in, body soreness, recent sessions, wellness history
- Player analytics page with interactive charts and time window controls
- Coach/admin player picker on both check-in and session logging pages
- Data persisted in PostgreSQL via Prisma 7 (standard @prisma/client import)
- Wellness check-in: POST creates, PUT updates, identity from session
- Training session creation restricted to coach/admin with player dropdown
- One check-in per player per day enforced
- Wellness edit UI at `/players/[id]/edit-checkin`
- Body map selections stored as normalized child rows
- Risk computation (ACWR, wellness trend, soreness flags) from persisted data
- Polished responsive design
- 156 unit tests + 7 integration tests, all passing

All four checks pass: unit tests, integration tests, build, lint.

## Next Likely Milestones

### Advanced Analytics
- Body map heatmap history (which muscles are repeatedly sore)
- Squad-level trend visualization
- Exportable reports

### Advanced Risk Features
- Per-muscle-group risk scoring (correlate ACWR with body map regionKey patterns)
- Configurable risk thresholds and alert rules
- Push notifications for critical risk changes

### OAuth Providers
- Add Google/GitHub OAuth alongside credentials
- Link OAuth accounts to existing users

## Dependencies and Sequencing

```
Analytics / Trends
  └── Advanced Risk Features
```

Authentication and persistence are complete. Analytics is the next major feature area.

## Risks and Open Decisions

| Item | Status |
|---|---|
| Backend technology | Decided: Next.js API routes + Prisma 7 + PostgreSQL |
| Auth provider | Decided: Auth.js v5 with credentials. OAuth providers deferred. |
| Female body map | Deferred. Requires gender/body-type selector in check-in flow. |
| Real-time features | Not decided. WebSocket or polling depends on use case. |
| Mobile native app | Not planned. Responsive web app works on mobile browsers. |
