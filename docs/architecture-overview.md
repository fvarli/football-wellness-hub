# Architecture Overview

## Project Structure

```
football-wellness-hub/
  docs/                        Project documentation
  src/
    app/                       Next.js App Router pages
      layout.tsx               Root layout (fonts, metadata)
      page.tsx                 Redirects / to /dashboard
      globals.css              Design tokens + body map CSS
      dashboard/page.tsx       Coach dashboard
      players/page.tsx         Player list
      players/[id]/page.tsx    Player detail (server component, async params)
      wellness/page.tsx        Squad wellness overview
      workload/page.tsx        Training session list + workload summary (with edit/delete actions)
      workload/log/page.tsx    Training session creation form
      workload/edit/[sessionId]/page.tsx  Edit training session (pre-filled form, PUT)
      check-in/page.tsx        Player daily check-in (session-derived playerId)
      login/page.tsx           Credentials login page
      players/[id]/edit-checkin/page.tsx  Edit latest wellness check-in (pre-filled form, PUT)
      players/[id]/analytics/page.tsx    Player analytics: charts + time controls + insights
      api/
        auth/[...nextauth]/route.ts  Auth.js GET/POST handlers
        wellness/check-in/route.ts   POST — create, PUT — update (auth-protected)
        sessions/route.ts            POST/PUT/DELETE — session CRUD (coach/admin only)
        sessions/bulk/route.ts       POST — bulk create sessions (coach/admin only)
    middleware.ts                    Edge-safe route protection via auth.config.ts (no Prisma/bcrypt)
    components/
      app-shell.tsx            Layout wrapper (sidebar + header + content)
      sidebar.tsx              Navigation with role-aware sections
      header.tsx               Top bar with title, notification, avatar
      stat-card.tsx            Dashboard stat card
      wellness-badge.tsx       Colored score badge
      risk-badge.tsx           RiskLevelBadge, TrendBadge, AcwrValue presentational helpers
      rating-input.tsx         1-10 button group for wellness metrics
      wellness-form.tsx        Full check-in form (metrics + body map + notes)
      session-form.tsx         Training session form (type + duration + RPE) — create + edit modes
      session-actions.tsx      Edit link + delete button with confirmation flow
      session-log-switcher.tsx Single/Bulk mode toggle wrapper for session logging
      bulk-session-form.tsx    Bulk session form with multi-player checkboxes + shared fields
      player-picker-checkin.tsx  Coach/admin player selector + wellness form wrapper
      player-picker-session.tsx Coach/admin player selector + session form wrapper
      players-list.tsx         Client-side player search (receives data from server component)
      sparkline.tsx            Zero-dependency SVG sparkline for inline trend charts
      squad-insights-card.tsx  Dashboard squad insights card with linked player names
      analytics-chart.tsx      Interactive chart with time window controls (7d/14d/30d/All)
      body-map.tsx             Interactive body map (selection state, picker, list)
      body-map-summary.tsx     Read-only body map summary for detail pages
      male-front-svg.tsx       Anatomical male front SVG with clickable regions
      male-back-svg.tsx        Anatomical male back SVG with clickable regions
    lib/
      types.ts                 Shared TypeScript types
      auth.config.ts           Auth.js Edge-safe config (JWT callbacks, authorized check — used by middleware)
      auth.ts                  Auth.js Node-only config (extends auth.config.ts with Credentials authorize + Prisma + bcrypt)
      auth-types.ts            AppUser type augmentation for sessions
      auth-utils.ts            Server-side auth helpers (getCurrentUser, requireUser, hasRole, canAccessPlayer)
      body-regions.ts          Canonical muscle region registry + view mapping
      validation.ts            Input validation for write operations (pure, no side effects)
      db.ts                    Prisma client singleton (PostgreSQL via @prisma/adapter-pg)
      data/
        service.ts             Async data access service — reads + writes via Prisma
      mock-data.ts             Seed data arrays (used by prisma/seed.ts only)
      risk.ts                  Pure computation: ACWR, wellness trend, soreness flags, risk level
      insights.ts              Deterministic player-level insight generator
      squad-insights.ts        Deterministic squad-level insight generator
    test/
      setup.ts                 Vitest setup (jest-dom matchers)
      vitest.d.ts              Type declarations for Vitest globals + jest-dom
      body-regions.test.ts     Data model tests (16 cases)
      body-map.test.tsx        Component interaction tests (12 cases)
      training-sessions.test.ts  Training session data tests (8 cases)
      risk.test.ts             Risk computation unit tests (30 cases)
      risk-badge.test.tsx      Risk badge component tests (9 cases)
      validation.test.ts       Input validation tests (18 cases)
      service-writes.test.ts   Write contract unit tests (9 cases)
      wellness-form.test.tsx   Wellness form submit flow tests (8 cases)
      session-form.test.tsx    Session form submit flow tests (6 cases)
      session-actions.test.tsx Session actions component tests (4 cases)
      bulk-validation.test.ts  Bulk session validation tests (10 cases)
      bulk-session-form.test.tsx Bulk session form component tests (8 cases)
      integration/
        setup.ts               Integration test setup
        wellness-writes.test.ts  Prisma-backed write integration tests (11 cases, requires DB)
        session-bulk.test.ts   Bulk session creation integration tests (2 cases, requires DB)
      auth-api.test.ts         Auth/RBAC logic tests (13 cases)
      insights.test.ts         Player insight generator tests (12 cases)
      squad-insights.test.ts   Squad insight generator tests (14 cases)
  vitest.config.ts             Test runner config
  tsconfig.json                TypeScript config
  next.config.ts               Next.js config
  package.json                 Dependencies and scripts
```

## Page Rendering Model

- **Server components** (default): Dashboard, player detail, wellness overview, workload, players list. These read from PostgreSQL via Prisma at request time (`force-dynamic`).
- **Client components** (`"use client"`): Sidebar, header, body map, wellness form, rating input. These manage interactive state.
- **Dynamic routes**: `/players/[id]` uses Next.js 16 async `params` (`await params`).
- **Redirect**: `/` redirects to `/dashboard` via `next/navigation`.

## Frontend State Flow

```
User interaction
  → Component local state (useState)
    → onChange callback to parent
      → Parent re-renders with new selections array
        → SVG components receive selections as Map<key, severity>
          → CSS currentColor drives severity fill
```

There is no global state management (no Redux, no Zustand, no Context). Each page manages its own data. Server components `await` async functions from `src/lib/data/service.ts`, which queries PostgreSQL via Prisma. Client components (`check-in`, `log session`) post to API routes. The `players-list.tsx` client component receives pre-fetched data from its server component wrapper.

### Body Map Data Flow

```
BodyMap component
  ├── selections: BodyMapSelection[]     (from parent)
  ├── onChange: (next) => void           (to parent)
  ├── activeKey: string | null           (local, which region has editor open)
  ├── mobileView: "front" | "back"      (local, which SVG tab is shown)
  │
  ├── MaleFrontSvg / MaleBackSvg
  │     receives: selections as Map, activeKey, onRegionClick, sevFill, sevStroke, getLabel
  │     renders: MR components with <title> tooltips, aria-label, severity fill via CSS currentColor
  │
  ├── SeverityPicker
  │     shown when activeKey is set
  │     creates or updates a BodyMapSelection on severity button click
  │
  └── SelectionList
        sorted by severity DESC then label ASC
        each item clickable to focus in editor, removable via X button
```

## Testing Setup

| Tool | Purpose |
|---|---|
| Vitest 4 | Test runner with `globals: true` |
| React Testing Library | Component rendering + DOM queries |
| @testing-library/jest-dom | Extended matchers (`.toBeInTheDocument()`) |
| jsdom | Browser environment (unit tests) |
| node | Node environment (integration tests against PostgreSQL) |

### Test Suites

| Command | Suite | DB Required | Config |
|---|---|---|---|
| `npm test` | Unit tests (180) | No | `vitest.config.ts` (jsdom, excludes `integration/`) |
| `npm run test:integration` | Integration tests (13) | Yes | `vitest.integration.config.ts` (node, `.env.test`) |
| `npm run test:all` | Both suites | Yes | Runs sequentially |

SVG components are mocked in tests to avoid rendering massive path data. Mocks provide simple clickable buttons with the same `onRegionClick` / `selections` / `getLabel` interface.

Both mobile and desktop SVG containers render simultaneously in jsdom (no CSS media query resolution). Tests use `getAllBy*` queries to handle duplicate elements.

## Design System

- **Colors**: CSS custom properties in `globals.css` (accent, danger, warning, info, muted, card, sidebar)
- **Typography**: Geist Sans + Geist Mono via `next/font/google`
- **Spacing**: Tailwind CSS 4 utility classes
- **Body map severity**: 4-band solid color scale defined in `body-map.tsx` (`sevFill`, `sevStroke`, `sevLabel`, `sevBadgeBg`) and mirrored in `body-map-summary.tsx`

## Current Constraints

| Constraint | Impact |
|---|---|
| PostgreSQL required | Data is persisted in PostgreSQL via Prisma. Requires `npm run db:migrate` + `npm run db:seed` for first run. |
| Auth: credentials only | Auth.js v5 with email/password. No OAuth providers yet. |
| No real-time updates | No WebSocket or polling. Each page loads its own data. |
| Male body map only | No female anatomical SVG. |
| No ACWR or risk engine | Region keys are designed as join keys for future calculations, but no computation exists yet. |
