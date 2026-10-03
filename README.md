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

## Current financial model

FEVORA has one financial journal: a `Transaction` is the only real income or expense.

- **Wallet** is a physical place where money is held. Active shared wallets can be used by every project.
- **Envelope** is a reservation for a purpose. It does not create another balance, income, or expense.
- **Free money** is calculated as `all active Wallet balances − active Envelope reserves`.
- A transfer between wallets and a reservation in an envelope do not change total capital.
- A payment deadline is a reminder; it is not an automatic debit.

Legacy goal records are replaced by envelopes with an optional target amount and deadline. The former technical account “Доступно семье” and project-local cash balances are not used as physical wallets.

## Cosmetology: stable cabinet checkpoint

The current `/cosmetology` cabinet is a project workspace, not a local finance dashboard:

- Navigation: **Кабинет / Клиенты / Календарь / Препараты**.
- The cabinet contains the mini-calendar, compact financial summary, common procurement reserve, clients, inventory, attention items, and quick links.
- Procedure completion chooses an active shared Wallet, creates one income Transaction, and may reserve part of the payment in the shared **«На закупку»** Envelope. The reservation is not an expense.
- Purchases choose a shared Wallet and the same Envelope, create one expense Transaction, increase inventory, and retain purchase-price history.
- Inventory never auto-writes off when a procedure is completed. Stock changes only by purchase or manual correction.

The following legacy paths must not be used for new records: `CosmetologyWallet`, `CosmetologyWalletMovement`, local CASH/MONO/PRIVAT balances, automatic material write-off during a procedure, and `/finance?module=COSMETOLOGY` links. Use shared Wallets, Envelopes, Transactions, `/safe`, and `/analytics?module=COSMETOLOGY` instead.
