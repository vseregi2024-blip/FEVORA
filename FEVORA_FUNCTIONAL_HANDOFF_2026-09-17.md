# FEVORA IMPERIA — Functional handoff

Date: 2026-09-17 (Europe/Kyiv)

## Status

**Functional phase safely closed.** The functional core is stable. The next phase is **UI/UX redesign**; do not rebuild business logic.

## Built and protected

- Universal finance: projects, accounts, wallets, envelopes, transfers and ledger.
- Cosmetology: clients, calendar, visits, services, materials, inventory, cost/profit, payments and analytics.
- Payment 2.0: monetary methods, Payment/PaymentComponent, partial/mixed payments, remaining balance, overpayment protection and cash-for-day.
- Certificates: lifecycle, balances, partial/mixed use and separate non-cash accounting; C1/C1.1/C1.2 are in production.
- Beauty Bonus Club: the Bot Client is the loyalty source of truth; B1 read APIs, B2 earning and B3 redemption APIs use Bearer auth, idempotency, concurrency protection and transaction safety.
- FEVORA loyalty: linked clients, profile/history, F3 earning delivery, C2 `BONUS` components and redemption saga/recovery. `BONUS` and `CERTIFICATE` never increase cash.
- D1: no-op service-worker fetch handler removed; production clients/cash smoke and 375/390/430 px checks are green.

## Production and database

- FEVORA is Online; `/api/health` HTTP 200.
- C2 deploy: `532bdaec-ce8e-4382-a9c8-f755075efb44` — SUCCESS.
- D1 deploy: `b35e7f15-c7f0-4601-9e0d-b5e050a340ca` — SUCCESS.
- Postgres is stable. Public Access is closed. No D1 migration or database write occurred.
- Fresh local backup, outside Git: `/Users/mac/Documents/FEVORA-backups/fevora-c2-pre-migration-20260917T084817Z.dump`; verified with `pg_restore --list`.

## Pending and forbidden now

- C2.1 is ready but not executed: there is no real `COMPLETED + unpaid + loyalty-linked` visit. Do not alter the scheduled Швец Надя visit solely for a test.
- Do not perform real redemption, refund, reversal, F3 delivery, migration, production deploy or password rotation without a new explicit task.
- Do not remove or redesign financial/payment/loyalty logic as part of UI work.

## Repository note

- One untracked source file remains intentionally untouched: `src/app/(private)/family/accounts/page 2.tsx`. It differs from the active `page.tsx`, and its purpose was not certain during handoff; it was not committed, renamed or deleted.

## Next chat

1. Read `00_READ_FIRST_CODEX_CONTINUITY.md` and `AGENTS.md`.
2. Receive the separate UI/UX design brief.
3. Preserve the functional contracts above; make only explicitly authorised design changes.
