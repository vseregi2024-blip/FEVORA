# FEVORA IMPERIA — C2.1 Real Bonus Redemption Check

Date: 2026-09-17 (Europe/Kyiv)
Production: `https://fevora-production.up.railway.app`
Status: **STOPPED DURING READ-ONLY PREFLIGHT — NO WRITE PERFORMED**

## 1. Outcome

The numeric baseline is unchanged, but the prepared `Ботокс 50` visit is still `SCHEDULED`, not `COMPLETED`.

The only штатный BONUS form available on this page is the procedure-completion form. Its server action enters `completeCosmetologyVisitWithBonus`, which changes the visit status to `COMPLETED` before preparing and sending the bonus redemption. The C2.1 instruction explicitly prohibits procedure completion.

Submitting this form would therefore exceed the authorised scope. The operation was stopped before enabling the production flag or sending any write request.

## 2. Read-only preflight

| Field | Verified value |
|---|---|
| FEVORA client | Швец Надя |
| Bot Client client | Надія Швець |
| loyaltyClientId | `39` |
| Visit | `cmtwjv6r50001pl4xvjzvdzfi` |
| Procedure | `Ботокс 50` |
| Visit status | `SCHEDULED` / «Запись» |
| Procedure cost | `6000.00 UAH` |
| paidAmount | `0.00 UAH` |
| remainingAmount | `6000.00 UAH` |
| Bonus balance | `100` |
| Pending bonus balance | `0` |
| Client bonus transactions | `1` |
| Existing transaction | historical registration bonus `+100` |
| Target-visit BONUS PaymentComponents | `0` |
| Target-visit bonus redemptions | `0` shown/known |
| Prior verified global FEVORA/B3 redemption baseline | `0` |
| Monetary cash today | `0.00 UAH` |
| Certificates closed today | `0.00 UAH` |
| Bonuses closed today | `0.00 UAH` |
| Production redemption flag | disabled (`BOT_CLIENT_BONUS_REDEMPTIONS_ENABLED !== "true"`) |

The client profile and transaction count were independently confirmed through authenticated B1 GET requests. No secret or authorization value was printed or stored.

A local read-only Prisma check through `railway run` could not connect to Railway's private database hostname from the local process. It failed before executing a database query and performed no write. The target-visit count is therefore supported by the authenticated visit UI and the previously verified zero-redemption baseline, not by a fresh direct SQL count.

## 3. Blocking anomaly

The agreed financial values match the requested preflight, but the visit state is incompatible with the allowed operation:

- actual state: `SCHEDULED`;
- required non-destructive route for the requested scope: an already `COMPLETED` unpaid visit using `payCosmetologyVisitAction`;
- current form route: `completeCosmetologyVisitAction`;
- consequence of submission: procedure status changes to `COMPLETED`;
- explicit user restriction: do not complete the procedure.

The production bonus-redemption flag is also disabled. It was intentionally left unchanged because the visit-state blocker already requires STOP.

No direct B3 POST was attempted as a workaround: it would bypass the штатный FEVORA payment flow and would not safely create the required local `PaymentComponent`/saga chain.

## 4. Requested result fields

| Requested result | Actual result |
|---|---|
| externalEventId | not created |
| remoteRedemptionId | not created |
| Balance before/after | `100 → 100` (no operation) |
| Amount redeemed | `0` |
| Redemption status | no redemption created |
| BONUS PaymentComponent | none created |
| paidAmount before/after | `0.00 → 0.00 UAH` |
| remaining before/after | `6000.00 → 6000.00 UAH` |
| Cash before/after | `0.00 → 0.00 UAH` |
| Bonus transactions before/after | `1 → 1` |
| Idempotent repeat | not executed because the first operation was not authorised in the actual visit state |
| Mobile 375/390/430 after operation | not applicable; no operation occurred |
| Anomaly | visit is `SCHEDULED`; штатный BONUS submission would complete it |

## 5. Safety confirmation

The following were not performed:

- no Railway variable change;
- no real B3 redemption;
- no idempotent repeat;
- no payment or PaymentComponent;
- no procedure completion;
- no cash, Monobank, PrivatBank, OTHER or certificate payment;
- no F3 earning;
- no refund, reversal or bonus reversal;
- no manual database mutation or compensation.

## 6. STOP and next safe decision

**STOP.** No further operation is allowed under the current instructions.

One new explicit owner decision is required before C2.1 can continue:

1. authorise completion of this exact `Ботокс 50` visit as part of the штатный BONUS flow; or
2. provide an already `COMPLETED`, unpaid visit with the agreed `6000 / 0 / 6000` baseline.

Do not manually alter database status and do not issue a direct B3 POST as a workaround.
