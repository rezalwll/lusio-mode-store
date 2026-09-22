# Database (PostgreSQL + Drizzle, catalog foundation)

Catalog-only foundation. The production Next app still serves the static
catalog (`src/server/catalog.ts`); the database is proven by migrations,
seed, and integration tests before any runtime cutover.

## Local startup

```bash
docker compose -f compose.db.yml up -d
```

This starts PostgreSQL 18.6 (`postgres:18.6-alpine`) with dev-only
credentials (`lusio` / `lusio` / `lusio`). The host port is **5433**
because 5432 is commonly occupied on dev machines; CI uses 5432 via its
own service container.

```bash
cp .env.example .env   # gitignored; DATABASE_URL for local work
```

## Commands

- `npm run db:generate` — generate a migration from `src/db/schema` into
  `drizzle/` (codebase-first; review the SQL before committing).
- `npm run db:check` — validate snapshots vs schema, no live DB needed.
- `npm run db:migrate` — apply committed migrations (`drizzle/` is source
  of truth). Needs `DATABASE_URL`.
- `npm run db:seed` — deterministic catalog seed (transactional upserts,
  safe to rerun; preserves IDs/slugs, converts Toman → Rial explicitly).
- `npm run db:setup` — `db:migrate` + `db:seed`.
- `npm run test:db` — integration tests on real PostgreSQL (needs
  `DATABASE_URL`; never part of `npm test`).

Clean-environment sequence:

```bash
npm run db:migrate
npm run db:seed
npm run db:seed   # must report identical counts (idempotent)
npm run test:db
```

## Migration policy

- `drizzle/` SQL is the source of truth; never `drizzle-kit push` for
  production flow.
- Review generated SQL (types, BIGINT money, uniques, FKs with intentional
  `ON DELETE`, `stock >= 0` check, timestamptz, no DROPs) before committing.
- Money columns are `BIGINT` Rial; UI/domain stays Toman until cutover
  (`tomanToRial` / strict `rialToToman` in `src/lib/structured-data.ts`).

## Resetting local dev data (LOCAL ONLY)

```bash
docker compose -f compose.db.yml down -v   # destroys the dev volume
docker compose -f compose.db.yml up -d
npm run db:setup
```

WARNING: `down -v` deletes data. Never run reset commands against any
shared/production database. There is no production database yet; when one
exists, only reviewed migrations may touch it.
