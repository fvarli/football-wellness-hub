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
| Dashboard | `/dashboard` | Mock stat cards (total players, at-risk, avg wellness, weekly load) |
| Player list | `/players` | 8 demo players with search, status badges, latest wellness scores |
| Player detail | `/players/[id]` | Profile header, latest check-in breakdown, body soreness summary, wellness history table |
| Wellness overview | `/wellness` | Squad-wide color-coded wellness table |
| Workload | `/workload` | Training session list with summary cards (total sessions, avg load, highest load) |
| Daily check-in | `/check-in` | 6-metric wellness form + anatomical body soreness map |
| Settings | `/settings` | Placeholder |

Navigation groups: **Staff** (dashboard, players, wellness, workload, injury risk, reports), **Player** (check-in), **System** (settings).

## Current Maturity

**Frontend prototype with mock data.** The UI is functional and polished. All data is client-side. There is no backend, no database, no authentication. The architecture is designed so that backend integration can replace mock data without restructuring components.

### Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.2 (App Router, Turbopack) |
| Language | TypeScript 5 |
| UI | React 19, Tailwind CSS 4 |
| Icons | Lucide React |
| Testing | Vitest 4, React Testing Library, jsdom |
| Lint | ESLint 9 with next config |
