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

## Current Stable Baseline

The application is a **complete frontend prototype** with:
- All major UI screens built and navigable
- Wellness check-in form with structured body soreness input
- Polished responsive design
- Test coverage for product-critical body map behavior
- Mock data for 8 players with realistic wellness entries

All code builds, lints, and tests cleanly.

## Next Likely Milestones

### Backend Persistence
- API routes or external backend for wellness entries
- Database for players, entries, body map selections
- Replace mock data with real API calls
- `BodyMapSelection` and `WellnessEntry` types are already designed for serialization

### Authentication and RBAC
- Login flow (likely OAuth or credential-based)
- Role assignment: Admin, Coach, Player
- Route protection via middleware or layout-level guards
- Sidebar section visibility based on role
- Route groups `(staff)/`, `(player)/` if needed

### Workload Tracking (RPE + Session Data)
- Training session logging
- RPE (Rate of Perceived Exertion) per session
- Session load = RPE x duration
- Weekly/daily load aggregation

### ACWR and Injury Risk
- Acute:Chronic Workload Ratio calculation per player
- Per-muscle-group risk scoring using body map `regionKey` as join key
- Risk thresholds and alert rules
- Dashboard integration for at-risk player identification

### Analytics and Trends
- Wellness trend charts per player over time
- Body map heatmap history (which muscles are repeatedly sore)
- Squad-level trend visualization
- Exportable reports

## Dependencies and Sequencing

```
Backend Persistence
  └── Authentication / RBAC
        └── Workload Tracking
              └── ACWR / Injury Risk
                    └── Analytics / Trends
```

Backend persistence is the critical-path blocker. Everything else depends on real data storage.

Authentication can be implemented in parallel with backend persistence but must be complete before multi-user features.

Body map `regionKey` is already the designed join key for ACWR, so no body map refactoring is needed when load/risk features are built.

## Risks and Open Decisions

| Item | Status |
|---|---|
| Backend technology choice | Not decided. Options: Next.js API routes + Prisma, separate Express/NestJS service, or BaaS like Supabase. |
| Auth provider | Not decided. Options: NextAuth.js, Clerk, Auth0, custom. |
| Female body map | Deferred. The reference source includes female SVGs but they are not integrated. Adding them requires a gender/body-type selector in the check-in flow. |
| Real-time features | Not decided. WebSocket or polling for live dashboard updates depends on backend architecture. |
| Mobile native app | Not planned. The web app is responsive and works on mobile browsers. A native wrapper (Capacitor, React Native) could be considered later. |
| Data migration from spreadsheets | Likely needed if replacing an existing tracking process. Format TBD. |
