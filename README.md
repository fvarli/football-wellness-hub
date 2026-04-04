# Football Wellness Hub

Professional football player wellness, workload, and injury-risk monitoring web application.

## Quick Start

### Prerequisites

- Node.js 22+
- PostgreSQL 14+

### Setup

```bash
npm install

# Edit .env and set DATABASE_URL to your PostgreSQL instance
npx prisma generate
npm run db:migrate
npm run db:seed

npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Architecture

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Database | PostgreSQL via Prisma 7 |
| UI | React 19, Tailwind CSS 4, Lucide Icons |
| Testing | Vitest 4, React Testing Library |

### Data Flow

```
Pages (server components, async)
  -> src/lib/data/service.ts (async Prisma queries)
    -> PostgreSQL
    -> src/lib/risk.ts (computed on-the-fly)

Client forms (check-in, log session)
  -> fetch POST/PUT to /api/* routes
    -> src/lib/validation.ts (trust boundary)
      -> src/lib/data/service.ts (persist)
```

## Pages

| Route | Description |
|---|---|
| `/dashboard` | Squad risk overview with ACWR, wellness, soreness flags |
| `/players` | Player roster with search, risk badges, wellness scores |
| `/players/[id]` | Player detail: risk profile, check-in, body soreness, history |
| `/players/[id]/edit-checkin` | Edit latest wellness check-in (pre-filled form, PUT) |
| `/wellness` | Squad-wide wellness overview table |
| `/workload` | Training session list with load metrics |
| `/workload/log` | Log a training session (type, duration, RPE) |
| `/check-in` | Daily wellness check-in with anatomical body soreness map |

## API Routes

| Route | Method | Description |
|---|---|---|
| `/api/wellness/check-in` | POST | Create wellness entry (rejects same-day duplicate) |
| `/api/wellness/check-in` | PUT | Update existing wellness entry by entryId |
| `/api/sessions` | POST | Log a training session |

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm test` | Unit tests (no DB required) |
| `npm run test:integration` | Integration tests (requires DB) |
| `npm run lint` | Lint check |
| `npm run db:migrate` | Apply database migrations |
| `npm run db:seed` | Seed database with demo data |
| `npm run db:reset` | Drop + recreate + re-seed |

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |

Example: `postgresql://postgres:postgres@localhost:5432/football_wellness_hub?schema=public`

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
