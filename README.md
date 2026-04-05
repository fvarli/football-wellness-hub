# Football Wellness Hub

Professional football player wellness, workload, and injury-risk monitoring web application.

## Quick Start

### Prerequisites

- Node.js 22+
- PostgreSQL 14+ (local)

### Setup

```bash
npm install

# Edit .env with your PostgreSQL credentials and auth secret
npx prisma generate
npx prisma db push
npm run db:seed

npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to `/login`.

### Demo Accounts

| Email | Password | Role | Notes |
|---|---|---|---|
| admin@fwh.dev | password123 | admin | Full access |
| coach@fwh.dev | password123 | coach | Staff views + session logging |
| emre@fwh.dev | password123 | player | Own check-in + own player detail |

## Architecture

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Database | PostgreSQL via Prisma 7 |
| Auth | Auth.js v5 (credentials provider, JWT sessions) |
| UI | React 19, Tailwind CSS 4, Lucide Icons |
| Testing | Vitest 4, React Testing Library |

### Data Flow

```
Pages (server components, async)
  -> src/lib/auth.ts (session)
  -> src/lib/data/service.ts (Prisma queries)
    -> PostgreSQL
    -> src/lib/risk.ts (computed on-the-fly)

Client forms (check-in, log session)
  -> fetch POST/PUT to /api/* routes
    -> auth check (getCurrentUser)
    -> authorization check (canAccessPlayer / hasRole)
    -> src/lib/validation.ts (trust boundary)
      -> src/lib/data/service.ts (persist)
```

## Pages

| Route | Access | Description |
|---|---|---|
| `/login` | Public | Credentials login |
| `/dashboard` | All authenticated | Squad risk overview |
| `/players` | Coach, Admin | Player roster with risk badges |
| `/players/[id]` | Coach, Admin, Own player | Player detail: risk profile, check-in, body soreness, recent sessions, wellness history |
| `/players/[id]/edit-checkin` | Coach, Admin, Own player | Edit latest wellness check-in |
| `/wellness` | Coach, Admin | Squad wellness overview |
| `/workload` | Coach, Admin | Training session list |
| `/workload/log` | Coach, Admin | Log a training session — player picker + type, duration, RPE |
| `/check-in` | Player: own check-in; Coach/Admin: player picker | Daily wellness check-in |

## API Routes

| Route | Method | Auth | Description |
|---|---|---|---|
| `/api/auth/*` | GET/POST | Public | Auth.js handlers |
| `/api/wellness/check-in` | POST | Authenticated | Create wellness entry |
| `/api/wellness/check-in` | PUT | Authenticated | Update wellness entry |
| `/api/sessions` | POST | Coach/Admin | Log training session |

## Authorization Rules

- **Player**: can create/update only their own wellness check-ins. Can view their own player detail and dashboard. Cannot access squad-wide pages (players list, wellness overview, workload).
- **Coach/Admin**: can view all squad data, log training sessions, submit check-ins on behalf of any player via the player picker on `/check-in`.
- **API routes**: derive identity from session, not from client-supplied playerId. Players' playerId is forced from session.

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm test` | Unit tests (130 tests, no DB required) |
| `npm run test:integration` | Integration tests (7 tests, requires DB) |
| `npm run test:all` | Both test suites |
| `npm run lint` | Lint check |
| `npm run db:seed` | Seed database with demo data + users |
| `npm run db:test:setup` | Push schema + seed to test database |

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AUTH_SECRET` | Yes | Auth.js session signing secret |
| `AUTH_TRUST_HOST` | Yes | Set to `true` for local dev |

## Documentation

Detailed docs in `/docs`:

- [Project Overview](docs/project-overview.md)
- [Architecture Overview](docs/architecture-overview.md)
- [Data Access Layer](docs/data-access-layer.md)
- [Domain Model](docs/domain-model.md)
- [Database Schema](docs/database-schema.md)
- [Persistence Plan](docs/persistence-plan.md)
- [Body Map Architecture](docs/body-map-architecture.md)
- [Product Requirements](docs/product-requirements.md)
- [Roadmap](docs/roadmap.md)
