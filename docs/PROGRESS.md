# FEVORA — Progress

## Current stage

Codex Task №5 — модуль «Инфобизнес» задеплоен в production. Остался только authenticated owner smoke test из ТЗ; он не выполнялся без доступа к учётной записи и без создания тестовых данных вслепую.

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
- Family Finance: personal Family income and expense CRUD, category-required manual forms, soft delete, reports, split receipts, savings goals/movements, and recurring payments.
- New project-first navigation: Home, Projects, Add, Reports, Settings. Family is the only active project in Task №2.
- Poultry: batches and protected flock movements, sales with one linked income, feed inventory by bags, feed assignment without duplicate expense, incubation batches with multiple breeds, and operational expenses.
- Poultry and Family can be selected in Projects, Add, Dashboard, and Reports.
- Unified warm mobile-first design system: shared cards, status badges, section headers, empty states, line icons, responsive forms, and highlighted bottom navigation.
- Redesigned Dashboard, Projects, Add, Family, Poultry, Reports, Journal, and Settings around real production data.
- Poultry is split into short dedicated routes for flock, feed inventory, incubation, sales, and operational expenses; the long combined Poultry form is removed from the dashboard.
- Split receipts support adding and removing lines in the UI while retaining the existing no-double-count server logic.
- Poultry batch details show real flock movements, assigned feed, sales, linked costs and financial result without creating duplicate transactions.
- Incubation batch details show real breed rows and their hatch results, with safe actions to update results or create a flock batch.
- Feed inventory is inventory-first: available bags and each feed lot are shown before compact actions for purchase and assignment.
- Deletion uses one reusable confirmation dialog for financial operations and Poultry sales.
- Shared loading and user-friendly error states are available for protected application routes.
- Remaining interactive form labels and operation details use Russian, the current primary interface language.
- Task №4 Tovarka: products/categories, purchase lots, FIFO sale allocations, stock movements, operational expenses, protected purchase edits/deletions, sale edits/soft deletion, and product-profit reporting.
- Delivery can be included in a purchase lot cost or recorded as a separately linked operational expense.
- Product creation supports an opening stock balance with unit cost (a FIFO lot without a duplicate expense) and a default sale price for future sales.
- Task №5 InfoBusiness: products/courses with online, offline and hybrid formats, free-form product types, base price, status, dates and comments.
- InfoBusiness sales create one linked Income transaction atomically; editing updates the same Income and soft delete excludes both records from analytics.
- InfoBusiness expenses create one linked Expense transaction atomically and support either a concrete product or an explicitly selected general expense.
- General InfoBusiness expenses are included only in the project-wide result and never reduce a product’s profit automatically.
- User-owned expense categories are initialized with the required starters and can be created, renamed and safely archived without breaking history.
- Service/subscription expenses support an optional service name and analytics group expenses by categories and services.
- InfoBusiness is active in Projects, Add, Dashboard, Journal and general Reports; Cosmetology remains marked as future work.

## Verified

- Prisma Client generation succeeds.
- The initial SQL migration was generated in `prisma/migrations/20260811162000_init` without connecting to a database.
- `npm run lint`, `npm run typecheck`, `npm test` (7 tests), and `npm run build` pass locally.
- Railway production health check and the public `/api/health` endpoint return `200`.
- Task №2 local validation: `lint`, `typecheck`, `build`, and 17 automated tests pass.
- Railway applied migration `20260812090000_add_family_finance`; the idempotent seed completed successfully.
- Task №2 production workflow was manually verified: Family income, Family expense, and split receipt creation.
- Family data was confirmed to remain available after a Railway service restart.
- Task №3 local validation: `lint`, `typecheck`, `build`, and 26 automated tests pass.
- Task №3.1 local validation: `lint`, `typecheck`, `build`, and 26 automated tests pass.
- Task №3.1 completion validation: `lint`, `typecheck`, `build`, and 26 automated tests pass after adding Poultry detail routes, confirmation dialog, loading and error states.
- Railway deployment `85b2558d-4aa7-4a08-80e5-584e3507f9ec` completed successfully on 13 August 2026; public `/api/health` returned `200` with `{"status":"ok"}`.
- Task №4 migration `20260813022000_add_goods` was applied as an additive production migration; current startup logs report four migrations with none pending, and the idempotent seed completes successfully.
- Task №4 final production deployment `e28ed36a-095a-485b-81e6-61fbce0e9714` completed successfully on 13 August 2026; public `/api/health` returned `200` with `{"status":"ok"}` after restart.
- Task №4 local validation: `lint`, `typecheck`, production `build`, and 38 automated tests pass.
- Task №5 baseline validation before changes: `lint`, `typecheck`, production `build`, and 38 automated tests pass after Prisma Client generation.
- Task №5 final local validation: `lint`, `typecheck`, production `build`, and 58 automated tests pass.
- Task №5 additive migration `20260813130000_add_infobusiness` applied during successful Railway deployment `2947cca9-c909-44e4-86ac-bcb33c91b8d8` on 13 August 2026; public `/api/health` returned `200` with `{"status":"ok"}`.
- Task №5 implementation commit: `1423cf8 feat: add infobusiness module`.

## Not implemented

- Voice recognition and photo receipt upload remain future UI surfaces without external APIs.
- Cosmetology remains an inactive future project.

## Next step

Sign in as the owner and run the Task №5 production smoke flow from the specification, including product, sales, product/general expenses, custom category, edit and soft delete. Confirm that Family, Poultry and Tovarka records remain visible before and after a restart. No production test records were created automatically.
