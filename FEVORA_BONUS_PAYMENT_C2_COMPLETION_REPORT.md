# FEVORA IMPERIA — C2 PRODUCTION MIGRATION + DEPLOY REPORT

Дата: 17.09.2026 (Europe/Kyiv)
Статус: **C2 production migration and deploy complete**
Production: `https://fevora-production.up.railway.app`

## Scope and safety boundary

Выполнена только авторизованная additive C2 migration и deploy FEVORA. Ни один реальный BONUS payment, `PaymentComponent`, Income, wallet movement, certificate use, bonus accrual, refund, reversal или успешный B3 redemption не создавался.

Railway SSH не использовался. PostgreSQL Public Access не открывался повторно. Runtime variables, DSN, passwords, tokens and API secrets не читались и не выводились.

## Backup

Перед C2 подтверждён свежий локальный custom-format backup вне репозитория:

- file: `/Users/mac/Documents/FEVORA-backups/fevora-c2-pre-migration-20260917T084817Z.dump`;
- size: `247124` bytes;
- SHA-256: `70ac309e2d212bbd5d67d2fa9fdd83dc4a7f238ba8a48a7b9e6fe59ac2960e23`;
- `pg_restore --list`: PASS before final backup metadata was printed;
- temporary PostgreSQL TCP Public Access used only to create that dump had already been removed. It remains closed.

## Migration

Applied migration:

`20260917093000_add_cosmetology_bonus_redemptions`

Reviewed SQL contains only:

- `ADD VALUE IF NOT EXISTS 'BONUS'` to `CosmetologyPaymentMethod`;
- a new `CosmetologyBonusRedemptionStatus` enum;
- new `CosmetologyBonusRedemption` table;
- new indexes/unique constraints, including `externalEventId` and the one-open-redemption-per-visit partial unique index;
- foreign keys to existing records.

It contains no `DROP`, `TRUNCATE`, `DELETE`, `UPDATE`, `db push`, `db reset`, backfill, seed, or automatic financial/loyalty operation.

Production deployment log confirms:

```text
24 migrations found in prisma/migrations
Applying migration `20260917093000_add_cosmetology_bonus_redemptions`
All migrations have been successfully applied.
```

The new table is created empty by this SQL: no default row, trigger, seed or C2 request was executed. Therefore the initial real-redemption count is `0`.

## Deploy and availability

- Railway service: `FEVORA` (Postgres service was explicitly not deployed);
- deployment ID: `532bdaec-ce8e-4382-a9c8-f755075efb44`;
- Railway final status: `SUCCESS`;
- public health: `GET /api/health` → HTTP `200`, `{"status":"ok"}`.

## Production-data preservation

The migration makes no data-row mutation to existing tables. The deploy startup ran reviewed Prisma migration handling only; it did not run a seed. No authenticated UI submission or write API was used during this release.

Consequently no old `CosmetologyPayment`, `CosmetologyPaymentComponent`, certificate, procedure, finance transaction or `CosmetologyLoyaltyDelivery` was changed by C2 deployment. In particular, the existing CASH payment of 1,000 UAH and historical delivery are unaffected by the additive schema change. No automatic F3 delivery was sent: C2 has no startup delivery worker, and no completed procedure/payment was created.

This conclusion is based on reviewed SQL/runtime migration evidence rather than an unsafe database connection: Railway SSH and public database access were intentionally not used.

## PAYMENT 2.0 / C1 / cash regression

Local production-equivalent gates passed immediately before deploy:

- Prisma validate: PASS;
- Prisma generate: PASS;
- TypeScript: PASS;
- ESLint: PASS, `0` errors (three pre-existing unrelated `<img>` warnings);
- Vitest: `26` files, `299` tests: PASS;
- Next.js production build: PASS.

Targeted C2, Payment 2.0, C1 and F3 regression tests cover CASH, MONOBANK, PRIVATBANK, OTHER, CERTIFICATE, BONUS, mixed and partial payment, remaining balance, overpayment protection, payment history, certificate atomicity and loyalty delivery idempotency.

The production code keeps the accounting split:

| Category | Methods |
|---|---|
| Monetary cash/income/F3 earning base | CASH, MONOBANK, PRIVATBANK, OTHER |
| Non-monetary procedure settlement | CERTIFICATE, BONUS |

`BONUS` and `CERTIFICATE` have `wallet: null`; only components with a wallet produce a financial `Transaction`. The cash page explicitly excludes both methods from its monetary type and reports them separately. F3 earning uses the same four-method monetary allow-list; if its amount is zero, no earning delivery is created.

No production payment was created to empirically exercise the payment form, partial payment, mixed payment or daily cash. That is deliberate compliance with the C2 prohibition on real payments.

## Bonus UI and B1/B3 safety

- C2 UI includes BONUS as a PaymentComponent and limits requested amount to the B1 balance/remaining procedure amount; a client without `loyaltyClientId` is ineligible.
- BONUS redemption remains opt-in server-side: `BOT_CLIENT_BONUS_REDEMPTIONS_ENABLED` must equal exactly `true`.
- The release did not set or change that flag, submit an authenticated B1 lookup, or submit a payment form.
- Safe B3 production smoke: unauthenticated `POST https://www.bbclub.in.ua/api/v1/bonus-redemptions` with `{}` returned HTTP `401`. No authorization and no event ID were supplied, so a redemption could not be created.

## Mobile verification

The responsive C2 components were covered by the local build and C2 regression suite. The authenticated production payment UI was not opened at 375/390/430 px in this deploy window, because doing so would require an authenticated customer/visit flow and no test payment may be created. The previously deployed C1.2 certificate screens remain covered by their production verification at those three widths.

This limitation is explicit: it is not represented as a real production payment test. A future C2.1 may perform a separately authorised controlled payment/UI verification.

## Security

- `BOT_CLIENT_API_SECRET` is read only by server-side code; no matching server env variable names were found in `.next/static` client bundles.
- Tracked Git contains `.env.example` only; it has empty placeholders, not real environment files.
- Deployment and smoke logs in this report contain no secret, token, password or DSN.
- PostgreSQL Public Access remains closed; Railway SSH was not used.

## Final status / STOP

**C2 migration and production deploy are complete and healthy.** The schema is up to date, C2 BONUS infrastructure is live, and no real financial or bonus operation was performed.

**STOP.** Do not enable a real bonus redemption, make a real BONUS payment, send a loyalty earning payment, perform refund/reversal, or proceed to C2.1 without a new explicit instruction.
