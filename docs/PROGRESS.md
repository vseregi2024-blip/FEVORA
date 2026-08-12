# FEVORA — Progress

## Current stage

Codex Task №1.1 — infrastructure completed; FEVORA is running in production.

## Implemented

- Next.js + TypeScript application with a mobile-first interface.
- PostgreSQL/Prisma schema for `User`, `Category`, and `Transaction`.
- Development seed for system categories.
- Owner-only first setup and signed, HTTP-only cookie sessions.
- Finance transaction create, journal, filtering, editing and soft deletion.
- Exact money calculations based on integer minor units and PostgreSQL `Decimal`.
- Dashboard with live balance, monthly totals and recent operations.
- Railway-ready Docker build and database health endpoint.
- GitHub repository, Railway web service, and Railway PostgreSQL are connected.
- Production migrations and the idempotent system-category seed run on startup.
- Production CRUD and persistence were manually verified: income, expense, edit, soft delete, restart, and balance recalculation.

## Verified

- Prisma Client generation succeeds.
- The initial SQL migration was generated in `prisma/migrations/20260811162000_init` without connecting to a database.
- `npm run lint`, `npm run typecheck`, `npm test` (7 tests), and `npm run build` pass locally.
- Railway production health check and the public `/api/health` endpoint return `200`.

## Not implemented in Task №1

- Family and poultry modules beyond navigation placeholders and categories.
- Recurring payments, savings goals, Telegram, uploads, analytics and future domains.

## Next step

Start Codex Task №2 only after the owner explicitly approves the next module.
