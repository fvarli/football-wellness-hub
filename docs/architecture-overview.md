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
      check-in/page.tsx        Player daily check-in
    components/
      app-shell.tsx            Layout wrapper (sidebar + header + content)
      sidebar.tsx              Navigation with role-aware sections
      header.tsx               Top bar with title, notification, avatar
      stat-card.tsx            Dashboard stat card
      wellness-badge.tsx       Colored score badge
      rating-input.tsx         1-10 button group for wellness metrics
      wellness-form.tsx        Full check-in form (metrics + body map + notes)
      body-map.tsx             Interactive body map (selection state, picker, list)
      body-map-summary.tsx     Read-only body map summary for detail pages
      male-front-svg.tsx       Anatomical male front SVG with clickable regions
      male-back-svg.tsx        Anatomical male back SVG with clickable regions
    lib/
      types.ts                 Shared TypeScript types
      body-regions.ts          Canonical muscle region registry + view mapping
      mock-data.ts             Demo players, wellness entries, body map entries
    test/
      setup.ts                 Vitest setup (jest-dom matchers)
      vitest.d.ts              Type declarations for Vitest globals + jest-dom
      body-regions.test.ts     Data model tests (16 cases)
      body-map.test.tsx        Component interaction tests (12 cases)
  vitest.config.ts             Test runner config
  tsconfig.json                TypeScript config
  next.config.ts               Next.js config
  package.json                 Dependencies and scripts
```

## Page Rendering Model

- **Server components** (default): Dashboard, player detail, wellness overview. These read mock data at build/request time.
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

There is no global state management (no Redux, no Zustand, no Context). Each page manages its own data. The check-in form owns wellness ratings, body map selections, and notes as local state, then submits them together.

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
| jsdom | Browser environment |

Run: `npm test` (single run) or `npm run test:watch` (watch mode).

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
| No backend | All data is client-side mock. Form submissions update local state only. |
| No database | No persistence across page reloads. |
| No authentication | Routes are structurally role-aware (Staff / Player / System sections) but no access control. |
| No real-time updates | No WebSocket or polling. Each page loads its own data. |
| Male body map only | No female anatomical SVG. |
| No ACWR or risk engine | Region keys are designed as join keys for future calculations, but no computation exists yet. |
