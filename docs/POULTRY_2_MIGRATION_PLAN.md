# Poultry 2.0 migration plan

## Safety baseline

- Production backup: `/var/lib/postgresql/data/fevora-backups/fevora-pre-poultry2-20260831.dump`.
- Backup verified by `pg_restore --list` (333 entries).
- SHA-256: `60138a0e1cb99e465a2cb20f16d55d4f6ee1955593943bf40babbb49841b6e5b`.
- Production had 12 applied migrations and was up to date before implementation.

## Existing data

The pre-migration production counts were: 2 batches, 1 flock movement, 2 feed products, 2 feed lots, 3 feed usages, 3 sales, 1 operational expense, and 8 Poultry financial transactions.

## Evolution strategy

1. Keep every existing Poultry table and relation.
2. Add nullable/defaulted Poultry 2.0 fields.
3. Backfill movement deltas, feed quantities/costs, sale types, soft-delete state, group breeds, and origin balances.
4. Preserve legacy `currentQuantity`, bag fields, and old routes for compatibility.
5. Make domain operations the source of truth for linked financial transactions.
6. Recalculate group quantity from active event deltas after every editable operation.
7. Keep cash transactions separate from management cost entries.

## Backfill rules

- Existing group origin date remains its old `startDate`.
- Existing group source maps to the corresponding origin type.
- Existing current quantity is preserved exactly in the initial origin balance.
- Existing breed becomes one composition row; missing breed becomes `Неизвестно`.
- Existing feed lots convert bags to kg only when `bagSizeKg` is known; otherwise legacy bag values remain authoritative until the user calibrates the product.
- Existing feed usage cost is frozen as `bags × costPerBag`.
- Existing sales with an active flock movement become `LIVE_BIRD`; unlinked legacy sales become `OTHER`.
- Existing soft-deleted financial expenses are excluded from domain cost through the backfilled `deletedAt`.

## Rollout

1. Validate migration on an empty/shadow PostgreSQL database.
2. Run lint, typecheck, all tests, and production build.
3. Deploy through `prisma migrate deploy`; never use db push/reset/drop.
4. Confirm migration status, seed, health, protected routes, and aggregate production invariants.
