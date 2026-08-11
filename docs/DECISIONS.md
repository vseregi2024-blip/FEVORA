# FEVORA — Architecture Decisions

## Single Next.js application

FEVORA is one Next.js application with server-side business services. It avoids microservices while retaining dedicated feature and server layers for future modules.

## Authentication

The first user can only be initialized with `OWNER_EMAIL` and `OWNER_PASSWORD` from the environment. Later logins compare a bcrypt password hash. Sessions are signed with `AUTH_SECRET` and stored in HTTP-only, SameSite=Lax cookies. All private pages and finance mutations obtain the authenticated user on the server.

## Money

PostgreSQL stores money as `Decimal(18,2)`. Business calculations convert decimal strings into integer minor units (`bigint`), avoiding JavaScript floating-point arithmetic. Negative values are allowed only for `ADJUSTMENT` operations.

## Balance

Current balance is recalculated from `User.startingBalance` and active transactions: income and savings returns add; expenses and savings transfers subtract; adjustments apply their signed amount. No balance cache is a source of truth.

## Deletion

Transactions are soft-deleted using `deletedAt`. Owner-scoped queries exclude deleted records, so deleted operations no longer affect totals while auditability is preserved.

## Time zone

`Europe/Kyiv` is the single project default timezone. A calendar date is stored as a PostgreSQL `DATE` and defaults are generated in that timezone.
