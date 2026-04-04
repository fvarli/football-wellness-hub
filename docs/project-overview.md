# Project Overview

## What Is This

Football Wellness Hub is a web application for tracking football player wellness, workload, and injury risk. It gives coaching staff a daily view of squad readiness and gives players a fast way to report how they feel.

## Target Users

| Role | Usage |
|---|---|
| **Coach / Head of Performance** | Reviews player wellness, identifies at-risk players, plans training load |
| **Player** | Submits a daily check-in: wellness ratings + body soreness map |
| **Admin** | Manages squad roster and system settings (future) |
| **Physio / Medical staff** | Reviews soreness and body map data (future) |

Only Coach and Player flows are implemented today. Auth and RBAC are deferred.

## Product Goal

Replace spreadsheet-based wellness tracking with a purpose-built tool that:
- Collects structured daily wellness data from players
- Maps muscle-level soreness with an anatomical body map
- Gives coaches instant squad-wide visibility
- Builds a data foundation for automated load monitoring and injury risk scoring

## Implemented Modules

| Page | Route | Status |
|---|---|---|
| Dashboard | `/dashboard` | Live stat cards (total players, at-risk, avg wellness, soreness flags) + squad risk table |
| Player list | `/players` | 8 demo players with search, status badges, wellness scores, risk level badges |
| Player detail | `/players/[id]` | Profile header, risk profile card (ACWR, trend, flags), latest check-in, body soreness, wellness history |
| Wellness overview | `/wellness` | Squad-wide color-coded wellness table |
| Workload | `/workload` | Training session list with summary cards (total sessions, avg load, highest load) + link to log form |
| Log Session | `/workload/log` | Training session creation form: type, duration, RPE, notes. Submits to `POST /api/sessions`. |
| Daily check-in | `/check-in` | 6-metric wellness form + anatomical body soreness map |
| Settings | `/settings` | Placeholder |

Navigation groups: **Staff** (dashboard, players, wellness, workload, injury risk, reports), **Player** (check-in), **System** (settings).

## Current Maturity

**Frontend prototype with backend-ready write contracts.** The UI is functional and polished. All data is client-side (in-memory arrays). There is no database or authentication yet. API route skeletons exist for wellness check-in and training session submission with full input validation. The architecture is designed so that replacing mock arrays with database queries requires changes only in `src/lib/data/service.ts`.

### Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.2 (App Router, Turbopack) |
| Language | TypeScript 5 |
| UI | React 19, Tailwind CSS 4 |
| Icons | Lucide React |
| Testing | Vitest 4, React Testing Library, jsdom |
| Lint | ESLint 9 with next config |
