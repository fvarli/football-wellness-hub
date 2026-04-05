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
| Dashboard | `/dashboard` | Stat cards, squad-level insights with linked player names, risk overview table |
| Player list | `/players` | 8 demo players with search, status badges, wellness scores, risk level badges |
| Player detail | `/players/[id]` | Profile header, risk profile, trends + interpreted insights, latest check-in (editable), body soreness, recent sessions, wellness history |
| Edit check-in | `/players/[id]/edit-checkin` | Pre-filled wellness form for updating the latest check-in (PUT) |
| Player analytics | `/players/[id]/analytics` | Wellness + load trend charts with 7d/14d/30d/All range controls, insight summary |
| Wellness overview | `/wellness` | Squad-wide color-coded wellness table |
| Workload | `/workload` | Training session list with summary cards, edit/delete actions per session. Coach/admin only. |
| Log Session | `/workload/log` | Player picker + session form (type, duration, RPE). Coach/admin only. |
| Edit Session | `/workload/edit/[sessionId]` | Pre-filled session form for updating an existing training session (PUT). Coach/admin only. |
| Daily check-in | `/check-in` | 6-metric wellness form + anatomical body soreness map |
| Settings | `/settings` | Placeholder |

Navigation groups: **Staff** (dashboard, players, wellness, workload, injury risk, reports), **Player** (check-in), **System** (settings).

## Current Maturity

**Full-stack application with PostgreSQL persistence and authentication.** Data is stored in PostgreSQL via Prisma 7. Authentication uses Auth.js v5 with credentials provider and JWT sessions. Role-based access control enforces admin/coach/player permissions. API routes derive identity from the authenticated session — no client-supplied playerId is trusted for writes.

### Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.2 (App Router, Turbopack) |
| Language | TypeScript 5 |
| UI | React 19, Tailwind CSS 4 |
| Icons | Lucide React |
| Database | PostgreSQL via Prisma 7, @prisma/adapter-pg |
| Auth | Auth.js v5, credentials provider, JWT sessions |
| Testing | Vitest 4, React Testing Library, jsdom |
| Lint | ESLint 9 with next config |
