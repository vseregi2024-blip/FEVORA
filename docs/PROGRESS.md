# FEVORA — Progress

## Current stage

Codex Task №1 — technical foundation and financial core.

## Implemented

- Next.js + TypeScript application with a mobile-first interface.
- PostgreSQL/Prisma schema for `User`, `Category`, and `Transaction`.
- Development seed for system categories.
- Owner-only first setup and signed, HTTP-only cookie sessions.
- Finance transaction create, journal, filtering, editing and soft deletion.
- Exact money calculations based on integer minor units and PostgreSQL `Decimal`.
- Dashboard with live balance, monthly totals and recent operations.
- Railway-ready Docker build and database health endpoint.

## Verified

- Prisma Client generation succeeds.
- The initial SQL migration was generated in `prisma/migrations/20260811162000_init` without connecting to a database.
- `npm run lint`, `npm run typecheck`, `npm test` (7 tests), and `npm run build` pass locally.

## Not implemented in Task №1

- Family and poultry modules beyond navigation placeholders and categories.
- Recurring payments, savings goals, Telegram, uploads, analytics and future domains.

## Known constraints

- PostgreSQL credentials are needed to apply the initial migration locally or on Railway.

## Next step

Set `DATABASE_URL`, apply the initial migration, seed categories, and perform the first owner sign-in.
