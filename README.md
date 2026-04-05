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
| `npm test` | Unit tests (117 tests, no DB required) |
| `npm run test:integration` | Integration tests (7 tests, requires test DB) |
| `npm run test:all` | Run both unit and integration tests |
| `npm run lint` | Lint check |
| `npm run db:migrate` | Apply database migrations (dev DB) |
| `npm run db:seed` | Seed database with demo data |
| `npm run db:reset` | Drop + recreate + re-seed |
| `npm run db:test:setup` | Push schema + seed to the test database |

## Environment Variables

| Variable | File | Description |
|---|---|---|
| `DATABASE_URL` | `.env` | Dev/production PostgreSQL connection string |
| `DATABASE_URL` | `.env.test` | Test database connection string |

## Integration Tests

Integration tests run against a dedicated test PostgreSQL database, separate from dev.

### Quick setup with Docker

```bash
# Start a test PostgreSQL container
docker run -d --name fwh-test-pg \
  -e POSTGRES_USER=testuser \
  -e POSTGRES_PASSWORD=testpass \
  -e POSTGRES_DB=fwh_test \
  -p 5555:5432 postgres:16-alpine

# Push schema + seed data
npm run db:test:setup

# Run integration tests
npm run test:integration

# Run all tests (unit + integration)
npm run test:all
```

The `.env.test` file configures the test database connection:
```
DATABASE_URL="postgresql://testuser:testpass@localhost:5555/fwh_test?schema=public"
```

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
