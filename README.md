# FEVORA

FEVORA is a clear personal finance foundation: sign in, save an operation, calculate the balance accurately, and review the journal from a phone or desktop browser.

## Stack

- Next.js, React, TypeScript
- PostgreSQL and Prisma ORM
- Server Actions, Zod, bcrypt and signed HTTP-only sessions
- Vitest and ESLint

## Requirements

- Node.js 22+
- PostgreSQL 15+ (or a Railway PostgreSQL service)

## Local setup

```bash
cp .env.example .env
npm install
npm run prisma:migrate:dev -- --name init
npm run prisma:seed
npm run dev
```

Set these values in `.env` before starting:

```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/fevora?schema=public"
AUTH_SECRET="a-random-secret-with-at-least-32-characters"
OWNER_EMAIL="owner@example.com"
OWNER_PASSWORD="choose-a-strong-password"
```

Open `http://localhost:3000`. On the first login, enter the configured owner email and password; this securely initializes the owner account. The initial name is optional. After that, those credentials are used to sign in.

## Database workflow

Create local migrations with `npm run prisma:migrate:dev -- --name descriptive_name`. Apply committed migrations in production only with `npm run prisma:migrate:deploy`. Seed system categories with `npm run prisma:seed`.

Never run destructive reset commands against a production database.

## Checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Railway

1. Create a Railway project and add a PostgreSQL service.
2. Deploy this repository as a service (the included `Dockerfile` creates a production build).
3. Add `DATABASE_URL`, `AUTH_SECRET`, `OWNER_EMAIL`, and `OWNER_PASSWORD` as Railway variables.
4. Run `npm run prisma:migrate:deploy` once against the Railway database, then `npm run prisma:seed`.
5. Configure the health check path as `/api/health`.

After the first owner account is created, remove `OWNER_PASSWORD` from Railway only after adding a dedicated password-management flow. For Task №1 it remains the secure bootstrap credential and is never exposed to the browser or Git.

## Project structure

```text
src/app/                 Routes and responsive UI
src/components/          Reusable client UI forms
src/lib/                 Prisma, money and date utilities
src/server/              Authentication and finance services
prisma/                  Schema, migrations and seed
docs/                    Master spec, progress and decisions
tests/                   Automated financial logic tests
```

`docs/MASTER_SPEC.md` is the project source of truth. Task №1 intentionally provides placeholders only for Family and Poultry; Telegram and other later modules are not included.
