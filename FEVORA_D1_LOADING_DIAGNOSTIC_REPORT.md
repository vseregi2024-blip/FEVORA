# FEVORA IMPERIA — D1 loading diagnostic

Date: 2026-09-17

## Scope and safety

- C2.1 remains stopped.
- No production deployment, migration, database write, payment, bonus redemption, refund, reversal, or Beauty Bonus operation was performed.
- Production inspection was read-only: Railway HTTP/application logs and the already-authenticated browser session.

## Finding

There was no reproducible permanent server-side hang shared by `/cosmetology/clients` and `/cosmetology/cash`.

- Railway HTTP logs for the affected routes showed successful `200` responses in roughly 5–62 ms; no relevant 5xx, Prisma, authentication, React/Next, or Bot Client errors were present.
- `/cosmetology/cash` rendered in the production browser and correctly displayed a zero cash total for the selected day. The first report that it was permanently stuck was not confirmed after allowing the route to complete.
- `/cosmetology/clients` initially displayed the private-layout loading fallback, then successfully rendered the three existing client rows after a direct refresh. No client-side exception was recorded.
- The only browser-console finding was Chrome's warning that the registered service worker contained a no-op `fetch` handler, which may add navigation overhead.

The concrete defect removed in this change is that unnecessary no-op service-worker `fetch` handler. It cannot fetch Beauty Bonus data and it did not cache content, but it added avoidable work to every navigation and was the only client-side warning observed.

## Audit results

| Area | Result |
| --- | --- |
| Shared route path | Both routes pass through the private layout, its `loading.tsx`, `requireUser`, and bottom navigation. |
| Client list | `clients/page.tsx` calls only `requireUser` and `getCosmetologyClients`; it has no loyalty/B1 import or request. |
| Cash | `cash/page.tsx` calls only `getCosmetologyCashReport`; it has no loyalty/B1 import or request. |
| B1 protection | All server-side Beauty Bonus fetches use `AbortSignal.timeout(7000)`; client-detail B1 rendering catches errors and displays an unavailable fallback. |
| C2 impact | C2's `CosmetologyBonusRedemption` relation is used by visit/payment logic, not by the client list. Cash queries keep `BONUS` and `CERTIFICATE` as separate totals. |
| Cash semantics | Monetary cash total is only `CASH + MONOBANK + PRIVATBANK + OTHER`; `CERTIFICATE` and `BONUS` are excluded from it and reported separately. |
| Error boundary | The private route boundary provides a retryable, non-destructive error state. |

## Files changed

- `public/sw.js` — removed the empty `fetch` listener.
- `tests/pwa-service-worker.test.ts` — prevents reintroducing a no-op fetch listener.
- `tests/cosmetology-loading-isolation-d1.test.ts` — preserves page isolation from B1, B1 timeout protection, and separate cash treatment for certificates/bonuses.

## Verification

- Prisma validate: PASS (with a non-routable local placeholder `DATABASE_URL`; no production URL used).
- Prisma generate: PASS.
- Typecheck: PASS.
- Lint: PASS, 0 errors; 3 pre-existing `next/image` warnings in unrelated family components.
- Full test suite: PASS — 28 files, 302 tests.
- Relevant B1 cases: normal response, timeout, and HTTP 500 are covered by mock tests; timeout/500 remain graceful failures and do not make client/cash routes call B1.
- PAYMENT 2.0, C1 certificates, and C2 bonus-redemption regression tests: PASS.
- Production build: PASS.
- `git diff --check`: PASS.

## Mobile check

The source keeps the global `min-width: 320px`, so 375/390/430 px are above the responsive floor. A full local authenticated browser smoke check could not be run because there is no local PostgreSQL server/fixture running and Docker Desktop is not running. No production visual data or state was changed for this diagnostic. This is the only unexecuted visual sub-check; it does not affect the completed code, test, or build gates.

## Conclusion

D1 found no evidence that C2, B1, Prisma payment aggregation, or the cash calculation caused a backend deadlock. The minimal browser-navigation cleanup is complete and locally verified. No production action was taken. C2.1 remains prohibited until a separate explicit authorization.
