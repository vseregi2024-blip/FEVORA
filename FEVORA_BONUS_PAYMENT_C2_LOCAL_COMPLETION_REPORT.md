# FEVORA IMPERIA — C2 local completion report

Дата: 17 сентября 2026

## Статус

**C2 LOCAL COMPLETE.** Реализация и проверки выполнены только в локальной рабочей копии. Production database, Railway deployment и реальные списания в Beauty Bonus Club не затрагивались.

## Что реализовано

- В `CosmetologyPaymentMethod` добавлен `BONUS`: процедура по-прежнему имеет один `Payment` и набор `PaymentComponent` (`CASH`, `MONOBANK`, `PRIVATBANK`, `OTHER`, `CERTIFICATE`, `BONUS`).
- Добавлена отдельная saga-модель `CosmetologyBonusRedemption`. Она не использует и не меняет `CosmetologyLoyaltyDelivery` — F3 остаётся только для начисления бонусов.
- Сохранены state machine: `PENDING`, `SENDING`, `REMOTE_CONFIRMED`, `APPLIED`, `FAILED_RETRYABLE`, `FAILED_FINAL`, `CONFLICT`.
- В записи списания фиксируются visit, payment, внешний ID клиента, сумма, валюта, immutable payment snapshot, попытки, код ошибки и snapshots `balanceBefore`/`balanceAfter` из ответа Bot Client. Эти snapshots не являются локальным балансом.
- `externalEventId` стабилен: `fevora:visit:<visitId>:bonus-redemption:<requestKey>`. Retry использует тот же ID.
- Есть DB-level unique защита для `externalEventId`, `paymentComponentId`, пары `visitId/requestKey` и partial unique index для одной незавершённой saga на процедуру.
- B3 вызывается только сервером через `POST /api/v1/bonus-redemptions`. Секрет остаётся только в server environment; в browser payload не попадает.
- B1 loyalty profile показывает текущий `bonus_balance` в форме. Для неподключённого клиента бонусы недоступны и есть переход к карточке подключения.
- Максимум в форме: `min(текущий B1 баланс, остаток процедуры)`. Сервер всё равно ждёт окончательное подтверждение B3.
- Поддержаны BONUS в форме доплаты завершённой процедуры и в форме первого закрытия процедуры. Если B3 временно недоступен, локальные payment components, Income, cash/wallet movements и certificate consumption не создаются до `REMOTE_CONFIRMED`.
- При remote success сначала сохраняется `REMOTE_CONFIRMED`, затем в одной локальной DB transaction создаются все components, `paidAmount`, денежный Income/wallet movements, связь `BONUS PaymentComponent → redemption` и `APPLIED`.
- Retryable timeout/429/5xx использует тот же event ID. `already_processed` считается remote success. 409 insufficient balance не создаёт component; idempotency conflict становится `CONFLICT` без автоматического retry.
- Карточка процедуры показывает статус незавершённого списания и безопасную кнопку «Повторить» для retryable состояний.

## Финансовая семантика

| Сценарий | Оплачено по процедуре | Денежная касса / доход | F3 earning |
| --- | --- | --- | --- |
| CASH 2 000 + BONUS 1 000 | 3 000 | 2 000 | 2 000 после полной оплаты |
| CASH 2 000 + CERTIFICATE 1 000 + BONUS 1 000 | 4 000 | 2 000 | 2 000 после полной оплаты |
| CERTIFICATE + BONUS без денег | закрывает стоимость | 0 | не создаётся |

`CERTIFICATE` и `BONUS` видны отдельными строками как неденежное погашение, но исключены из «Кассы за день», денежных `Income`, wallet movements и F3 earning amount.

## Миграция

- Подготовлена только additive migration: `prisma/migrations/20260917093000_add_cosmetology_bonus_redemptions/migration.sql`.
- В ней нет `DROP`, `TRUNCATE`, `DELETE`, `UPDATE` существующих данных, `db reset` или `db push`.
- Migration **не применялась** ни к локальной, ни к production БД.

## Проверки

- `prisma validate` — PASS.
- `prisma generate` — PASS.
- `npm run typecheck` — PASS.
- `npm run lint` — PASS без ошибок; есть 3 прежних warning про `<img>` в несвязанных family components.
- `npm test` — PASS: 26 файлов, 299 тестов.
- `npm run build` — PASS.
- B3 transport tests подтверждают exact payload, `accepted`, `already_processed`, insufficient balance 409, idempotency conflict 409 и opt-in safety flag.
- Payment/C1/F3 regression tests подтверждают mixed/partial payment, protection from overpayment, certificate atomicity, денежные фильтры cash report и F3 idempotency.
- Адаптивность проверена по действующим responsive rules: app имеет `min-width: 320px`, а все grids формы переходят в одну колонку при `<=520px`; новые bonus blocks используют обычные full-width input/card primitives без fixed width. Это покрывает 375/390/430 px на уровне локальной вёрстки. Полноценный browser E2E против локальной БД не запускался, потому что локальная БД не была предоставлена и production использовать для C2 запрещено.

## Не выполнялось

- Не выполнялись production migration, backup, deploy или production health checks C2.
- Не выполнялся успешный реальный `POST /api/v1/bonus-redemptions`.
- Не создавались production payment, PaymentComponent, Income, wallet movement, certificate, bonus transaction, referral transaction или локальный bonus balance.
- Не менялись существующие F3 delivery records и финансовые historical data.

## Следующий безопасный шаг

Только после отдельного разрешения: fresh production backup, additive migration, deploy, read-only regression checks и отдельный контролируемый первый redemption. До такого разрешения `BOT_CLIENT_BONUS_REDEMPTIONS_ENABLED` не должен включаться в production.
