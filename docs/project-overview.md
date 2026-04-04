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
| Player detail | `/players/[id]` | Profile header, risk profile card (ACWR, trend, flags), latest check-in with Edit link, body soreness, wellness history |
| Edit check-in | `/players/[id]/edit-checkin` | Pre-filled wellness form for updating the latest check-in (PUT) |
| Wellness overview | `/wellness` | Squad-wide color-coded wellness table |
| Workload | `/workload` | Training session list with summary cards (total sessions, avg load, highest load) + link to log form |
| Log Session | `/workload/log` | Training session creation form: type, duration, RPE, notes. Submits to `POST /api/sessions`. |
| Daily check-in | `/check-in` | 6-metric wellness form + anatomical body soreness map |
| Settings | `/settings` | Placeholder |

Navigation groups: **Staff** (dashboard, players, wellness, workload, injury risk, reports), **Player** (check-in), **System** (settings).

## Current Maturity

**Full-stack prototype with PostgreSQL persistence.** The UI is functional and polished. Data is stored in PostgreSQL via Prisma 7. API routes handle wellness check-in creation (POST) and update (PUT), plus training session creation (POST), all with full server-side validation. There is no authentication yet — a demo playerId is used for writes.

### Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.2 (App Router, Turbopack) |
| Language | TypeScript 5 |
| UI | React 19, Tailwind CSS 4 |
| Icons | Lucide React |
| Database | PostgreSQL via Prisma 7, @prisma/adapter-pg |
| Testing | Vitest 4, React Testing Library, jsdom |
| Lint | ESLint 9 with next config |
