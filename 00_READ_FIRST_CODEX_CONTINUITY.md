# FEVORA + Beauty Bonus Club — CODEX CONTINUITY / READ FIRST

## CURRENT STATUS

**FUNCTIONAL CORE STABLE.**
**NEXT PHASE: UI/UX REDESIGN.**
**UI-G IMPERIA SETTINGS COMPLETE. STOP BEFORE INTERNAL PROJECT SCREENS.**
**DESIGN TASK EXISTS SEPARATELY.**
**DO NOT REBUILD BUSINESS LOGIC.**

This is the primary handoff file for the next Codex chat. Read this file and `AGENTS.md` before any change. Historical entries below are evidence; the current state in this section prevails where an older entry differs.

### Production snapshot — 2026-09-17

- FEVORA production is Online; public `/api/health` returned HTTP 200 after D1.
- C2 was deployed successfully: `532bdaec-ce8e-4382-a9c8-f755075efb44`.
- D1 was deployed successfully: `b35e7f15-c7f0-4601-9e0d-b5e050a340ca`.
- PostgreSQL is stable. Public TCP access is closed; do not use Railway SSH for database work.
- Fresh pre-C2 logical backup is outside Git: `/Users/mac/Documents/FEVORA-backups/fevora-c2-pre-migration-20260917T084817Z.dump`. `pg_restore --list` passed; Public Access was closed afterwards.
- No production database change occurred during D1. No real bonus redemption, refund, reversal, or F3 delivery was executed during D1.

### Functional core that must be preserved

#### A. Universal Finance

- Projects, MoneyAccounts, Wallets, Envelopes, internal transfers and inter-project transfers.
- Ledger-based common financial architecture and money calculations.

#### B. Cosmetology

- Clients, calendar/bookings, visits, services, medications/materials, purchases and inventory.
- Material usage, cost, profit, payments and analytics.

#### C. Payment 2.0

- `CASH`, `MONOBANK`, `PRIVATBANK`, `OTHER`; `Payment` and `PaymentComponent`.
- Partial and mixed payments, remaining balance, server-side overpayment protection and payment-component history.
- `Cash for day` includes only real monetary methods.

#### D. Certificates

- Certificate model, creation, statuses, initial/remaining balance, partial redemption and mixed payment.
- `CERTIFICATE` `PaymentComponent`; certificates never increase cash.
- C1, C1.1 and C1.2 were completed in production.

#### E. Beauty Bonus Club

- Bot Client remains the **source of truth** for loyalty.
- Production B1: client search, client, loyalty profile and bonus transactions.
- Production B2: Bearer-authenticated, idempotent, transaction-safe `POST /api/v1/payments` for earning.
- Production B3: Bearer-authenticated, idempotent, concurrency-protected, transaction-safe `POST /api/v1/bonus-redemptions` for redemption.

#### F. FEVORA loyalty integration

- Existing-client linking through `loyaltyClientId`; balance, level, percent and history display.
- F3 earning-delivery implementation, C2 `BONUS` `PaymentComponent`, and `CosmetologyBonusRedemption` saga.
- Retry, idempotency and remote/local recovery are implemented.
- `BONUS` and `CERTIFICATE` are excluded from cash. Earning amount excludes both methods.

#### G. D1 browser reliability

- Removed the no-op service-worker `fetch` handler. The deployed worker has no cache layer; `skipWaiting()` and `clients.claim()` remain.
- Production `/cosmetology/clients` and `/cosmetology/cash` browser smoke is green: loading completes, no navigation loop was observed, and browser console had no errors/warnings in the controlled session.
- Production mobile checks at 375/390/430 px found no root-page horizontal overflow. The cash payment-method tabs intentionally scroll within their own `period-tabs` control.

### CURRENT PENDING ITEM — C2.1

**READY BUT NOT EXECUTED.**

There is currently no safe `COMPLETED + unpaid + loyalty-linked` production visit for the first real bonus redemption.

- Confirmed candidate: Швец Надя; `loyaltyClientId = 39`; bonus balance `100`.
- Visit «Ботокс 50» is `SCHEDULED`; total `6000 UAH`; paid `0`; remaining `6000`; real redemption `0`.
- Do **not** change `SCHEDULED → COMPLETED` merely to test C2.1. Execute C2.1 only when a real suitable visit exists and the owner supplies a new explicit authorization.

### Deferred functional work

- First real bonus redemption C2.1.
- Refund, payment reversal, certificate reversal and bonus-redemption reversal.
- Secret/password rotation after production stages are complete.

Do not start these tasks in the redesign phase without a separate functional instruction.

### Next active phase

**FEVORA IMPERIA UI/UX REDESIGN.** The owner has a separate design brief. The next Codex chat must first read this file, then receive that brief, and must not alter business logic without a separate task.

### Repository handoff note

- The only intentionally uncommitted path is `src/app/(private)/family/accounts/page 2.tsx`. It differs from the active page and was not clearly an obsolete temporary file, so it was left untouched and excluded from the functional handoff commit. Review its intent before any rename or deletion.

> Канонический аварийный файл восстановления контекста. Новый Codex должен прочитать его **полностью до любых изменений, commit, migration, deploy или production-запросов**.

Последнее обновление: **2026-09-17, Europe/Kyiv**
Точка восстановления: **D1 production deployed: `b35e7f15-c7f0-4601-9e0d-b5e050a340ca` SUCCESS; health HTTP 200; clients/cash production and 375/390/430 browser smoke completed. No D1 DB change. C2.1 is ready but not executed because there is no safe COMPLETED + unpaid + loyalty-linked visit. STOP before C2.1.**
Владелец проекта: пользователь текущей рабочей среды.

## 0. Обязательные инструкции следующему Codex

1. Прочитай этот файл полностью.
2. Затем прочитай `/Users/mac/Desktop/you- to me/FEVORA/AGENTS.md` и релевантные отчёты из раздела 13.
3. Выполни `git status --short --untracked-files=all` в обеих рабочих копиях до любых действий.
4. **Не делай `git reset`, `git clean`, checkout файлов, массовую перезапись или удаление.** Локальная FEVORA содержит большой ценный незакоммиченный набор, использованный в последних production deployments.
5. Не считай Git HEAD FEVORA актуальной версией production: HEAD старее локального рабочего дерева и последних Railway deployments.
6. Не выводи и не записывай реальные secrets, токены, пароли, DSN или персональные данные сверх необходимого. В документах указывай только имена ENV variables.
7. До write-операций сверяй текущее состояние Railway, БД и deployment: данные после даты этого snapshot могли измениться.
8. Не запускай первый реальный `POST /api/v1/payments`, пока владелец явно не разрешит именно эту production-операцию.
9. После каждого завершённого этапа сначала обнови этот файл: дата, фактический статус, commit/deployment, migrations/backups, проверки, новая точка STOP и следующий безопасный шаг.
10. Если работа прервана или не завершена, всё равно обнови разделы «Текущая точка» и «Незавершённая работа», честно указав blocker и что уже менялось.

## 1. Где находятся проекты

### FEVORA / IMPERIA

- Локальная папка: `/Users/mac/Desktop/you- to me/FEVORA`
- GitHub: `https://github.com/vseregi2024-blip/FEVORA.git`
- Stack: Next.js 16, React 19, TypeScript, Prisma 6, PostgreSQL, Vitest.
- Production: `https://fevora-production.up.railway.app`
- Railway project: `FEVORA`
- Railway project ID: `7365c6b1-9b2d-4f71-8154-4c88614153f9`
- Railway environment: `production`
- Environment ID: `5640fef0-372f-47ef-b62c-0ade7af67dc9`
- Railway service: `FEVORA`
- Service ID: `be315b56-8d1c-4933-8cbc-df6239d879a2`

### Beauty Bonus Club / Bot Client

- Основная локальная рабочая папка: `/Users/mac/Desktop/CODEX/bot_clients`
- Git/deploy copy: `/Users/mac/Desktop/CODEX/bot_clients/_github_upload/beauty-bonus-club`
- GitHub: `https://github.com/vseregi2024-blip/beauty-bonus-club.git`
- Stack: Python, FastAPI, PostgreSQL/SQLite, Telegram bots.
- Production: `https://www.bbclub.in.ua`
- API base: `https://www.bbclub.in.ua/api/v1`
- Railway project: `BOT-CLIENTS`
- Project ID: `78551334-aa14-4a22-8eb2-8e59f55cd50f`
- Railway environment: `production`
- Environment ID: `eaa7a86c-aaee-41c8-a385-2826ec702a07`
- Railway app service: `beauty-bonus-club`
- Service ID: `f0b81dc4-3048-4d4d-8927-62e70422f996`
- Railway PostgreSQL service: `Postgres`
- PostgreSQL service ID: `37240c84-065d-4752-8c0e-dc8f59a98692`

## 2. Актуальное production-состояние на 2026-09-17

### Bot Client

- Deployment: `ee246747-5742-403b-9c81-4ba59f139b24`
- Status: `SUCCESS`
- Deployed commit: `b223ec71659b0dd7b22c938c1814dce015f9322a`
- Commit message: `Add idempotent FEVORA bonus redemption API`
- `/health`: HTTP 200 после B3 deployment.
- Production schema содержит B2 external payment fields/index и B3 `bonus_redemptions` с idempotency/client indexes.
- Последний подтверждённый безопасный count: clients `106`, payments `33`, bonus transactions `161`, bonus redemptions `0`.
- Full fingerprint всех 106 `client_id:bonus_balance` совпал до/после migration и deploy; сумма balances `12617` не изменилась.
- После B3 safe smoke успешных payment/redemption не было.

### FEVORA

- Последний проверенный deployment: `b35e7f15-c7f0-4601-9e0d-b5e050a340ca`
- Status: `SUCCESS`; service `Online`.
- Это deployment этапа `D1 service-worker navigation cleanup`.
- Image digest: `sha256:d2f3497f003ebd5f96f7ad4fa01951d094128696b074225329c75895c25b3274`.
- `/api/health`: HTTP 200, `{"status":"ok"}`.
- Production migrations: 24; startup D1 подтвердил `No pending migrations to apply`, поэтому migration в D1 не применялась.
- Production `sw.js` содержит только `install` с `skipWaiting()` и `activate` с `clients.claim()`; старый пустой `fetch`-handler отсутствует. Browser smoke `/cosmetology/clients` и `/cosmetology/cash` на 375/390/430 px завершает loading без refresh, loop и horizontal overflow.
- Новый startup больше не запускает Prisma seed автоматически; seed доступен только при явном `RUN_PRISMA_SEED=true`.
- Предыдущий C2 deployment: `532bdaec-ce8e-4382-a9c8-f755075efb44`, migration `20260917093000_add_cosmetology_bonus_redemptions` применена ранее; после D1 он штатно заменён новым deployment.
- Предыдущий PAYMENT 2.0 deployment: `c7d99e50-4e61-49d1-a3b0-a1840b63a7cf`, `SUCCESS`.
- Railway не вернул commit hash: deployment делался из локального рабочего состояния, а не из актуального Git commit.
- Предыдущий F3 deployment: `c870ab18-f0d5-46ac-8a7e-81866d29ac8a`, `SUCCESS`.
- F1.1 deployment: `84c1cd83-842a-4f40-b118-0bc4b191d5cf`, `SUCCESS`.
- На 2026-09-16 `BOT_CLIENT_PAYMENTS_ENABLED` не равен `true`; код разрешает отправку только при точном значении `true`, поэтому production payment delivery **выключена**.
- На C2.1 preflight 2026-09-17 `BOT_CLIENT_BONUS_REDEMPTIONS_ENABLED` также не равен `true`; флаг не менялся.
- `BOT_CLIENT_API_URL` точно равен `https://www.bbclub.in.ua`.
- FEVORA `BOT_CLIENT_API_SECRET` побайтно совпадает с Bot Client `FEVORA_API_SECRET_CURRENT`; значение не раскрывалось.

## 3. Критическое состояние Git и локальных файлов

### FEVORA — НЕ ОЧИЩАТЬ

На момент snapshot Git HEAD:

```text
b449631 chore: guard Family category duplicate cleanup
```

HEAD датирован 2026-09-07 и **не содержит весь актуальный production-код**. Рабочее дерево существенно изменено:

- 26 tracked файлов modified, примерно `+1070/-304` только по tracked diff;
- множество важных untracked files: migrations, server modules, loyalty/payment/money components, tests и completion reports;
- среди незакоммиченных файлов находятся F1.1, F2, F3, universal money, loyalty delivery и PAYMENT 2.0 изменения;
- `AGENTS.md` и этот continuity-файл также могут быть untracked.

Перед любым commit нужно провести отдельный аккуратный audit всех изменений. Не смешивать их с новой задачей вслепую. Не использовать destructive Git-команды. Production source of truth сейчас распределён между локальным рабочим деревом, reports, migrations и Railway deployment.

Ключевые untracked/modified области:

- `prisma/schema.prisma`;
- `prisma/migrations/20260909120000_add_universal_money_accounts/`;
- `prisma/migrations/20260909150000_add_internal_transfer_history_index/`;
- `prisma/migrations/20260910211500_add_loyalty_client_link/`;
- `prisma/migrations/20260911073500_add_cosmetology_loyalty_delivery/`;
- `prisma/migrations/20260911143000_add_cosmetology_payment_components/`;
- `src/server/loyalty.ts`, `src/server/loyalty-delivery.ts`, `src/server/money.ts`;
- `src/features/loyalty/` и `src/features/money/`;
- cosmetology loyalty/payment UI components and tests;
- universal money UI/server files and tests;
- completion/audit reports в корне FEVORA.

### Bot Client

- B2 код сохранён в Git commit `9c0bfe0...` и pushed в `main`.
- Git/deploy copy после B2 была чистой по tracked-файлам.
- Существовал отдельный untracked `CODEX_HANDOFF_FOR_INTEGRATION.md`; не удалять без проверки.
- Корневые и `app/` копии `db.py`/`services.py` нужно держать синхронно, потому что Railway обычно импортирует `app.*`.
- B3 закоммичен и pushed: `b223ec71659b0dd7b22c938c1814dce015f9322a`; production deployment завершён `SUCCESS`.
- Git/deploy copy чиста по B3 tracked-файлам; отдельный completion report хранится в основной папке Bot Client.
- Прежний untracked `CODEX_HANDOFF_FOR_INTEGRATION.md` сохранён и не относится к B3.

## 4. Архитектура систем

### Beauty Bonus Club

Один Python-процесс запускает FastAPI web app и Telegram polling bots. Основные слои:

- `webapp.py` — FastAPI app, web registration/admin UI;
- `bot.py` — клиентский и admin Telegram bots;
- `services.py` и `app/services.py` — service facade;
- `db.py` и `app/db.py` — schema, migrations, transactions и loyalty domain logic;
- PostgreSQL в Railway, SQLite для local tests.

Bot Client — единственный источник истины для:

- `bonus_balance` и `pending_bonus_balance`;
- loyalty level и percent;
- bonus transaction history;
- referral rules и referral bonuses;
- payment rows, которые запускают loyalty logic.

### FEVORA

Один Next.js application с server actions/services, Prisma и PostgreSQL. Модуль Cosmetology хранит клиентов, записи/визиты, услуги, препараты, платежи и delivery state. FEVORA не хранит локальную копию bonus balance/level/history; читает их server-to-server из Bot Client.

Финансовые сущности FEVORA и loyalty bonus изолированы. Отправка loyalty payment не должна создавать дополнительный `Income`, менять `MoneyAccount`, `Envelope` или общий капитал.

## 5. Защищённый Bot Client API

Authentication для всех routes:

```http
Authorization: Bearer <FEVORA_API_SECRET_CURRENT>
```

Secret передаётся только server-to-server. Admin cookie, query `api_key`, body и frontend не используются.

Read endpoints B1:

```text
GET /api/v1/clients/search?phone=...
GET /api/v1/clients/{clientId}
GET /api/v1/clients/{clientId}/loyalty-profile
GET /api/v1/clients/{clientId}/bonus-transactions?page=1&limit=20
```

Production write endpoint B2:

```text
POST /api/v1/payments
```

Production B3 endpoint:

```text
POST /api/v1/bonus-redemptions
```

Он выполняет только idempotent bonus redemption и использует текущую Bearer authentication. Endpoint deployed, но успешные production redemption ещё не выполнялись. Refund/reversal, client mutation, referral mutation и webhook не реализованы и не должны добавляться самовольно.

## 6. B2 payment contract

Пример payload:

```json
{
  "external_source": "FEVORA",
  "external_event_id": "fevora:appointment:<visitId>:final",
  "loyalty_client_id": 12345,
  "appointment_id": "<visitId>",
  "amount": 5000,
  "currency": "UAH",
  "payment_date": "2026-09-11T10:30:00+03:00",
  "services": [{"name": "Service", "amount": 5000}],
  "comment": "FEVORA completed procedure"
}
```

Правила:

- `amount` — фактически оплаченная сумма, не плановая цена, себестоимость или прибыль;
- только `UAH`;
- client ищется только по `loyalty_client_id`, новые clients не создаются;
- несколько services — один payment event;
- Bot Client сам выбирает текущий bonus percent и применяет существующую bonus/referral logic;
- первичная обработка: HTTP 201, `status=accepted`;
- идентичный retry: HTTP 200, `status=already_processed`, тот же `payment_id`;
- тот же event ID с другим payload: HTTP 409 `IDEMPOTENCY_CONFLICT`;
- неизвестный client: HTTP 404 `CLIENT_NOT_FOUND`.

DB idempotency:

- nullable fields `external_source`, `external_event_id`, `external_appointment_id`, `currency`, `external_payload_hash`;
- partial UNIQUE index `(external_source, external_event_id)` для non-null values;
- SHA-256 канонического значимого payload для conflict detection;
- payment, procedure bonus, referral operations и loyalty update — одна DB transaction;
- PostgreSQL client row lock `FOR UPDATE`; SQLite tests используют `BEGIN IMMEDIATE`;
- bonus failure откатывает payment.

## 7. Завершённые этапы интеграции

### Bot Client

- **B0** — технический аудит архитектуры, DB и loyalty/payment logic.
- **B1** — защищённые read-only GET endpoints, Bearer auth, uniform errors, request IDs, logging, pagination, rate limits.
- **B1.1** — production deployment, secret variable, live read-only smoke.
- **B2** — idempotent `POST /api/v1/payments`, additive migration, atomic existing bonus/referral service, concurrency/rollback tests, production deployment без реального payment.
- **B3** — защищённый idempotent `POST /api/v1/bonus-redemptions`, atomic transaction, concurrency protection и additive migration проверены и deployed; safe production smoke выполнен без реального redemption.

### FEVORA

- **F1** — первая проверка корректно остановилась: старая production-версия не содержала integration UI.
- **F1.1** — реализованы/развёрнуты server-side GET client, manual linking через unique `loyaltyClientId`, loyalty card/history/pagination и failure handling.
- **F2** — зафиксированы eligibility/payment rules без отправки POST.
- **F3** — additive `CosmetologyLoyaltyDelivery`, stable event ID, delivery snapshots/statuses, concurrency claim/lease, retry semantics, server-side POST client, safety flag и UI status. Реальный POST не выполнялся.
- **PAYMENT 2.0** — денежные компоненты CASH/MONOBANK/PRIVATBANK/OTHER, mixed/partial payments, aggregate/history, overpayment protection и связь с F3 eligibility. Bonus/certificate/refund не реализованы.
- **C1 certificates** — сертификаты как неденежный PaymentComponent, статусы/остаток/история, mixed payment, исключение из денежной кассы; additive migration и production deployment завершены без реальных тестовых операций.

## 8. FEVORA loyalty delivery

Prisma model `CosmetologyLoyaltyDelivery` содержит:

- unique `visitId`;
- unique stable `externalEventId`;
- snapshot `loyaltyClientId`, `amount`, `currency`;
- status `NOT_SENT | SENDING | SENT | FAILED`;
- `attemptCount`, `lastAttemptAt`, `lastErrorCode`;
- `remotePaymentId`, `sentAt`, timestamps.

Eligibility:

- visit `COMPLETED`, not deleted;
- client linked to positive numeric `loyaltyClientId`;
- amount > 0;
- procedure fully paid;
- currency UAH.

Одна завершённая полностью оплаченная процедура создаёт максимум одну delivery. Предоплата, отдельная доплата, незавершённая/отменённая процедура и несколько services не создают дополнительные loyalty events.

Concurrency/retry:

- atomic DB claim переводит `NOT_SENT`/retryable `FAILED` в `SENDING`;
- stale `SENDING` lease — 2 минуты;
- retry всегда использует тот же event ID;
- success или remote `already_processed` → `SENT`;
- timeout/network/429/5xx → `FAILED`, возможен manual retry;
- 409 → non-retryable conflict;
- автоматического retry нет.

## 9. Текущая безопасная точка и первый payment candidate

На 2026-09-11 подготовлен read-only preview, но POST не выполнялся:

- FEVORA client: Швец Надя;
- Bot Client `loyaltyClientId`: `39`;
- visit ID: `cmtwk2glz0005pl4xaht37vtp`;
- procedure: `чистка`;
- дата: `2026-09-11`;
- status: `COMPLETED`;
- фактически оплачено: `1000.00 UAH`;
- денежный способ: CASH;
- delivery: `NOT_SENT`;
- `attemptCount = 0`;
- `remotePaymentId = NULL`;
- stable event ID: `fevora:appointment:cmtwk2glz0005pl4xaht37vtp:final`;
- Bot Client balance до отправки: `100`;
- level: `Bronze`, percent `1%`, total spent `0`.

Payload preview находится в `FIRST_PRODUCTION_PAYMENT_PREVIEW.md`.

**Важно:** это исторический verified preview. Перед возможной отправкой нужно заново read-only проверить visit, payment aggregate/components, delivery status, client link, Bot Client profile, counts и safety flag.

## 10. Что категорически не было сделано

- Первый реальный production `POST /api/v1/payments` не отправлялся.
- Реальный Bot Client payment и bonus transaction через FEVORA не создавались.
- `BOT_CLIENT_PAYMENTS_ENABLED` не включался.
- Bonus redemption API deployed в production, но реальные бонусы через него не списывались.
- Certificates C1 находятся в production schema/UI. В C1.1 создан ровно один контрольный `TEST-CERT-001`, после проверки сохранён как `CANCELLED`; certificate payments не создавались.
- Refund/reversal/cancellation уже переданного payment не реализованы.
- Webhook и автоматическая массовая отправка не реализованы.

## 11. Незавершённая работа и безопасный следующий шаг

Текущая STOP-точка: **перед первым реальным production bonus redemption и перед первым реальным production loyalty payment**. Это две отдельные опасные операции, каждая требует отдельного явного разрешения.

B3 и FEVORA C2 migration/deploy уже завершены. D1 устранил production loading anomaly. Реальное списание всё ещё не выполнялось: повторный C2.1 preflight выявил конфликт между фактическим статусом визита и разрешённым scope.

C2.1 был повторно разрешён, но снова остановлен до write: подготовленный `Ботокс 50` остаётся `SCHEDULED`, а его production BONUS UI использует completion action. Это противоречит явному запрету C2.1 «не выполнять завершение процедуры». Не включать bonus redemption flag и не отправлять POST, пока владелец отдельно не разрешит завершение именно этого визита в штатном flow либо не предоставит другой уже `COMPLETED` неоплаченный визит.

C2.1A затем проверил весь authenticated production visit list в режимах «Ближайшие» и «Архив». Единственный `COMPLETED` визит имеет remaining `0`, поэтому кандидатов, одновременно удовлетворяющих `COMPLETED` и `remainingAmount > 0`, нет. Не переводить `SCHEDULED` визиты в `COMPLETED` и не создавать test visit без нового разрешения.

Следующий шаг допустим только по отдельному явному заданию владельца. Если владелец разрешит первый production payment, сначала подготовить новый read-only preflight и показать точный scope. Затем:

1. проверить backup/recovery readiness обеих систем;
2. убедиться, что delivery всё ещё `NOT_SENT`, attempts `0`, payload неизменен;
3. зафиксировать Bot Client counts/profile/balance до операции;
4. включить `BOT_CLIENT_PAYMENTS_ENABLED=true` только с явного разрешения;
5. отправить только один заранее согласованный event;
6. проверить FEVORA `SENT`, `remotePaymentId`, Bot Client payment, одно bonus accrual и новый balance;
7. проверить idempotent repeat без второй записи/bonus;
8. подтвердить, что финансы FEVORA не изменились от loyalty delivery;
9. решить с владельцем, оставить ли массовую отправку включённой; без такого решения вернуть flag в disabled state;
10. обновить этот continuity-файл и отдельный completion report.

Другие будущие задачи требуют отдельных спецификаций: FEVORA-интеграция B3, refunds/reversals, daily cash/reserves, окончательное объединение cosmetology wallets с universal money accounts, commit/reconciliation большого dirty FEVORA tree.

### C1 certificates — production complete (2026-09-16)

- Сертификат реализован как `PaymentComponent.CERTIFICATE`, а не денежный income.
- Добавлены model/statuses/relations, отдельные list/create/detail screens, поиск, optional client, история и смешанная оплата.
- Денежная касса и analytics исключают `CERTIFICATE`; стоимость процедуры закрывается всеми компонентами.
- Atomic decrement защищён `remainingAmount >= amount` внутри общей DB transaction; конкурентная проигравшая запись отклоняется.
- Migration `20260916090000_add_cosmetology_certificates` применена: только enum/table/nullable FK/indexes, без backfill и без удаления старых данных.
- Финальные локальные проверки: Prisma validate/generate PASS; typecheck PASS; lint 0 errors; 24 test files / 291 tests PASS; production build PASS; mobile 375/390/430 PASS без horizontal overflow.
- Backup: `/var/lib/postgresql/data/backups/fevora-c1-pre-migration-20260916T200224Z.dump`, 241585 bytes, SHA-256 `f73ff0b5c827c7dc6fa7dbc0f31a4332a6c8f528fb88a82517c45413afb355f7`, `pg_restore --list` PASS.
- Deployment `49e90aa0-7b79-4c42-a86e-fc7ad379ebc4` — `SUCCESS`; health HTTP 200.
- Production before/after: visits 5/5, payments 1/1, components 1/1, transactions 92/92, delivery 1/1; certificates после migration `0`.
- Старая CASH-оплата 1 000 грн сохранена; касса за 11.09 показывает CASH/total 1 000 грн.
- Полные отчёты: `FEVORA_CERTIFICATES_C1_LOCAL_COMPLETION_REPORT.md` и `FEVORA_CERTIFICATES_C1_COMPLETION_REPORT.md`.
- Реальные production certificates/payments/bonus operations не создавались.
- Не отправлять loyalty `POST`, не включать delivery flag, не делать bonus redemption, refund или reversal.

### C1.1 controlled production certificate check (2026-09-16)

- Создан ровно один test certificate: `TEST-CERT-001`, ID `cmu4kkkgy0001n1839hh96gxd`, 100/100 UAH, без client/payment link.
- ACTIVE list/detail UI проверены; история пуста; PaymentComponent count для сертификата 0.
- После проверки сертификат переведён в `CANCELLED` без физического удаления; 100/100 UAH сохранены.
- В форме оплаты отменённый сертификат отсутствует; доступна только option «Не использовать».
- Finance before/after без изменений: payments 1, components 1, transactions 92, COSMETOLOGY income 1 000 UAH, wallet movements 1 / 1 000 UAH, cash today 0.
- Loyalty delivery осталась `NOT_SENT`, attempts 0; flag не равен `true`; Bot Client не вызывался.
- Mobile: 375 и 390 px PASS; detail card 430 px PASS; list 430 px FAIL — `scrollWidth 449` при `clientWidth 430`, header action обрезается.
- Полный отчёт: `FEVORA_CERTIFICATES_C1_1_PRODUCTION_CHECK.md`.
- STOP: UI defect не исправлялся и deploy не выполнялся; не переходить к C2/bonus/refund/reversal без отдельного задания.

### C1.2 certificate list mobile overflow fix (2026-09-17)

- Причина: общий `.page-header` переходил в колонку только при `max-width:390px`; при 430 px заголовок и action-кнопка оставались в строке и давали `449px` scroll width.
- В list page добавлен scoped-класс `certificates-page-header`; при `max-width:430px` header становится колонкой, action-кнопка занимает `100%` ширины.
- Изменены только `src/app/(private)/cosmetology/certificates/page.tsx`, `src/app/globals.css` и targeted regression test.
- Local: typecheck PASS; lint PASS (0 errors, 3 прежних warnings); relevant tests 15/15 PASS; production build PASS; 375/390/430 list/card/create PASS.
- Deployment `5bba620b-b128-4507-9615-af9a9220c176` — `SUCCESS`; health HTTP 200; `No pending migrations to apply`.
- Production browser: 375/390/430 list `scrollWidth === clientWidth`, overflow 0; кнопка полностью видна, высота 49.1875 px; detail/create также без overflow.
- Полный отчёт: `FEVORA_CERTIFICATES_C1_2_COMPLETION_REPORT.md`.
- Database, migrations, payments, finance и Beauty Bonus Club не изменялись; C2 не начинался.

## 12. Security / ENV inventory без значений

### Bot Client Railway

- `FEVORA_API_SECRET_CURRENT` — текущий Bearer secret.
- `FEVORA_API_SECRET_PREVIOUS` — optional rotation window.
- `POSTGRES_DSN` — production database connection.
- Другие bot/admin secrets остаются только в Railway Variables.

### FEVORA Railway

- `BOT_CLIENT_API_URL=https://www.bbclub.in.ua`.
- `BOT_CLIENT_API_SECRET` — должен совпадать с Bot Client current secret.
- `BOT_CLIENT_PAYMENTS_ENABLED` — exact `true` включает POST delivery; отсутствие/любое другое значение выключает.
- `DATABASE_URL`, `AUTH_SECRET`, `OWNER_EMAIL`, `OWNER_PASSWORD` и OpenAI variables — только Railway/local env, не документы и не Git.

Никогда не копировать реальные values в continuity, report, source, commit message, terminal output или browser/frontend.

## 13. Обязательные документы для детального восстановления

### В папке FEVORA

1. `AGENTS.md`
2. `FEVORA_IMPERIA_5_DAY_SUMMARY_2026-09-11.md` — наиболее полный общий статус IMPERIA.
3. `FEVORA_BOT_CLIENT_F1_COMPLETION_REPORT.md` — неуспешная первая verification и причины.
4. `FEVORA_BOT_CLIENT_F1_1_COMPLETION_REPORT.md` — завершённый read-only linking/profile этап.
5. `FEVORA_LOYALTY_F2_RULES_REPORT.md` — правила payment eligibility/payload.
6. `FEVORA_LOYALTY_F3_COMPLETION_REPORT.md` — delivery/outbox, retries, safety flag.
7. `FIRST_PRODUCTION_PAYMENT_PREVIEW.md` — точный неотправленный кандидат.
8. `PAYMENT_FLOW_AUDIT.md` — аудит способов оплаты и пробелов.
9. `PAYMENT_2_0_COMPLETION_REPORT.md` — последнее monetary deployment.
10. `FEVORA_CERTIFICATES_C1_LOCAL_COMPLETION_REPORT.md` — полный локальный gate C1.
11. `FEVORA_CERTIFICATES_C1_COMPLETION_REPORT.md` — production backup/migration/deploy/read-only checks C1.
12. `FEVORA_CERTIFICATES_C1_1_PRODUCTION_CHECK.md` — controlled production certificate lifecycle check и найденный mobile defect.
13. `FEVORA_CERTIFICATES_C1_2_COMPLETION_REPORT.md` — исправление и production-проверка mobile overflow списка сертификатов.
14. `FEVORA_D1_LOADING_DIAGNOSTIC_REPORT.md` — локальная диагностика зависшего loading и исправление service worker.
15. `FEVORA_D1_PRODUCTION_COMPLETION_REPORT.md` — production deployment и browser smoke D1.
16. `FEVORA_BONUS_PAYMENT_C2_1_REAL_CHECK.md` — остановленный read-only preflight первого реального списания; никаких writes не было.
17. `docs/DECISIONS.md`, `docs/PROGRESS.md`, `FEVORA_MASTER_SPEC_v1_0.md`.

### В папке Bot Client

1. `BOT_CLIENT_API_AUDIT_B0.md`
2. `BOT_CLIENT_API_B1_COMPLETION_REPORT.md`
3. `BOT_CLIENT_API_B1_1_COMPLETION_REPORT.md`
4. `BOT_CLIENT_PAYMENT_API_B2_COMPLETION_REPORT.md`
5. `README.md`, `architecture.md`
6. `BOT_CLIENT_BONUS_REDEMPTION_B3_LOCAL_REPORT.md` — локальная реализация B3, schema, contract и проверки; production STOP.
7. `BOT_CLIENT_BONUS_REDEMPTION_B3_COMPLETION_REPORT.md` — backup, migration, commit/deployment и безопасные production проверки B3.

Старые `AI_MEMORY.md`, `HANDOFF_SUMMARY.md` и `CODEX_HANDOFF_FOR_INTEGRATION.md` относятся к более раннему состоянию и не должны переопределять этот continuity-файл или более свежие completion reports.

## 14. Migrations и backups

### Bot Client B2

- Migration: `sql/migrations/20260911_b2_external_payment_idempotency.sql`.
- Перед deploy создан logical JSON gzip backup трёх application tables.
- Сохранён локально: `/Users/mac/Desktop/CODEX/bot_clients/.backups/bot-client-production-pre-b2-20260910T213913Z.json.gz`.
- Permissions: `0600`.
- SHA-256: `ce60211038405cfa69b4e908a4a4931c07b473dc85cd9527036cd18f52d9dc64`.
- Backup не в Git; gzip integrity проверена.

### Bot Client B3 production

- Migration применена: `sql/migrations/20260917_b3_bonus_redemptions.sql`.
- Migration additive: новая `bonus_redemptions`, unique `(external_source, external_event_id)`, index по client.
- Pre-B3 backup: `/Users/mac/Desktop/CODEX/bot_clients/.backups/bot-client-production-pre-b3-20260916T214318Z.json.gz`, `0600`, 17316 bytes.
- Backup SHA-256: `7385a9d57850280caa6e0612c0c8761e48c19cbf48bf11501426fc91b70a5497`; gzip и независимое JSON-чтение PASS.

### FEVORA

- F1.1 migration: `20260910211500_add_loyalty_client_link`.
- F3 migration: `20260911073500_add_cosmetology_loyalty_delivery`.
- PAYMENT 2.0 migration: `20260911143000_add_cosmetology_payment_components`.
- C1 migration применена: `20260916090000_add_cosmetology_certificates`.
- F3 рабочий pre-migration dump был `/private/tmp/fevora-backups/fevora-production-pre-f3-20260911-v2.dump`, SHA-256 `15fc19c441faa4afa9d4237a0f54a45263e52a2b458ebca4f8d2ac910fc5b18f`; `/private/tmp` может быть очищен, поэтому перед новой опасной операцией проверить наличие или создать новый backup.
- PAYMENT 2.0 backup хранится на PostgreSQL volume: `/var/lib/postgresql/data/backups/fevora-payment-2-0-pre-migration-2026-09-11.dump`, около 227 KB.
- C1 backup хранится на PostgreSQL volume: `/var/lib/postgresql/data/backups/fevora-c1-pre-migration-20260916T200224Z.dump`, 241585 bytes, SHA-256 `f73ff0b5c827c7dc6fa7dbc0f31a4332a6c8f528fb88a82517c45413afb355f7`; `pg_restore --list` — 494 строки, PASS.
- Никогда не использовать `prisma db push`, `db reset`, `DROP` или `TRUNCATE` для production evolution; только reviewed additive migrations с backup.

## 15. Последние проверки

### Bot Client B2

- 23 Python tests passed.
- Покрыты auth, B1 reads, first payment, duplicate, two concurrent requests, retry after bonus error, 409 variants, referral logic, unique migration и rollback.
- Production health/OpenAPI/B1 GET passed.
- Production technical POST только с отсутствующим client дал 404 и не создал payment.

### Bot Client B3 local

- Новый B3 suite: 10/10 tests passed.
- Полный B1/B2/B3 regression suite: 33/33 tests passed в основной папке и повторно в Git/deploy copy.
- Покрыты success, balance decrement, существующий bonus journal, insufficient/zero/negative/unknown client, exact retry, 409 variants, same-event concurrency, different-event overdraw protection, rollback, Bearer auth, safe logs, rate limit и additive schema.
- `compileall` passed; `git diff --check` passed.
- FastAPI router startup/OpenAPI через `TestClient` passed. Отдельные lint/typecheck tools в Python-проекте не настроены.
- Production checks: health/OpenAPI 200; четыре B1 GET 200; B2 401/422; B3 401/422/404/429; успешных payment/redemption `0`.
- Post-deploy DB: clients 106, payments 33, bonus transactions 161, bonus redemptions 0; все balances неизменны.

### FEVORA F3

- 251/251 tests passed.
- lint/typecheck/build passed; 3 старых `<img>` warnings.
- Production migration/deploy/health passed.

### FEVORA PAYMENT 2.0

- 23 files / 265 tests passed.
- Railway production build/deploy passed.
- Local lint/typecheck в этом конкретном completion run зависли и не заявлены как passed.
- Existing production receipt preserved; no new real payment and no loyalty delivery attempted.

### FEVORA C1 production

- Prisma validate PASS.
- Prisma generate PASS.
- Typecheck PASS.
- Lint PASS: 0 errors, 3 старых `<img>` warnings вне C1.
- 24 test files / 291 tests PASS; targeted C1/PAYMENT coverage — 37 tests.
- Next.js production build PASS.
- Mobile preview реальных C1 components/styles: 375/390/430 px PASS, horizontal overflow отсутствует.
- Targeted post-deploy C1 tests: 2 files / 20 tests PASS.
- Production migration `20260916090000_add_cosmetology_certificates`: applied, schema up to date.
- Deployment `49e90aa0-7b79-4c42-a86e-fc7ad379ebc4`: SUCCESS; health HTTP 200.
- UI list/new/cash доступны; реальная detail card не открывалась, потому что certificates count = 0 и создание production-сертификата было запрещено. Dynamic route и safe missing-ID handling проверены; локальная detail card прошла mobile/UI verification.
- Реальные certificates/payments/bonus operations не создавались; loyalty delivery осталась `NOT_SENT`, attempts 0.

### FEVORA C1.1 production control

- `TEST-CERT-001`: ACTIVE проверен, затем `CANCELLED`; initial/remaining `100.00/100.00 UAH`.
- List/detail/history/select availability проверены production browser flow.
- 375/390 mobile PASS; 430 detail PASS; 430 list имеет horizontal overflow 19 px.
- Payments/components/transactions/cash/wallet movements/loyalty delivery не изменились.
- Сертификат физически не удалён; certificate payment не создавался.

### FEVORA C1.2 mobile overflow

- Typecheck PASS; lint PASS, 0 errors и 3 прежних warnings вне C1.2.
- Targeted C1 tests: 1 file / 15 tests PASS; production build PASS.
- Local и production browser verification: 375/390/430 px PASS для list/detail/create, horizontal overflow 0 px.
- Deployment `5bba620b-b128-4507-9615-af9a9220c176`: SUCCESS; health HTTP 200.
- Новых migrations и database writes не было.

### FEVORA D1 production

- Deployment `b35e7f15-c7f0-4601-9e0d-b5e050a340ca`: `SUCCESS`; FEVORA `Online`; `/api/health` HTTP 200.
- Build/healthcheck прошли; startup нашёл 24 migrations и подтвердил `No pending migrations to apply`. Seed не запускался, database не менялась.
- Production `sw.js` HTTP 200, `Cache-Control: public, max-age=0`; опубликованный код содержит `skipWaiting()` и `clients.claim()`, пустой `fetch`-handler отсутствует. Последующие browser update checks получали быстрый 304 с тем же ETag.
- `/cosmetology/clients` и `/cosmetology/cash` завершали loading без refresh на 375/390/430 px; horizontal overflow `0` на всех размерах; mobile navigation с `/cash` на `/clients` прошла.
- Browser console: 0 errors/warnings. HTTP logs: все smoke page requests 200, `/sw.js` 200/304, ошибок `>=400` нет; page timings 7–165 ms для clients и 6–83 ms для cash, циклов запросов нет.
- Реальных payments, bonus redemptions, refund/reversal и C2.1 действий не выполнялось.

## 16. Recovery workflow для нового чата/аккаунта

Рекомендуемый первый запрос новому Codex:

```text
Открой папку /Users/mac/Desktop/you- to me/FEVORA. Сначала полностью прочитай 00_READ_FIRST_CODEX_CONTINUITY.md и AGENTS.md. Затем только read-only проверь git status обеих папок, релевантные completion reports и текущие Railway deployment/flags без вывода secrets. Не очищай dirty worktree, не делай deploy и не отправляй production payment. Сообщи мне подтверждённую точку остановки и жди следующего задания.
```

Если доступен только GitHub, сначала получить/восстановить именно актуальный FEVORA source bundle: публичный Git HEAD на дату snapshot старее production/local working tree. Не считать clone репозитория полным восстановлением до сверки с этим документом и Railway-deployed version.

## 17. Как обновлять этот файл

Каждое обновление должно быть атомарным и содержать:

- новую дату/время и кто/какой task выполнялся;
- какие файлы, schema и ENV names изменились;
- tests/build/lint/typecheck с точными результатами;
- backup path/hash и migration name;
- commit hash, Railway deployment ID/status и health result;
- production data before/after;
- что намеренно не делалось;
- текущий safety flag;
- точный STOP/next step;
- предупреждение о незакоммиченных изменениях.

После записи проверить файл на отсутствие secrets. Не заменять факты предположениями и не ставить `COMPLETE`, пока обязательные проверки реально не прошли.

## 18. Журнал continuity

### 2026-09-12 — создан канонический recovery snapshot

- Объединены факты Bot Client B0–B2 и FEVORA F1–F3/PAYMENT 2.0.
- Live Railway read-only verification: оба текущих deployment `SUCCESS`; URL корректен; API secrets совпадают без раскрытия; payment flag отсутствует и delivery disabled.
- Зафиксирована критическая dirty-worktree ситуация FEVORA.
- Точка STOP: первый реальный production loyalty payment не отправлен.

### 2026-09-16 — C1 certificates локально завершён

- Исправлено зависание local Prisma/TypeScript: переустановлены dependencies, старые `node_modules` и `.next` сохранены внутри `node_modules/.c1-broken-*`.
- Добавлены certificate schema/migration/server/UI/payment integration и расширенные tests.
- Финальные checks зелёные: validate, generate, typecheck, lint, 291 tests, build, mobile 375/390/430.
- Production не открывался и не изменялся; Railway deploy/migration не выполнялись.
- STOP: ждать отдельного разрешения на production backup + additive migration + deploy C1.

### 2026-09-16 — C1 certificates production завершён

- Создан и проверен свежий production backup на PostgreSQL volume; hash и `pg_restore --list` зафиксированы.
- Подтверждено, что ожидает ровно одна migration C1; применена только `20260916090000_add_cosmetology_certificates`.
- Deployment `49e90aa0-7b79-4c42-a86e-fc7ad379ebc4` завершён `SUCCESS`; health HTTP 200.
- Автоматический production seed сделан opt-in, чтобы startup не выполнял UPDATE справочников без явного разрешения.
- До/после совпали counts процедур, payments, components, transactions и loyalty deliveries; старая оплата 1 000 грн сохранена.
- Certificate table пуста; никаких реальных сертификатов или платежей не создавалось.
- `BOT_CLIENT_PAYMENTS_ENABLED` не равен `true`; delivery кандидата осталась `NOT_SENT`, attempts 0; POST в Bot Client не выполнялся.
- STOP: не начинать bonus payment, refund, reversal или первый реальный loyalty payment без отдельного задания.

### 2026-09-16 — C1.1 controlled production test завершён

- Создан один тестовый production certificate `TEST-CERT-001`, проверены ACTIVE list/detail и пустая история.
- Проверены реальные mobile viewport 375/390/430; найден overflow списка при 430 px.
- Сертификат условно переведён `ACTIVE → CANCELLED`, не удалялся и не использовался.
- Отменённый сертификат отсутствует в payment selector.
- Все financial/loyalty контрольные показатели совпали с baseline; Bot Client не вызывался.
- STOP: ждать отдельного задания на исправление UI defect или другой новый этап; C2/bonus/refund/reversal не начинать.

### 2026-09-17 — C1.2 mobile overflow исправлен

- Найдена точная причина 19 px overflow на 430 px: header списка не складывался до breakpoint 390 px.
- Выполнено scoped UI-исправление без уменьшения текста и без влияния на другие разделы.
- Local gates зелёные: typecheck, lint, 15 relevant tests, production build; mobile 375/390/430 PASS.
- Deployment `5bba620b-b128-4507-9615-af9a9220c176` завершён `SUCCESS`; health HTTP 200.
- Production list/detail/create проверены read-only на 375/390/430: overflow 0, action-кнопка полностью видна.
- Новых migrations и production data writes не было; C2 не начинался.
- STOP: ждать отдельного задания владельца.

### 2026-09-17 — Bot Client B3 bonus redemption локально завершён

- Выполнен audit `clients`, `bonus_transactions`, `payments`, B1/B2 auth/idempotency/transactions и существующего manual spend.
- Добавлен `POST /api/v1/bonus-redemptions` с существующим Bearer auth, отдельным rate limit и безопасными errors/logs.
- Списание, отрицательная запись в существующем `bonus_transactions` и audit/idempotency-запись выполняются одной transaction; PostgreSQL использует client row lock, SQLite — `BEGIN IMMEDIATE`.
- Идентичный retry возвращает сохранённый результат без второго списания; изменённый payload с тем же event ID даёт 409.
- Подготовлена, но не применена additive migration `20260917_b3_bonus_redemptions.sql`; reversal и изменения FEVORA не выполнялись.
- Локально 10/10 B3 и 33/33 full regression tests PASS; те же 33/33 повторно PASS в Git/deploy copy.
- Изменения находятся локально и незакоммичены; push, Railway migration/deploy и реальные bonus operations не выполнялись.
- STOP: ждать отдельного разрешения на B3 production preflight/backup/migration/deploy. Реальный redemption требует отдельного разрешения после deploy.

### 2026-09-17 — Bot Client B3 production deploy завершён

- Подтверждён B2 baseline deployment `ec466df6…` / commit `9c0bfe0`.
- Создан и проверен fresh logical backup production DB: `bot-client-production-pre-b3-20260916T214318Z.json.gz`, SHA-256 `7385a9d5…a5497`, permissions `0600`.
- Применена только additive migration `20260917_b3_bonus_redemptions.sql`; `bonus_redemptions=0`.
- B3 commit `b223ec71659b0dd7b22c938c1814dce015f9322a` pushed в `main`.
- Railway deployment `ee246747-5742-403b-9c81-4ba59f139b24` — `SUCCESS`; health/OpenAPI HTTP 200.
- При old/new overlap был один transient Telegram `getUpdates Conflict`; после стабилизации error-level logs в финальном 2-minute окне отсутствовали, service Online.
- B1 GET regression 200; B2 только 401/422; B3 только 401/422/404 и rate-limit 429. Successful payment/redemption не выполнялись.
- До/после: clients 106, payments 33, bonus transactions 161; bonus redemptions 0. Fingerprint всех 106 balances и сумма 12617 совпали.
- Production logs не содержат secret/Authorization/Bearer; credential scan tracked Git files совпадений не нашёл.
- Completion report: `/Users/mac/Desktop/CODEX/bot_clients/BOT_CLIENT_BONUS_REDEMPTION_B3_COMPLETION_REPORT.md`.
- STOP: не выполнять первый реальный bonus redemption и не начинать FEVORA C2 без отдельного задания.

### 2026-09-17 — FEVORA C2 bonus payment локально завершён

- Проведён audit PAYMENT 2.0, C1 certificates, F3 delivery, B1/B3 contract и cash reporting; реализован `BONUS` как очередной `CosmetologyPaymentComponent`, без отдельной параллельной payment-модели.
- Добавлена отдельная saga `CosmetologyBonusRedemption` с additive migration `20260917093000_add_cosmetology_bonus_redemptions`; migration не применялась ни локально, ни в production.
- State machine: `PENDING → SENDING → REMOTE_CONFIRMED → APPLIED`, с `FAILED_RETRYABLE`, `FAILED_FINAL` и `CONFLICT`; retry использует неизменяемый `fevora:visit:<visitId>:bonus-redemption:<requestKey>`.
- B3 request реализован только server-side и защищён новым opt-in env `BOT_CLIENT_BONUS_REDEMPTIONS_ENABLED`; он не включался. Локальный `bonus_balance` не создан и не меняется.
- Денежная касса/Income/F3 earning считают только CASH, MONOBANK, PRIVATBANK, OTHER; CERTIFICATE и BONUS закрывают стоимость отдельно, но не являются деньгами или earning base.
- Local gates: Prisma validate/generate, TypeScript, 299/299 tests и production build PASS. ESLint без errors; 3 старых family `<img>` warnings не относятся к C2.
- Не было backup/migration/deploy/production API writes или реального POST B3. Полный отчёт: `FEVORA_BONUS_PAYMENT_C2_LOCAL_COMPLETION_REPORT.md`.
- Изменения остаются в очень dirty local worktree; commit/push не выполнялись.
- STOP: ждать отдельного разрешения на C2 production migration/deploy. После deploy не делать первый реальный redemption без ещё одного отдельного подтверждения.

### 2026-09-17 — C2 production preflight остановлен до backup

- Разрешение владельца на C2 production backup/additive migration/deploy получено; migration повторно проверена: только enum, новая saga table, indexes и FK, без destructive SQL.
- Read-only production preflight подтверждает: FEVORA deployment `5bba620b-b128-4507-9615-af9a9220c176` SUCCESS; migrations `23`; visits `5`, payments `1`, components `1`, certificates `1`, deliveries `1`, transactions `92`; C2 redemption table отсутствует, enum BONUS отсутствует.
- При попытке безопасно создать backup обнаружено, что Railway SSH в этой среде автоматически печатает runtime environment до исполняемой команды, включая credential-bearing variables. Создание backup было остановлено системой до выполнения; backup, migration, deploy, B3 request и любые production data writes не выполнены.
- STOP: нужен явный выбор владельца — разрешить этот Railway SSH механизм с риском технического disclosure в agent output либо предоставить альтернативный безопасный способ создать backup на PostgreSQL volume. До этого не повторять SSH backup, не применять C2 migration и не делать deploy.

### 2026-09-17 — C2 native backup проверка остановлена

- Владелец запретил Railway SSH и выбрал native Railway PostgreSQL/Volume Backup.
- Официальная Railway документация подтверждает ручные native volume backups, но установленный CLI не имеет command для их создания/просмотра (`railway postgres` и volume backup/files subcommands отсутствуют).
- Railway Dashboard открыт через обычный browser без SSH, однако сессия не авторизована и показывает только Login. Вход, передача credentials и обход авторизации не выполнялись.
- STOP: владелец создаёт manual backup в Railway: `PostgreSQL service → Backups → Create Backup`, затем подтверждает его существование. До этого не выполнять C2 migration/deploy/B3 redemption.

### 2026-09-17 — PostgreSQL credential rotation: FEVORA требует восстановления connection reference

- После disclosure старого DB credential владелец выполнил Railway Database → Config → Connection → Regenerate Password. Postgres deployment показал `Deployment successful` и сервис Online.
- Владелец затем инициировал FEVORA redeploy. Read-only check с CLI всё ещё показывает последнюю известную deployment ID `5bba620b-b128-4507-9615-af9a9220c176`, а public `/api/health` фактически отвечает HTTP `503` с `database_unavailable`.
- Вероятная причина: FEVORA `DATABASE_URL` хранит старое literal value вместо Railway reference или redeploy ещё не получил актуальную ссылку. Пароли не читались и не записывались.
- STOP: не делать C2 migration/deploy/bonus operations. В Railway открыть FEVORA → Variables и безопасно восстановить reference `DATABASE_URL=${{Postgres.DATABASE_URL}}`, затем redeploy и повторно подтвердить health HTTP 200. Не вводить и не показывать DB URL/password вручную.
- Повторная read-only проверка после сообщения владельца «Проверь»: deployment list всё ещё содержит `5bba620b-b128-4507-9615-af9a9220c176`, а `/api/health` всё ещё HTTP `503 database_unavailable`. Восстановление connection пока не подтверждено.
- Владелец инициировал новый FEVORA redeploy после password regeneration. Railway UI показывает deployment `8e10fd44…` FAILED: build/deploy прошли, но Network Healthcheck `/api/health` исчерпал retries с `service unavailable`; active service остался на предыдущем C1.2 deployment. Не считать FEVORA восстановленным до health HTTP 200.

### 2026-09-17 — Correction: PostgreSQL `DATABASE_URL` recovery is unresolved

- Railway UI showed an explicit empty `DATABASE_URL` in both FEVORA and Postgres. Earlier guidance incorrectly assumed that deleting the empty Postgres service-variable override would automatically restore a Railway-provided `Postgres.DATABASE_URL`; it did not.
- After that deletion, the FEVORA reference resolved empty again and the recovery redeploy failed its healthcheck. Do not repeat redeploys or change Postgres variables blindly.
- Current verified safe sources in Postgres are the nonempty `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, and `PGDATABASE` variables. Railway documentation permits combining reference variables into a service value. The next repair must be scoped to FEVORA `DATABASE_URL`, constructed from those sources, then visibly verified before any deploy.
- C2 migration/deploy, B3 redemption, production payments, and backup work remain STOPPED.

### 2026-09-17 — FEVORA database connectivity restored

- FEVORA `DATABASE_URL` was safely rebuilt from Railway Postgres reference variables (`PGUSER`, `PGPASSWORD`, `PGHOST`, `PGPORT`, `PGDATABASE`) without revealing or hard-coding credentials.
- The public read-only health check now returns HTTP `200` with `{\"status\":\"ok\"}`. No migration, payment, bonus operation, financial write, or C2 deploy occurred during recovery.
- The earlier failed recovery deployments remain historical failures; do not repeat redeploy merely for this recovery. C2 remains blocked on the required fresh valid local production backup and separate explicit production sequence.

### 2026-09-17 — C2 fresh local production backup completed; external access closed

- Fresh logical backup created locally outside the repository: `/Users/mac/Documents/FEVORA-backups/fevora-c2-pre-migration-20260917T084817Z.dump`.
- Backup size: `247124` bytes; SHA-256: `70ac309e2d212bbd5d67d2fa9fdd83dc4a7f238ba8a48a7b9e6fe59ac2960e23`; the local backup script reached its `pg_restore --list` gate before printing this final metadata.
- Temporary PostgreSQL Public Access/TCP proxy was enabled only for this dump, then removed. Railway Settings now shows `Add Public Access`, so external TCP proxy is no longer enabled.
- Postgres is Online and final public FEVORA `/api/health` read-only check returned HTTP `200` with `{\"status\":\"ok\"}`.
- No C2 migration/deploy, payment, bonus operation, financial write, or other production data mutation was performed. STOP before C2.

### 2026-09-17 — FEVORA C2 production migration and deploy complete

- Fresh local pre-migration backup remains available outside Git: `fevora-c2-pre-migration-20260917T084817Z.dump`, `247124` bytes, SHA-256 `70ac309e2d212bbd5d67d2fa9fdd83dc4a7f238ba8a48a7b9e6fe59ac2960e23`; its `pg_restore --list` gate passed. PostgreSQL Public Access remains closed.
- Reviewed and applied only `20260917093000_add_cosmetology_bonus_redemptions`: `BONUS` enum value, new status enum/table, indexes/unique constraints and foreign keys. It contains no DROP/TRUNCATE/DELETE/UPDATE/backfill/seed.
- Railway FEVORA deployment `532bdaec-ce8e-4382-a9c8-f755075efb44` is `SUCCESS`; deploy log says `24 migrations found`, applied this migration and `All migrations have been successfully applied`; public `/api/health` is HTTP 200.
- The fresh saga table begins with `0` real redemptions: migration has no data inserts and no C2 write was sent. Existing procedures/payments/components/certificates/transactions/deliveries are preserved by additive SQL; no seed or delivery worker ran.
- Full local gate: Prisma validate/generate, typecheck, 299/299 Vitest tests and production build PASS; ESLint has 0 errors and only 3 unrelated old warnings. The C2 code keeps CASH/MONOBANK/PRIVATBANK/OTHER monetary and CERTIFICATE/BONUS non-monetary for cash and F3 earning.
- Safe B3 no-auth smoke `POST /api/v1/bonus-redemptions` with empty JSON returned 401. No authenticated B1/B3 request, BONUS payment, earning payment, refund, reversal or secret rotation was performed. Railway SSH was not used.
- Completion report: `FEVORA_BONUS_PAYMENT_C2_COMPLETION_REPORT.md`. STOP before C2.1; a real redemption/payment needs a new explicit instruction.

### 2026-09-17 — C2.1 production preflight stopped before any write

- Owner authorised one controlled real B3 redemption, but the required preflight was not completed and no POST, payment component, financial write or bonus operation was sent.
- Authenticated production visit `cmtwjv6r50001pl4xvjzvdzfi` opened read-only: client shown as Швец Надя, service «Ботокс 50», total `6000.00 UAH`, paid `0.00 UAH`, remaining `6000.00 UAH`; B1 block showed available balance `100` and maximum `100`.
- Required `/cosmetology/clients` and `/cosmetology/cash` pages both remained indefinitely in the visible state «Загружаем FEVORA / Проверяем актуальные данные» after a reload. Therefore client/loyalty ID, cash baseline and the full no-prior-redemption preflight could not be independently confirmed through the authorised UI.
- STOP by C2.1 anomaly rule: do not redeem or retry anything until this read-only UI/data-loading issue is diagnosed and the preflight can be completed.
### 2026-09-17 — D1 loading diagnostic

- C2.1 remains stopped. No production deployment, migration, DB write, real payment, bonus redemption, refund, reversal, or external B1 operation was performed.
- Read-only production investigation showed `/cosmetology/clients` and `/cosmetology/cash` returning `200` quickly; cash rendered, and clients rendered after a direct reload. No C2/B1/Prisma server-side hang was found.
- Chrome console showed one concrete issue: a no-op service-worker `fetch` listener added navigation overhead. Removed it in `public/sw.js`; added `tests/pwa-service-worker.test.ts` and `tests/cosmetology-loading-isolation-d1.test.ts`.
- D1 verification: Prisma validate/generate, typecheck, lint 0 errors/3 pre-existing warnings, build, and 28 test files/302 tests PASS. `git diff --check` PASS.
- A full local authenticated visual smoke at 375/390/430 remains unavailable because no isolated local PostgreSQL service/fixture is running and Docker Desktop is stopped. Do not claim that sub-check ran.

### 2026-09-17 — D1 production deploy and browser smoke complete

- Railway deployment `b35e7f15-c7f0-4601-9e0d-b5e050a340ca` (`D1 service-worker navigation cleanup`) is `SUCCESS`; image digest `sha256:d2f3497f003ebd5f96f7ad4fa01951d094128696b074225329c75895c25b3274`; service is `Online`; `/api/health` is HTTP 200 with `{"status":"ok"}`.
- Deployment used the reviewed dirty working tree and no new Git commit was created. Build/typecheck/static generation and Railway healthcheck passed. Startup found 24 migrations and reported `No pending migrations to apply`; no migration or seed ran and no database write was made.
- Published `/sw.js` contains only `install`/`activate` with `skipWaiting()` and `clients.claim()`; the old empty `fetch` listener is absent. The browser fetched the new 145-byte worker with HTTP 200 and subsequent checks returned 304 in 2–3 ms, consistent with the current worker being installed and reused.
- Authenticated production browser smoke passed for `/cosmetology/clients` and `/cosmetology/cash`: loading completed without refresh at 375, 390 and 430 px, URLs remained stable, and horizontal overflow was 0. Mobile navigation from cash to clients worked without a navigation loop.
- Browser console contained no errors/warnings. Railway HTTP logs showed only finite 200 page requests and normal 200/304 service-worker checks; no HTTP status >=400, service-worker loop or request waterfall capable of keeping the loader visible was found.
- Full report: `FEVORA_D1_PRODUCTION_COMPLETION_REPORT.md`. Database was not queried or changed for D1. No real payment, bonus redemption, refund, reversal or C2.1 action occurred. STOP and wait for a separate explicit instruction before any C2.1 or first real bonus redemption.

### 2026-09-17 — C2.1 repeat preflight stopped on visit status mismatch

- Owner authorised exactly one real 10-bonus operation plus one identical idempotent repeat, while explicitly prohibiting procedure completion and every other payment/refund/reversal operation.
- Authenticated read-only UI confirmed client `Швец Надя`, Bot Client identity `Надія Швець`, loyaltyClientId `39`, visit `cmtwjv6r50001pl4xvjzvdzfi`, `Ботокс 50`, status `SCHEDULED`, cost `6000`, paid `0`, remaining `6000` UAH.
- Authenticated B1 GET confirmed balance `100`, pending `0`, and exactly one existing client bonus transaction: the historical `+100` registration bonus. Cash for 2026-09-17 is `0.00 UAH`; certificate and BONUS non-monetary totals are also `0.00 UAH`. No redemption/payment history is shown for the target visit; prior verified FEVORA/B3 redemption baseline remains `0`.
- Production `BOT_CLIENT_BONUS_REDEMPTIONS_ENABLED` evaluates false and was not changed. A read-only local `railway run` Prisma attempt could not reach the private Railway hostname from the local process; it failed before a query and caused no data change.
- Code/UI contract proves the only BONUS form currently available for this `SCHEDULED` visit is wired to `completeCosmetologyVisitAction`; the bonus branch changes the visit to `COMPLETED` before creating/sending the redemption saga. Submitting it would violate the explicit C2.1 prohibition on completing the procedure.
- STOP before write. No flag change, form submission, direct B3 POST, externalEventId, redemption, PaymentComponent, paidAmount change, cash change, idempotent repeat or post-operation mobile check occurred. Report: `FEVORA_BONUS_PAYMENT_C2_1_REAL_CHECK.md`.
- Next safe choice requires a new explicit owner instruction: either permit completion of this exact visit as part of the штатный flow, or provide an already `COMPLETED` unpaid visit meeting the same agreed baseline. Do not use manual DB mutation or a direct B3 workaround.

### 2026-09-17 — C2.1A safe completed-visit search found no candidate

- Read-only authenticated production list inspection covered both «Ближайшие» and «Архив» views. Four visible visits are `SCHEDULED`; the archive contains exactly one `COMPLETED` visit.
- The only completed visit is `cmtwk2glz0005pl4xaht37vtp`, client Швец Надя / loyaltyClientId `39`, procedure «чистка», date 2026-09-11, cost `1000`, paid `1000`, remaining `0` UAH. It has one existing CASH PaymentComponent for `1000` and no BONUS redemption shown. The same-day verified B1 profile balance remains `100`.
- It is not a candidate because `remainingAmount > 0` is false. Therefore: «Безопасного COMPLETED неоплаченного визита для C2.1 нет».
- No status, Payment, PaymentComponent, redemption, externalEventId, bonus balance, flag, visit or production data was changed; no B3 POST was sent. STOP and wait for a separate instruction.

### 2026-09-17 — UI-0 frontend audit complete; STOP before UI-A

- Read the full continuity and functional handoff, then audited the current frontend routes, root/private layouts, desktop and mobile navigation, shared UI components, IMPERIA/family components, global CSS, family CSS and relevant CSS modules.
- Created `FEVORA_IMPERIA_UI_REDESIGN_PLAN.md` with the current route/layout/navigation/style inventory, the mapping for Home, Clients, Projects, Calendar, Cash, Finance and Settings, reuse candidates, design-system gaps and the proposed staged redesign sequence.
- Saved all seven owner-supplied PNG references under `design-references/fevora-imperia-ui-redesign/`; the two settings images are byte-identical and both were preserved with explicit filenames.
- No TS/TSX, CSS, backend, server action, API, Prisma, migration, Payment 2.0, certificate, bonus, Beauty Bonus Club or financial business-logic file was changed. No tests/build were required because this stage added documentation and unchanged binary references only.
- No production request, database access, migration, deployment, payment, redemption, refund, reversal or data write occurred.
- The pre-existing untracked `src/app/(private)/family/accounts/page 2.tsx` remains untouched.
- STOP: wait for explicit owner permission before UI-A — Design System. Do not change the interface before that permission.

### 2026-09-17 — UI-A design system and common IMPERIA shell complete; STOP before UI-B

- Owner explicitly approved UI-A and confirmed the seven saved PNGs as the master visual references for palette, gradients, dark background, glass cards, glow, typography, top quick sections, bottom navigation and overall visual character.
- Added `src/app/imperia-design-system.css` with dark graphite/navy/violet tokens, the approved `#8138FF → #C936E7 → #F447A2 → #FF7A3D` brand gradient, semantic success/warning/danger/info colors, typography, spacing, radii, borders, shadows, glow, form controls, skeleton/shimmer states and explicit 430/390/375 px rules.
- Added reusable primitives in `src/components/ui/imperia.tsx`: cards, stat/quick/progress/project cards, section header, badge, gradient button, icon circle and loading/empty/error states. Extended the existing SVG icon system without adding a dependency.
- Added `ImperiaAppShell` and `TopQuickNavigation` for `/family/*`, `/cosmetology/*` and `/projects`: real React/CSS header, crown/wordmark/tagline, notification marker, profile initial and the approved Clients/Projects/Calendar/Cash quick sections. No reference image is embedded in the UI.
- Unified the IMPERIA bottom navigation labels/routes as Home, Clients, Add, Finance and Settings; the raised central add action and all existing action-sheet destinations remain intact. `/projects` now retains the same IMPERIA shell/navigation.
- Replaced the private generic loading/error presentation with reusable finite skeleton/error states; no data loading or error recovery behavior changed.
- UI-A changed only presentation/layout components, icons, loading/error presentation and relevant UI contract tests. No page content was redesigned; Home and every screen-specific redesign remain unstarted.
- Verification: TypeScript PASS; relevant Vitest 4 files / 16 tests PASS; production build PASS; ESLint 0 errors with the same 3 pre-existing `<img>` warnings.
- Isolated local shell render at 375/390/430 px PASS: document/body horizontal overflow 0 at all widths, four quick-navigation columns remain visible, and the smallest bottom-navigation touch target is 58 px. Screenshots were generated only in `/private/tmp`; no production/browser data was accessed.
- No backend, server action, API, database, Prisma, migration, Payment 2.0, certificate, BONUS, Beauty Bonus Club, finance calculation, production data or deployment changed. The pre-existing `src/app/(private)/family/accounts/page 2.tsx` remains untouched.
- STOP: wait for explicit owner approval of UI-A before UI-B — Home screen. Do not redesign Home or any later screen without that approval.

### 2026-09-17 — UI-B IMPERIA Home screen complete; STOP before UI-C Clients

- Owner explicitly approved proceeding to UI-B and reconfirmed `ChatGPT Image 17 сент. 2026 г., 15_50_35.png` as the required first-screen composition and visual target.
- Replaced the `/family` presentation with the approved Home hierarchy: real IMPERIA shell and four quick sections, Capital, Goals, Analytics, Idea of day and the persistent bottom navigation. The reference PNG is not embedded in the application; the screen is implemented with React, CSS and the existing SVG icon system.
- Added `src/components/imperia-home.tsx` and extended `src/app/imperia-design-system.css` with responsive Home cards, progress states, analytics bars and a CSS-built sunrise/mountain illustration. Added `trendUp`, `trendDown` and `lightbulb` to the existing icons.
- Home uses existing server-side financial sources: `getFamilyAnalytics`, `getFamilyTransactions` and `getSavingsGoals`. Capital is calculated by the same existing balance formula; goals, percentages, income, expenses, result and expense categories are real values. No mock production amounts were added to application code.
- Existing destinations are preserved: Capital → `/money`, Goals → `/family/savings`, detailed analytics → `/family/analytics`; period selection uses existing `/family?period=...` behavior.
- Verification: `git diff --check` PASS; TypeScript PASS; focused Vitest 4 files / 24 tests PASS; production build PASS; ESLint 0 errors with the same 3 pre-existing unrelated `<img>` warnings.
- Isolated local Home render at 375/390/430 px PASS: document/body horizontal overflow 0, Capital width stays within every viewport, and the smallest bottom-navigation touch target is 58 px. Screenshots are only in `/private/tmp`; this QA fixture did not access production or database data.
- No backend, server action, API, database, Prisma schema/migration, Payment 2.0, certificate, BONUS, Beauty Bonus Club, finance calculation, production data or deployment changed. The pre-existing untracked `src/app/(private)/family/accounts/page 2.tsx` remains untouched.
- STOP: wait for explicit owner approval of the Home screen before UI-C — Clients. Do not redesign Clients or any later screen without that approval.

### 2026-09-17 — UI-B Home mobile-scale correction after owner review

- Owner rejected the initial UI-B preview because it was a long full-page render and did not match the approved one-screen mobile composition. That preview must not be used as an approval reference.
- Reworked the mobile Home density and hierarchy against the approved master: compact header, four equal quick cards, Capital with right-side result/open control and progress caption, compact Goals, three-column Analytics, Idea of day and a larger rounded fixed navigation bar.
- Added an explicit iPhone 17 Pro Max target: `440 × 956` CSS px, DPR `3`, native screenshot `1320 × 2868`, plus `env(safe-area-inset-top/right/bottom/left)` handling. QA now captures the viewport itself rather than a full-page screenshot.
- Exact iPhone 17 Pro Max viewport QA PASS: `440 × 956`, DPR 3, horizontal overflow 0, navigation targets 64 px. Adjacent 375/390/430 widths also have horizontal overflow 0.
- Reverification after correction: TypeScript PASS; 4 focused files / 24 Vitest tests PASS; production build PASS; ESLint 0 errors with the same 3 unrelated pre-existing `<img>` warnings; `git diff --check` PASS.
- UI-only correction. No backend, API, database, Prisma, migration, payment, certificate, bonus, Beauty Bonus Club, financial calculation, production data or deployment changed.
- STOP remains before UI-C — Clients; wait for explicit owner approval of the corrected Home screen.

### 2026-09-17 — Corrected UI-B Home approved

- Owner reviewed the corrected iPhone 17 Pro Max render and explicitly approved it with «да отлично».
- UI-B is complete and approved. STOP before UI-C — Clients; begin UI-C only after a separate explicit instruction.

### 2026-09-17 — UI-C Clients complete; STOP before UI-D Calendar

- Owner explicitly approved beginning UI-C after approving the corrected Home screen.
- Rebuilt `/cosmetology/clients` in the approved IMPERIA client-screen composition: active Clients quick card, real search, result/total counter, client list heading, new-client action, neon glass client cards, initials, real contacts, statuses, sources/marks, created date, phone action and profile action.
- Added reusable `src/components/imperia-clients.tsx`. Search still uses the existing `getCosmetologyClients` server query and existing `q` URL parameter; no data source, query behavior or client action changed.
- Restyled the existing `/cosmetology/clients/[id]` and `/cosmetology/clients/new` surfaces through scoped UI-C classes. Client editing, treatment plans, history, anamnesis, Beauty Bonus Club linking/history and client creation remain present and wired to the same actions.
- Added search/filter/phone/message/gift glyphs to the existing SVG icon system without adding a dependency. The reference PNG is not embedded in the application.
- Exact iPhone 17 Pro Max viewport QA PASS at `440 × 956`, DPR 3: horizontal overflow 0, bottom-navigation targets 64 px and search control 46 px. The 375/390/430 checks also have horizontal overflow 0 and the same passing target sizes. Screenshot: `/private/tmp/fevora-ui-c-440.png`.
- Verification: TypeScript PASS; 5 focused test files / 43 tests PASS; UI-C contract 4/4 PASS; production build PASS; ESLint 0 errors with the same 3 unrelated pre-existing `<img>` warnings; `git diff --check` PASS.
- No backend, server action, API, database, Prisma schema/migration, Payment 2.0, certificate, BONUS, Beauty Bonus Club logic, finance calculation, production data or deployment changed. The pre-existing untracked `src/app/(private)/family/accounts/page 2.tsx` remains untouched.
- STOP: wait for explicit owner approval of UI-C before UI-D — Calendar. Do not redesign Calendar or any later screen without that approval.

### 2026-09-17 — UI-C correction: explicit client finder

- Owner requested an unmistakable client-search section instead of an icon-only search control.
- Added a dedicated «Найти клиента» module with instructions, an explicit «Фамилия или номер телефона» field, a labeled gradient «Найти» button and a «Сбросить» action after a query.
- The existing server search behavior is unchanged and already covers display name, first/last name, full phone, contact value and the last four phone digits; results continue to render in the client list below.
- Corrected iPhone 17 Pro Max viewport render: `/private/tmp/fevora-ui-c-440.png`. QA at 375/390/430/440 px remains free of horizontal overflow; search target is 46 px and bottom navigation targets are 64 px.
- Reverification: TypeScript PASS; UI-C/loyalty focused tests 7/7 PASS; production build PASS; ESLint 0 errors with the same 3 unrelated pre-existing warnings.
- STOP remains before UI-D — Calendar; wait for owner approval of this UI-C correction.

### 2026-09-17 — UI-D Calendar complete; STOP before UI-E Cash

- Owner approved moving from Clients to UI-D Calendar.
- Rebuilt `/cosmetology/visits` in the approved IMPERIA calendar language while preserving the existing appointment source and create action. The page now opens in Month view and supports explicit Month, Day, Week and List modes.
- Added the approved hierarchy: Calendar hero, period controls, 42-day month grid with selected/today states and appointment-status dots, nearest three scheduled appointments, selected-day agenda, timeline views and scheduled/archive list.
- Preserved appointment links, client/template options, new-client fallback, date/time/duration, prepayment components and `createCosmetologyAppointmentAction`. Restyled the existing create-booking dialog; no form field or payment behavior was removed.
- Status presentation covers `SCHEDULED`, `COMPLETED`, `CANCELLED` and `NO_SHOW` without changing status semantics or mutations.
- Exact iPhone 17 Pro Max viewport QA PASS at `440 × 956`, DPR 3: horizontal overflow 0, bottom-navigation targets 64 px and month-day touch targets 44 px. The same gates pass at 375/390/430 px. Screenshot: `/private/tmp/fevora-ui-d-440.png`.
- Verification: TypeScript PASS; 4 focused test files / 30 tests PASS; UI-D contract 4/4 PASS; production build PASS; ESLint 0 errors with the same 3 unrelated pre-existing `<img>` warnings; `git diff --check` PASS.
- No backend, server action, API, database, Prisma schema/migration, Payment 2.0, certificate, BONUS, Beauty Bonus Club logic, finance calculation, production data or deployment changed. The pre-existing untracked `src/app/(private)/family/accounts/page 2.tsx` remains untouched.
- STOP: wait for explicit owner approval of UI-D before UI-E — Cash. Do not redesign Cash or any later screen without that approval.

### 2026-09-17 — UI-E Cash complete; STOP before UI-F Finance / Projects

- Owner approved the Calendar and explicitly authorised UI-E Cash.
- Rebuilt `/cosmetology/cash` with reusable `src/components/imperia-cash.tsx` on top of the unchanged validated `cashReportSchema` and `getCosmetologyCashReport` data source.
- The screen now presents the selected day/period and total real monetary receipts, four monetary methods (`CASH`, `MONOBANK`, `PRIVATBANK`, `OTHER`), quick Today/Yesterday/custom-period controls, method filters and linked payment-component operations.
- Certificates and bonuses are shown in an explicit separate «Неденежное погашение» panel labelled «Не увеличивает кассу». They are not included in the monetary hero total or monetary method cards; existing Payment 2.0 accounting semantics remain unchanged.
- Exact iPhone 17 Pro Max viewport QA PASS at `440 × 956`, DPR 3: horizontal overflow 0, bottom-navigation targets 64 px and cash filter targets 44 px. The same gates pass at 375/390/430 px. Screenshot: `/private/tmp/fevora-ui-e-440.png`.
- Verification: TypeScript PASS; 5 focused payment/certificate/bonus/UI-E test files / 31 tests PASS; UI-E contract 4/4 PASS; production build PASS; ESLint 0 errors with the same 3 unrelated pre-existing `<img>` warnings; `git diff --check` PASS.
- No backend, server action, API, database, Prisma schema/migration, Payment 2.0, certificate, BONUS, Beauty Bonus Club logic, finance calculation, production data or deployment changed. The pre-existing untracked `src/app/(private)/family/accounts/page 2.tsx` remains untouched.
- STOP: wait for explicit owner approval of UI-E before UI-F — Finance / Projects. Do not redesign Finance, Projects or any later screen without that approval.

### 2026-09-17 — UI-F Finance / Projects complete; STOP before UI-G Settings

- Owner approved moving from Cash to UI-F Finance / Projects.
- Rebuilt `/money` in the approved FEVORA IMPERIA language: real overall capital, active-project wallet and envelope totals, internal-transfer action, five real project balances, incoming/outgoing transfer totals, existing legacy income/expense/result summaries, wallet and envelope lists, archive and all existing create/detail/history links.
- Rebuilt `/projects` as the matching five-project launcher for Family, Poultry, Goods, Infobusiness and Cosmetology. The bottom Finance destination now opens `/money`; `/money` and its child routes use the shared IMPERIA shell and bottom navigation.
- Presentation uses only the existing `getMoneyProjects`, `getMoneyWorkspace`, `getMoneyOverview` and `getInternalTransfer` results. No server money calculations, Prisma schema, migrations, database, Payment 2.0, certificates, bonuses, Beauty Bonus Club or production state changed.
- Added scoped UI-F styles and `tests/imperia-finance-ui-f.test.ts`. Exact viewport QA at 375×812, 390×844, 430×932 and iPhone 17 Pro Max 440×956 passed with zero document horizontal overflow, 64px bottom-navigation targets and all five project cards visible in one row. Reference screenshot: `/private/tmp/fevora-ui-f-440.png`.
- Verification: TypeScript PASS; production build PASS; ESLint 0 errors with the same 3 unrelated pre-existing `<img>` warnings; full suite 326 tests after updating the existing finance-navigation contract; `git diff --check` PASS.
- STOP: wait for explicit owner approval of UI-F before UI-G — Settings. Do not redesign Settings or any later screen without that approval.

### 2026-09-17 — UI-G Settings complete; STOP before internal project screens

- Owner approved UI-F and explicitly authorised UI-G Settings.
- Rebuilt `/family/settings` in the approved FEVORA IMPERIA composition: authenticated-user profile, appearance, notifications status, security status, application sections, Beauty Bonus Club integration status, system settings, existing money-management route and logout.
- Preserved all existing settings destinations for projects, financial categories, family accounts/payment methods, recurring payments, cosmetology services and inventory. Profile details remain read-only because no profile-update backend exists; notifications and biometric login are truthfully marked as unconfigured instead of presenting fake working controls.
- Extended the existing device-local theme selector with a real System preference that follows `prefers-color-scheme`; Dark and Light remain supported. Beauty Bonus Club status is derived only from the presence of its existing integration configuration and no remote write or integration-logic change occurs.
- No Prisma schema, migration, database, Payment 2.0, certificates, bonuses, loyalty transactions, financial calculations or production state changed.
- Added scoped UI-G styles and `tests/imperia-settings-ui-g.test.ts`. Exact viewport QA at 375×812, 390×844, 430×932 and iPhone 17 Pro Max 440×956 passed with zero horizontal overflow and 64px navigation/theme targets. Reference screenshot: `/private/tmp/fevora-ui-g-440.png`.
- Verification: TypeScript PASS; 35 test files / 330 tests PASS; production build PASS; ESLint 0 errors with the same 3 unrelated pre-existing `<img>` warnings; `git diff --check` PASS.
- STOP: wait for explicit owner approval of UI-G. Do not begin internal project screens until the owner chooses and authorises the next project block.

### 2026-09-17 — Added to redesign roadmap: login screen

- Owner asked to add a separate redesign of `/login` based on the approved FEVORA IMPERIA dark neon-glass visual system after seeing the current light login form locally.
- The task is recorded in `FEVORA_IMPERIA_UI_REDESIGN_PLAN.md`; it is not started. It must preserve authentication, first-login behaviour, validation, sessions/cookies and redirects, and must not change `src/server/auth.ts`, database, Prisma, secrets or production without a separate explicit instruction.
- Current STOP remains unchanged: await owner approval of UI-G and a choice of the next authorised screen block.

### 2026-09-17 — Client birthday-entry usability correction

- Owner reported that the calendar-only date-of-birth field in `/cosmetology/clients/new` required scrolling month by month through many years.
- Updated the reusable `ImperiaDateField` only for its `birthDate` mode: an optional birthday can now be typed directly as `дд.мм.гггг`; the calendar remains an optional secondary picker.
- The component validates real calendar dates, rejects future birthdays and continues submitting the unchanged hidden `YYYY-MM-DD` value expected by the existing client action and server schema. The same improved control is used when editing an existing client profile.
- Verification: TypeScript PASS; focused UI-C test suite 5/5 PASS; `git diff --check` PASS; manual local-browser check PASS with `02.09.1990` entered in the New Client form.
- No server action, API, database, Prisma schema/migration, Payment 2.0, certificate, bonus, Beauty Bonus Club, financial calculation, production data or deployment changed.

### 2026-09-17 — Client internal screens: mobile interaction correction

- Owner reported that `/cosmetology/clients/new` and an existing client profile still looked like a wide, legacy browser form rather than the approved mobile application.
- Constrained these internal client flows to a mobile-width IMPERIA composition even when viewed in a wide local browser. The new-client form is now one vertical task flow rather than a desktop two-column layout.
- Rebuilt the existing-client surface as a compact client overview with separate action cards for client data, treatment plan and Beauty Bonus Club. Each action opens its own mobile bottom-sheet dialog; editing, plan creation, loyalty access and anamnesis remain wired to their original existing actions/components.
- Corrected the global IMPERIA checkbox sizing override so special marks use normal mobile checkbox controls rather than oversized form fields.
- Local visual verification PASS: the client profile and its «Данные клиента» sheet render as a single-width mobile flow; TypeScript PASS; focused UI-C test suite 5/5 PASS; `git diff --check` PASS.
- No server action, API, database, Prisma schema/migration, Payment 2.0, certificate, bonus, Beauty Bonus Club calculation/logic, financial calculation, production data or deployment changed.

### 2026-09-17 — Client special-marks compact picker

- Owner requested that «Особые отметки» not render as a long checkbox sheet inside the client editing window.
- Replaced it with a compact expandable multi-select control. In its collapsed state it shows only the heading and selected values (or «Не выбраны»); the existing checkbox inputs are revealed only when the control is opened.
- Existing `specialMarks` form names, values and update action are unchanged, so mark persistence and server-side semantics remain intact.
- Verification: TypeScript PASS; focused UI-C test suite 6/6 PASS; local browser verification PASS; `git diff --check` PASS. No backend, database, Prisma, payment, loyalty, production or GitHub change.

### 2026-09-17 — Client profile: remove duplicate content and action labels

- Owner requested a shorter client screen: no repeated client name, no separate «Открыть карточку / план / программу» button labels, and history must open as a window on tap.
- Removed the duplicate page header. The profile now has one client identity card, compact metrics and four direct-tap cards: data/preferences, plan procedures, Beauty Bonus Club and procedure history.
- Each complete card is the control that opens its corresponding sheet; history now uses the same sheet pattern. All underlying forms, links, loyalty functionality and data remain unchanged.
- Local visual verification PASS: the profile shows a single identity, no duplicated CTA labels and four compact direct-tap cards. TypeScript PASS; focused UI-C test suite 6/6 PASS; `git diff --check` PASS. No backend, database, Prisma, payments, loyalty logic, production or GitHub change.

### 2026-09-17 — Client profile: remove all repeated card summaries

- Owner asked for the profile launcher to show only essential section names, without repeated status/empty-state/detail wording.
- The launcher now shows only «Карточка клиента», «План процедур», «Программа лояльности / Beauty Bonus Club» and «История процедур» plus their tap affordances. Birth date, plan availability, loyalty availability, visit-history summaries and the duplicate data/preference label have moved out of the launcher.
- The detail content remains inside the respective sheets. Local visual verification PASS; TypeScript PASS; focused UI-C test suite 6/6 PASS; `git diff --check` PASS. No backend, database, Prisma, payment, loyalty logic, production or GitHub change.

### 2026-09-17 — Client profile: wide-screen visual alignment

- Owner noted that the 480px client-profile column looked detached below the four equal top navigation cards in a wide browser preview.
- On desktop widths only, the client identity and metrics now span the same visual width as the top navigation, while the four direct-tap internal cards form one equal four-card row. The profile no longer appears as a narrow centred insert.
- At iPhone 17 Pro Max/mobile widths the existing one-column 440px-oriented flow remains unchanged.
- Local wide-browser visual verification PASS; TypeScript PASS; `git diff --check` PASS. No backend, database, Prisma, payment, loyalty logic, production or GitHub change.

### 2026-09-17 — Client profile v2 approved direction and implemented locally

- Owner approved replacing the launcher-like client screen with the supplied profile-first reference composition, to be recreated in the approved dark FEVORA IMPERIA system rather than copied as an image.
- Rebuilt `/cosmetology/clients/[id]` as a real-data profile: title/back navigation, identity header with direct phone/contact/booking actions, basic contacts with edit sheet, last/next visit cards, latest-procedure history, payments summary, client notes, treatment plan and Beauty Bonus Club access.
- All content is derived from the existing `getCosmetologyClient` result. Edit, treatment-plan creation, anamnesis, visit links, loyalty card and booking link preserve existing actions/routes and no fake client events or payment values were introduced.
- Local visual verification PASS; TypeScript PASS; focused UI-C tests 6/6 PASS; `git diff --check` PASS. No backend, API, database, Prisma schema/migration, Payment 2.0, certificates, bonuses, Beauty Bonus Club logic, financial calculation, production data, deployment or GitHub change.

### 2026-09-18 — Client profile: generated-reference composition reproduced

- Owner clarified that the supplied client-profile image is a generated design target to reproduce, not an application screenshot merely to take inspiration from.
- Reworked the individual client route into a dedicated 480px reference-style mobile surface: it hides the general IMPERIA header/quick tiles for this route, adds the compact status/brand/title arrangement, light profile cards, identity/quick actions, core details, visit cards, history, payments, notes and two sticky actions.
- The interface is React/CSS, not an embedded image. Reference layout and spacing are recreated with FEVORA data; a real client photo is not fabricated, so the existing client initial is used until an actual stored photo exists.
- Local visual verification PASS in the right-side browser; TypeScript PASS; focused UI-C tests 6/6 PASS; `git diff --check` PASS. No backend, API, database, Prisma schema/migration, Payment 2.0, certificate, bonus, Beauty Bonus Club logic, financial calculation, production data, deployment or GitHub change.

### 2026-09-18 — Client profile: FEVORA typography and palette restored

- Owner asked to retain the new reference-driven profile composition while replacing only its temporary light-reference font treatment and cream colours with the application's own FEVORA IMPERIA typography and approved dark neon palette.
- Kept the reference layout, dimensions, sections and all behavior unchanged. Restored FEVORA UI typography, dark-indigo backgrounds, purple/pink/orange glows, branded controls and gradient primary bottom action.
- Local browser verification PASS; TypeScript PASS; `git diff --check` PASS. No backend, database, Prisma, payment, loyalty logic, production or GitHub change.

### 2026-09-18 — Client profile: brand header adjusted to supplied target

- Owner supplied the exact desired FEVORA header treatment: left time, large glowing crown, FEVORA IMPERIA wordmark and the brand subtitle.
- Replaced only the profile header with this React/CSS composition. All profile content, proportions, data, routes and interactions remain unchanged.
- Local visual verification PASS; TypeScript PASS; `git diff --check` PASS. No backend, database, Prisma, payment, loyalty logic, production or GitHub change.

### 2026-09-18 — Client profile: crown corrected and Home control added

- Owner identified that the generic crown icon read visually like a castle rather than the supplied open three-point crown with curved base.
- Replaced only the profile-header glyph with a dedicated inline SVG matching the supplied crown silhouette, and added an explicit accessible Home control («Вернуться в главное меню») leading to `/family`.
- Local visual verification PASS; TypeScript PASS; `git diff --check` PASS. No backend, database, Prisma, payment, loyalty logic, production or GitHub change.

### 2026-09-18 — Clients directory: approved reference composition rebuilt

- Owner supplied the approved FEVORA IMPERIA Clients reference and asked that the live local Clients route reproduce it in the right-side browser.
- Reworked `/cosmetology/clients` as real React/CSS: four quick sections, one compact name/tag/phone search field with a filter-style submit action, the client-total glow panel, «Мои клиенты / Все клиенты» heading, and reference-style client rows with avatar initials, real contact/status/source data, membership date and vertically stacked message/calendar actions at the right.
- No synthetic client portraits, visits, bonuses or balances were introduced; the interface only presents existing client data and preserves profile, new-client, calendar and server-search links.
- Verification: TypeScript PASS; focused UI-C test suite 6/6 PASS; `git diff --check` PASS; local browser visual check PASS. No backend, database, Prisma, migrations, payment, certificate, bonus, Beauty Bonus Club logic, financial logic, production, GitHub or deployment change.

### 2026-09-18 — FEVORA crown: supplied SVG made authoritative

- Owner supplied `mETbW01.svg` and explicitly set it as the source of truth for the FEVORA crown geometry. Its original file is preserved unchanged at `public/assets/fevora-crown-source.svg`; no library icon or newly drawn path is used for the brand mark.
- The source SVG is applied as a CSS alpha mask, so its original paths, diagonals, proportions and bottom oval determine the rendered form exactly. The surrounding visual treatment adds only a deep-purple background, yellow/orange-to-coral-to-fuchsia gradient and restrained neon glow.
- Replaced the global IMPERIA brand crown and the client-profile brand crown with this source-derived mark. Verification: TypeScript PASS; `git diff --check` PASS; local right-side browser visual check PASS. No backend, database, Prisma, payment, loyalty logic, production, GitHub or deployment change.

### 2026-09-18 — FEVORA crown: transparent reference finish

- Owner requested that the crown sit directly on the application background rather than inside a dark rounded-square tile, while retaining the supplied source geometry.
- Removed the logo background only. The source-derived crown itself remains painted with a warm yellow/orange top, coral middle and fuchsia lower-oval gradient, plus a restrained transparent glow. No path, ratio or internal diagonal/oval geometry changed.
- Local `/family` visual verification PASS; TypeScript PASS; `git diff --check` PASS. No backend, database, Prisma, payment, loyalty logic, production, GitHub or deployment change.

### 2026-09-18 — FEVORA crown: approved raster logo, transparent presentation

- Owner supplied a newer approved FEVORA IMPERIA raster crown. It is now used directly in the main and client-profile brand headers.
- Removed the visible square presentation around the raster via a crown-silhouette crop in the UI, leaving the application background visible around the mark. The approved logo is shown 30% larger at all responsive breakpoints.
- Two generated background-extraction attempts were visually rejected due to artifacts and are not used. The displayed mark remains the owner-supplied source image. Local `/family` visual verification PASS; TypeScript PASS; `git diff --check` PASS. No backend, database, Prisma, payment, loyalty logic, production, GitHub or deployment change.

### 2026-09-18 — FEVORA crown: second approved size increase

- Owner approved the transparent source-logo treatment and requested a further 30% increase of the crown mark.
- Increased the rendered crown dimensions by another 30% at desktop and every existing responsive breakpoint, including the client-profile brand header. Wordmark and navigation sizing remain unchanged for visual balance.
- Verification: TypeScript PASS; `git diff --check` PASS. No backend, database, Prisma, payment, loyalty logic, production, GitHub or deployment change.

### 2026-09-18 — New client: mobile FEVORA workflow rebuilt

- Owner supplied a generated mobile design target for the «Новый клиент» route and reported that the current live page was an unusable stretched desktop form.
- Rebuilt `/cosmetology/clients/new` as a real React/CSS mobile flow: compact FEVORA brand/back/profile header, neon photo introduction card, single-column primary-contact form, clear status, source/referrer, notes and the existing anamnesis modal. The bottom IMPERIA navigation is visible again for this creation screen.
- Existing create action and fields remain intact, including required name/phone, Instagram contact value, source/referrer, notes, anamnesis data and the manual `дд.мм.гггг` birth-date entry. The photo prompt accurately says that photo handling follows creation; no non-existent upload behavior was fabricated.
- Verification: local right-side browser visual check PASS; TypeScript PASS; focused UI-C tests 6/6 PASS; `git diff --check` PASS. No backend, API, database, Prisma schema/migration, payment, loyalty logic, financial calculation, production, GitHub or deployment change.

### 2026-09-18 — FEVORA crown: favicon and Apple touch icon

- Owner requested that the already-approved FEVORA crown be used as the application favicon instead of the previous home symbol.
- Generated browser (192/512px) and Apple-touch (180px) icon derivatives from the owner-approved crown raster, with a tight square crop that preserves the crown’s full silhouette and neon-gradient treatment. Updated app metadata to reference those assets, including the shortcut icon.
- Verification: visual inspection of the 192px favicon PASS; TypeScript PASS; `git diff --check` PASS. No application logic, backend, database, production, GitHub or deployment change.

### 2026-09-18 — New client: compact controls and mobile navigation repair

- Owner requested removal of redundant photo-copy and the «Основное» heading, a plus-only photo-card treatment, non-native designed pickers for source/referrer, and repair of the bottom IMPERIA navigation that had expanded across a desktop viewport.
- The photo card now contains only branded `+` affordances and «Карточка клиента»; no client-photo copy or portrait icon. The contact fields start immediately, without a redundant section title.
- Status, special marks, source and referrer now use real React bottom-sheet pickers rather than browser-native select menus. The selected status and marks post through the existing client-create action and persist in the client record. Existing fixed statuses and special marks are reused; no fictitious values were introduced.
- The bottom navigation is now a fixed, five-column, 480px-or-less mobile surface even when a desktop browser is used to preview the phone-sized route.
- Verification: hidden local browser preview PASS; TypeScript PASS; focused UI-C tests 6/6 PASS; `git diff --check` PASS. No backend, database, Prisma schema/migration, payment, loyalty logic, production, GitHub or deployment change.

### 2026-09-18 — Cash: reference-aligned monetary overview

- Owner found «Неденежное погашение» confusing and asked that the Cash screen be made current and visually aligned with the approved cash reference.
- Removed the non-cash settlement panel entirely from the live Cash UI. The overview now focuses on actual wallet receipts: period total, cash/non-cash split, four payment-method cards, a data-derived revenue chart, total, average check, transaction count, compact period/payment filters and recent real operations.
- The chart uses existing monetary payment components only; it renders an honest empty state when no receipts exist. Certificates and bonuses are neither presented as cash nor replaced with fabricated values.
- Verification: local right-side browser preview PASS; TypeScript PASS; focused UI-E tests 4/4 PASS; `git diff --check` PASS. No backend, database, Prisma schema/migration, payment, loyalty logic, financial calculation, production, GitHub or deployment change.

### 2026-09-18 — Appointment creation: progressive, non-duplicated form

- Owner reported that the new-appointment form was needlessly long and repeated labels above fields and inside placeholders.
- Simplified the primary flow to client, service, date, time and duration. New-client contact fields, manual service/price, prepayment and note are now compact collapsed rows and appear only when needed. Labels and placeholders are short and non-repetitive.
- The existing server action, selected-client path, manual-client path, manual-service path, scheduling fields, payment component fields and comment field are all preserved with their original names and validations.
- Verification: TypeScript PASS; focused UI-D tests 4/4 PASS; `git diff --check` PASS. No backend, database, Prisma schema/migration, payment, loyalty logic, financial calculation, production, GitHub or deployment change.

### 2026-09-18 — Family money: zero-balance envelope preparation

- Owner explicitly requested three future-allocation envelopes. Created them in the local user’s «Семья» money workspace: «Закупка препаратов», «Комбикорм», and «Страховка автомобиля».
- Each is an active UAH `ENVELOPE` with an opening balance of 0. No income, expense, transfer, allocation, or financial balance was created or changed.
- Verification: local database query confirmed exactly the three requested active zero-balance envelopes. Local PostgreSQL container was already running; no schema or migration change. Next safe step: once the financial flow is redesigned, use internal allocations to fund these envelopes without creating duplicate income or expenses.

### 2026-10-01 — Local single-owner PIN entry

- Owner requested a simpler local entry surface for the one-person FEVORA workspace: no name and no email, only one six-digit PIN input.
- Replaced the local login form and its server action with a six-digit local-PIN flow that selects the single local profile and creates the existing signed session. The simplified entry path is explicitly disabled in production; production account/password authentication remains available in `authenticateOwner` and was not removed.
- Verification: `npm run typecheck` PASS; `git diff --check` PASS; fresh local browser reload visibly shows «FEVORA IMPERIA», «Добро пожаловать», one «Код доступа» field, and «Войти». No data, schema, migration, payment, financial calculation, production, GitHub or deployment change.

### 2026-10-01 — Local access: blank-screen recovery

- Owner reported a blank white page immediately after local login. Root cause was not the PIN form: the existing `fevora-local-postgres` Docker container had exited, so the authenticated route could not load the one local profile.
- Started Docker Desktop and then restarted the already-existing local PostgreSQL container. Its contents were not changed. Confirmed one local user is reachable and the local Next server returns HTTP 200.
- Verified end-to-end in the in-app browser: local PIN entry redirects successfully to `/family`, and the Family home UI renders normally. The local dev server remains running on `127.0.0.1:3000`. No data, schema, migration, payment, financial calculation, production, GitHub or deployment change.

### 2026-10-01 — Actionable analytics and cosmetology quick entry

- Owner reported that the selected-period Analytics panel on Home and the large bottom «Добавить» control in Cash and Results looked actionable but did not lead to a usable entry flow.
- Made the Family Home analytics heading and both amount cards real links to the Analytics screen with the currently selected period retained. Cash now has explicit «Оплата процедуры» and «Расход кабинета» actions. Results exposes the same two direct actions in its header.
- Replaced the cosmetology bottom-plus dependency on a transient sheet with a normal route at `/cosmetology/quick-add`. The route has three direct, working choices: procedure payment, cabinet expense and new client. This avoids a no-op tap even before client-side JavaScript is available.
- Verification: TypeScript PASS; focused UI-B/UI-E tests 8/8 PASS; `git diff --check` PASS; local in-app browser verification confirmed that the Cash bottom plus opens `/cosmetology/quick-add` and every choice has its target route. No backend, database, schema, migration, payment, financial calculation, production, GitHub or deployment change.

### 2026-10-01 — Family Analytics: coherent controls and working quick add

- Owner found the black-and-gold Family Analytics controls visually inconsistent with the neon bottom navigation and reported that the raised «Добавить» control was again non-functional.
- Kept the Analytics screen’s intentional black-and-gold direction and applied it to the bottom navigation on this screen, including the central raised plus, so the interactive controls now belong to one visual system.
- The Family bottom plus is now a native link to `/family/quick-add`, not a client-side-only popup. The compact page offers only two direct paths: «Расход» and «Доход», both reusing the existing validated Family operation form.
- Verification: TypeScript PASS; family navigation and Home UI tests 6/6 PASS; `git diff --check` PASS; local in-app browser confirmed Analytics → bottom plus → `/family/quick-add` and verified both destination links. No backend, database, schema, migration, payment, financial calculation, production, GitHub or deployment change.

### 2026-10-01 — One financial entry flow across IMPERIA

- Owner clarified that procedure-payment and cabinet-expense quick buttons are not the desired money-entry model. They want one consistent action: central plus → income or expense → category → amount.
- Removed the duplicate action buttons from Cash and cosmetology Results. The central plus in cosmetology now uses the same direct Family quick-add route as the financial screens, where the existing operation form requires a category and amount before save.
- Verification: TypeScript PASS; Family navigation and Cash UI tests 6/6 PASS; `git diff --check` PASS; local browser confirmed Cash shows no duplicate action buttons and its central plus links directly to `/family/quick-add`. No backend, database, schema, migration, payment, financial calculation, production, GitHub or deployment change.

### 2026-10-02 — Compact income/expense picker from the central plus

- Owner found the separate full-page «Добавить операцию» choice screen too large for the simple income-versus-expense decision.
- Replaced the central-plus link in Family and Cosmetology with a compact native bottom panel. It expands in place and contains only «Расход» and «Доход»; selecting either opens the existing category-and-amount operation form.
- The panel uses native `<details>` rather than a JavaScript-only modal so it remains operable before client hydration completes.
- Verification: TypeScript PASS; Family navigation and Cash UI tests 6/6 PASS; `git diff --check` PASS; local browser accessibility verification confirms the plus expands to exactly two direct form links. No backend, database, schema, migration, payment, financial calculation, production, GitHub or deployment change.

### 2026-10-02 — Expense entry: layout, native pickers and split receipt access

- Owner reported that the new-expense header overlapped the top navigation, category/account controls were unusable or visually inconsistent, and splitting an ATB-style mixed receipt was inaccessible from the expense flow.
- Removed the negative page offset so the expense header begins below the app navigation. Replaced the system account select with an in-form expandable account list and replaced the JavaScript-only category dialog with an in-form native category list.
- Added a direct «Разделить один чек на несколько категорий» link in the expense form. It opens the existing receipt form, which creates 2–12 expense parts, requires their sum to equal the receipt total, and avoids recording an extra duplicate expense.
- Local evidence: the active local Family profile currently has no saved FAMILY expense categories; the native picker accurately shows this rather than fabricating data and now offers «Настроить категории» to open the existing category manager. Verification: TypeScript PASS; Family mobile/navigation tests 10/10 PASS; `git diff --check` PASS. No backend, database, schema, migration, payment, financial calculation, production, GitHub or deployment change.

### 2026-10-02 — Cash: removed duplicate payment-method filter

- Owner identified that Cash displayed the payment methods twice: once as the useful four wallet cards and again as a lower «Все / Наличные / Monobank / ПриватБанк / Прочее» chip row.
- Removed the lower duplicate row. The four top cards remain the sole payment-method filter; period selection («Сегодня», «Вчера», «Другой период») remains directly below the chart.
- Verification: TypeScript PASS; focused Cash UI tests 4/4 PASS; `git diff --check` PASS; local in-app browser accessibility check confirms the period controls are followed immediately by «Последние операции» with no duplicate payment-method row. No backend, database, schema, migration, payment, financial calculation, production, GitHub or deployment change.

### 2026-10-02 — Direct operation amount and settings-only category management

- Owner asked to remove inactive-feeling wording and setup controls from the income/expense entry flow. The amount is now a direct numeric field with a visible `0` placeholder: tapping the number enters the amount without opening a calculator dialog.
- Category and account are compact native vertical pickers. Category management is no longer linked from an operation: categories belong in Settings. The account picker shows «Без счёта» and every saved account, so it naturally supports more than one account without a browser-styled select.
- Date and comment are permanently visible together; the header’s stray square placeholder was removed. The expense-only mixed-receipt link remains available for splitting one receipt across several categories.
- Local accessibility verification confirms the direct amount field, permanently visible date/comment fields, and expandable vertical account list. The current local Family profile has no saved categories or accounts beyond «Без счёта», so no categories/accounts were invented. Verification: TypeScript PASS; Family mobile/navigation tests 10/10 PASS; `git diff --check` PASS. No backend, database, schema, migration, payment, financial calculation, production, GitHub or deployment change.

### 2026-10-02 — Reliable category-icon selection

- Owner reported that only the default shopping-cart icon could be selected while creating another Family category such as «Аптека».
- Replaced JavaScript-only built-in icon buttons with a native radio group. Each built-in icon now has one real form value, a visible selected state, and remains usable even if client hydration is delayed. The optional custom-image chooser remains available.
- Local accessibility verification: after reload the cart radio is selected by default; selecting the medicine radio switches the selected value from cart to medicine. Verification: TypeScript PASS; Family mobile/navigation tests 10/10 PASS; `git diff --check` PASS. No backend, database, schema, migration, payment, financial calculation, production, GitHub or deployment change.

### 2026-10-02 — Custom category image upload

- Owner found that «Своя» did not open an image picker when creating a Family category.
- Replaced the JavaScript-only trigger with a native file-label control. It opens the system image picker directly; after selection the image is resized to a compact WebP data image, shown as the category icon preview, and preferred over a built-in icon at save time.
- Local accessibility verification confirms the visible «Загрузить свою иконку» file control. Existing categories «Продукты» and «Лекарства» are present locally and retain their selected built-in icons. Verification: TypeScript PASS; Family mobile/navigation tests 10/10 PASS; `git diff --check` PASS. No backend, database, schema, migration, payment, financial calculation, production, GitHub or deployment change.

### 2026-10-02 — Clear label for universal categories

- Owner asked to simplify the Family category type label. The internal `BOTH` behaviour remains the same — a category can appear for either income or expense — but its user-facing label is now «Прочее» rather than «Доход и расход».
- The label was changed in both the create/edit picker and saved-category list. Verification: TypeScript PASS; `git diff --check` PASS. No backend, database, schema, migration, payment, financial calculation, production, GitHub or deployment change.

### 2026-10-02 — FEVORA-styled category type picker

- Owner found the system browser select for category type visually inconsistent with the FEVORA interface.
- Replaced the native select with an in-app expandable picker: dark FEVORA surface, matching typography, pink focus state, and distinct colour dots for expense, income, and common category. It preserves the same underlying `EXPENSE`, `INCOME`, and `BOTH` values.
- Local accessibility verification confirms the custom picker expands to exactly «Расход», «Доход», and «Общая категория». Verification: TypeScript PASS; Family mobile/navigation tests 10/10 PASS; `git diff --check` PASS. No backend, database, schema, migration, payment, financial calculation, production, GitHub or deployment change.

### 2026-10-02 — Working income and common-category selection

- Owner found that the newly styled picker still appeared stuck on «Расход».
- Removed the controlled client-state dependency from the type radios. They are now native form radios, so choosing «Доход» or «Общая категория» immediately changes the actual value that is saved, even before client hydration. The picker retains the FEVORA styling and selected-state feedback.
- Local accessibility verification confirmed the radio value changes from «Расход» to «Доход». Verification: TypeScript PASS; Family mobile/navigation tests 10/10 PASS; `git diff --check` PASS. No backend, database, schema, migration, payment, financial calculation, production, GitHub or deployment change.

### 2026-10-02 — Always-visible category type controls

- Owner correctly noted that the collapsing type picker could still look stale after selection because its closed summary did not reflect a browser-restored radio value.
- Replaced the collapsible control with three always-visible native choices: «Расход», «Доход», and «Общая категория». The selected option has a clear FEVORA-highlighted state, and the native radio is the submitted form value.
- Local accessibility verification confirms direct switching from «Расход» to «Доход». Verification: TypeScript PASS; Family mobile/navigation tests 10/10 PASS; `git diff --check` PASS. No backend, database, schema, migration, payment, financial calculation, production, GitHub or deployment change.

### 2026-10-02 — Native category type selection and reliable image persistence

- Owner reported that a selected category type should close immediately and a custom image chosen in the system file picker did not reliably attach.
- Replaced the collapsible type control with a dark, FEVORA-styled native select: it closes itself after a choice and always submits the selected type. Added server-side image processing: a chosen PNG/JPG/WebP is now posted with the category form, validated (up to 10 MB), resized to 96×96 WebP, and stored as the category icon even if client-side preview code is unavailable. The immediate browser preview/status remains when client code is available.
- Local accessibility verification confirms the native select exposes «Расход», «Доход», and «Общая категория» as real options. Verification: TypeScript PASS; Family mobile/navigation tests 10/10 PASS; `git diff --check` PASS. No backend, database, schema, migration, payment, financial calculation, production, GitHub or deployment change.

### 2026-10-02 — Custom-icon upload target repair

- Owner reported that choosing a custom image still did not attach or persist.
- Fixed duplicate file-input IDs which could send a chosen file to the wrong category editor once several category forms existed. Each icon picker now has a unique native file target. The server-side file handling now uses a structural file guard rather than a runtime-specific `instanceof File` check, and both create/edit forms explicitly submit multipart data.
- Local verification confirms the active create picker exposes its own native upload control; code verification remains TypeScript PASS, Family mobile/navigation tests 10/10 PASS, and `git diff --check` PASS. No financial records, schema, migrations, production, GitHub or deployment change.

### 2026-10-02 — Ready-made income category icons

- Added the seven owner-supplied illustrations to the local application as reusable income presets: Clients, Eggs, Poultry, Procedures, Creams, Learning, and Community.
- They are now selectable directly in the category icon picker and render again on the saved category card and in the quick income/expense category picker. No repeated file upload is required for these presets.
- Local accessibility verification confirmed all seven options appear and that «Птица» switches to the selected radio value. Verification: TypeScript PASS; Family mobile/navigation tests 10/10 PASS; `git diff --check` PASS. No financial records, schema, migrations, production, GitHub or deployment change.

### 2026-10-02 — Single supplied icon library for every category

- Owner replaced the earlier request with a complete transparent-background golden icon set and asked to remove every earlier emoji/legacy icon from the category chooser.
- The chooser now contains only the 19 supplied illustrations: seven income-oriented options plus products, automobile, travel, clothes, children, pets, home, pharmacy, phone, café, shopping, and payments. The optional «Своя» upload control remains for genuinely new personal artwork.
- Legacy saved icon keys now render their matching new illustration automatically, so current categories no longer show emoji. Local browser verification confirms all 19 images load successfully and are the only selectable preset icons. Verification: TypeScript PASS; Family mobile/navigation tests 10/10 PASS; `git diff --check` PASS. No financial records, schema, migrations, production, GitHub or deployment change.

### 2026-10-02 — One Family capital balance across Home and Transfers

- Owner found that Home correctly showed 1,475 UAH from Family income/expense operations while Capital and the transfer form showed 0 UAH. The screens had been reading separate ledgers.
- Added the synchronised Family wallet «Доступно семье». Its base balance is automatically calculated from Family operations; internal transfer ledger entries then reduce or increase that same wallet, so moving money to an envelope does not create a duplicate income or expense.
- Home now uses the same MoneyAccount capital total as the Capital page. Local browser verification: Home/Capital/transfer all show 1,475 UAH; the transfer source list presents «Доступно семье · 1,475 UAH» and the user’s existing envelopes as destinations. The finance explanation now states this relationship. Verification: TypeScript PASS; Money, Family, navigation, and Imperia UI tests 69/69 PASS; `git diff --check` PASS. No transaction was created, no money moved, and no schema, migration, production, GitHub or deployment change.

### 2026-10-02 — Finance screen without duplicate account summaries

- Owner identified that the top «Кошельки» and «Конверты» amount cards duplicated the detailed wallet and envelope sections further down the same Finance screen.
- Removed only the duplicate pair. The useful sections remain: capital, transfer, project balances, available amount, financial dynamics, the detailed wallet list, and the detailed envelope list with add/open actions.
- Verification: TypeScript PASS; Imperia Finance and Money tests 59/59 PASS; `git diff --check` PASS. No financial record, balance, transfer, schema, migration, production, GitHub or deployment change.

### 2026-10-02 — Create an expense category while adding a mandatory payment

- Owner needed a way to add a missing category such as «Аренда» directly from the new mandatory-payment form, without leaving the partially completed payment.
- Added «＋ Новая категория» immediately below the category list. It opens a compact in-place creator with a name and the full supplied icon set. It always creates an EXPENSE category, adds it to the current list, and selects it for the payment; no automatic debit occurs.
- The create operation uses the same category validation and secure image processing as Settings. Verification: TypeScript PASS; Family navigation/mobile tests 10/10 PASS; `git diff --check` PASS. No payment or category was created during verification, and no schema, migration, production, GitHub or deployment change.

### 2026-10-02 — Branded category menu and date picker for mandatory payments

- Owner found the separate «＋ Новая категория» row inconvenient and the browser-native date calendar visually inconsistent with FEVORA.
- Moved «＋ Новая категория» inside the Category dropdown as its final menu row. The options, active selection, and new-category creator now live in one cohesive control.
- Replaced native date inputs for next payment and optional end date with FEVORA-styled in-page calendars: dark surface, branded selected date, Russian weekday/month labels, month navigation, and an optional clear action for the end date.
- Verification: TypeScript PASS; Family navigation/mobile tests 10/10 PASS; `git diff --check` PASS. No payment or category was created during verification, and no schema, migration, production, GitHub or deployment change.

### 2026-10-02 — Calendar day selection repair

- Owner found that a visible day such as 31 October could not be selected in the new mandatory-payment calendar.
- The calendar was nested inside a `<label>`, which made its interactive day buttons invalid nested controls and allowed the browser to intercept their clicks. It now uses a semantic field section instead, so every calendar day button, including 31, receives its click and updates the submitted date.
- Verification: TypeScript PASS; Family navigation/mobile tests 10/10 PASS; `git diff --check` PASS. No payment, category, or financial data was created or changed.

### 2026-10-02 — Mandatory-payment category route

- Owner clarified that «＋ Новая категория» must not show a separate in-place or modal creator. It needs to open the existing Settings → Categories page, where categories are already created and managed.
- The final menu row now navigates directly to `/family/categories`; the temporary modal path and duplicate embedded creator were removed. The current payment is not submitted or changed by taking this route.
- Verification: TypeScript PASS; Family navigation/mobile tests 10/10 PASS; `git diff --check` PASS. No payment, category, or financial data was created or changed.

### 2026-10-02 — Exclusive mandatory-payment pickers

- Owner reported that dates and the newly created category could not be chosen. The supplied screen showed the date calendar and category list open together, with the later category menu covering calendar days.
- Assigned the native HTML details controls to one shared exclusive group. Opening the calendar now closes the category list and opening Categories closes the calendar, so their action targets cannot overlap. Category selection remains a native radio input and is submitted with the payment.
- Verification: TypeScript PASS; Family navigation/mobile tests 10/10 PASS; `git diff --check` PASS. No payment, category, or financial data was created or changed.

### 2026-10-02 — Reliable mandatory-payment field controls

- Owner still could not choose 31 October or select «Обязательные платежи». A separate local browser check reproduced the fault: the SSR-rendered bespoke controls opened, but their client click handlers did not persist the selected value.
- Replaced those non-persisting controls with native form controls styled to match the FEVORA dark form: the date field retains the branded surface and focus treatment while using the browser's reliable date value; Category is now a native select. «＋ Новая категория» continues to route to the existing Categories settings page.
- Local browser verification selected and retained `2026-10-31` and the existing «Обязательные платежи» category. TypeScript PASS; Family navigation/mobile tests 10/10 PASS; `git diff --check` PASS. No payment, category, or financial data was created or changed.

### 2026-10-02 — Readable and openable mandatory-payment cards

- Owner found the recurring-payment row compressed the title into unreadable fragments before the amount and did not provide a usable target to open the item.
- Adjusted the responsive breakpoint for recurring rows: at tablet and mobile widths the payment title/metadata and amount occupy the first row, while action buttons move to a second row. This preserves room for the existing detail link instead of letting action labels squeeze it to a few pixels.
- Local browser verification on the owner-created «За телефон» payment shows its full title, amount, status, and individual action buttons. Activating the row opened `/family/recurring/cmur6pyhc00qp8ovul0nwi0rr`, where the selected category is «Обязательные платежи». TypeScript PASS; Family navigation/mobile tests 10/10 PASS; `git diff --check` PASS. No financial data was changed during verification.

### 2026-10-02 — Clickable savings goals

- Owner reported two accidental duplicate goals and could not open a goal to edit or archive it. The list previously exposed only a small text link at the bottom of each large card.
- Each active goal card is now one complete semantic link to its detail screen; tapping anywhere on a card opens its settings. The detail screen already provides editing and «Архивировать цель», which removes the chosen duplicate from active accumulation without discarding its movement history.
- Local browser verification sees both owner-created «На море» cards as full links and successfully opened the first detail page. TypeScript PASS; Family navigation/mobile tests 10/10 PASS; `git diff --check` PASS. No goal or movement was changed during verification.

### 2026-10-02 — Mandatory payments are reminders, not automatic debits

- Owner clarified the intended model: a date on an obligatory payment is a deadline/reminder, not a date when money is charged. An actual expense must occur only when the owner chooses to pay from Family funds.
- Replaced the automatic «Отметить оплаченным» flow with «Оплатить из семейных денег». It opens a prefilled manual Family expense (amount, category, payment account, and note); the balance/history change and the next reminder date advance only after that expense is explicitly saved. The recurring list now says «Оплатить до …» and «Напоминание активно».
- The Dynamics History link for Family now opens `/family/operations` (the current Family interface), rather than legacy `/finance`. Existing duplicate-looking entries are real records from two goal initial deposits and two separately saved recurring expenses, so they are not silently concealed. Each recurring-payment occurrence can now be opened from the current history and removed with a confirmation if created by mistake.
- Local browser verification opened the payment-to-expense flow without saving: amount 3,499 UAH and comment «Оплата: За телефон» were prefilled, and the page explicitly states that no debit happens until Save. TypeScript PASS; Family navigation/mobile tests 10/10 PASS; `git diff --check` PASS. No financial data was changed during verification.

### 2026-10-03 — Pre-migration financial data audit

- Created a verified local PostgreSQL rollback backup before the audit: `backups/finance-pre-audit-2026-10-03.dump` (SHA-256 `80c5354747a509ed6dd5fc5a750ddc58c1adcd07fe449e2fdfbdeeeb959fa0c6`). No database record was changed.
- Added a read-only repeatable audit script, `scripts/audit-finance-data.ts`; its current report is `backups/finance-audit-2026-10-03.json`. It identifies user-named test candidates, exact duplicate transactions, duplicate goals, automatic recurring-payment occurrences, Money ledger activity, and counts of linked finance records in Poultry, Goods, Infobusiness, and Cosmetology.
- Current result: six active Family transactions; no name-based test candidates; no linked finance records in the business modules; no Money ledger entries or internal transfers. The report flags two identical `На море` goals with two equal initial saving transactions and two legacy automatic recurring-payment expenses for `За телефон` as migration candidates, not automatic deletions. Six zero-balance MoneyAccount rows are ambiguous and retained pending the confirmed unified-wallet migration.

### 2026-10-03 — Confirmed duplicate cleanup and plan-only goals

- With owner approval and after a dry-run identity check, removed both duplicate `На море` goals and their two dependent SavingsMovement records. Their two `SAVING_IN` transactions were soft-deleted, so they no longer affect any financial calculation while the pre-cleanup backup remains a rollback point.
- Soft-deleted the two legacy automatic `За телефон` expenses (3,499 UAH on 2026-10-31 and 2026-11-30). The mandatory payment itself remains active as a reminder, with its next due date restored to 2026-10-31. It creates an expense only through the explicit manual payment action.
- Disabled the legacy goal-money path: creating a SavingsGoal no longer accepts an initial amount or creates a Transaction; legacy goal deposit/withdraw functions now reject requests and direct the user to envelope allocation. The corresponding goal UI no longer offers automatic money movements.
- Added safe audit/reconciliation utilities and an isolated mocked A–E financial-core test. The post-cleanup audit confirms two active real/undecided operations only: `Процедура +1,600.00 UAH` and `Продукты -125.00 UAH`; no active goals, recurring-generated operations, exact financial duplicates, or linked module financial records remain. Recalculation sets `Доступно семье` to 1,475.00 UAH; all other five MoneyAccount rows remain at 0.00 UAH. The six zero-value accounts remain untouched.

### 2026-10-03 — Goals merged into envelopes

- Created a second rollback backup immediately before the schema migration: `backups/finance-pre-envelope-migration-2026-10-03.dump` (SHA-256 `ef122d18818a482d5faed15c09c8b25f51b1acd80e9c76119edebe5ea0c646f0`). The migration `20261003090000_merge_goals_into_envelopes` was then applied to the local database. It removes the empty legacy `SavingsGoal`/`SavingsMovement` tables and adds optional icon/category data to MoneyAccount envelopes.
- A MoneyAccount with kind `ENVELOPE` is now the only goal/reserve model. It optionally has target amount and deadline; without a target it only shows its reserved balance. The old savings routes safely redirect to the envelope workspace and home now links to `Конверты`, not goals.
- Allocation to an envelope adds only to its reserve ledger. It neither creates income/expense nor changes total capital; total capital is the sum of real wallets and free money is `wallet total − envelope reserves`. Wallet-to-wallet transfers retain their mirrored ledger entries.
- The post-migration read-only audit is `backups/finance-audit-2026-10-03-envelope-model.json`: Family has 1,475.00 UAH in the real wallet, three zero-reserve envelopes, no ledger transfers, and no legacy Goal records. TypeScript PASS; focused finance/UI suite 80/80 PASS; `git diff --check` PASS.

### 2026-10-03 — Cosmetology cabinet UI

- Rebuilt only `/cosmetology` as a working cabinet; no financial schema, wallet, envelope, transaction, or database record was changed. Removed the four local-wallet balance cards, the «Касса за день» card, and the persistent «Ближайшие клиенты» list from this screen.
- Cosmetology-specific top navigation is now `Кабинет / Клиенты / Календарь / Препараты`; the previous IMPERIA navigation remains unchanged outside cosmetology. The cabinet now contains a clickable current-month mini-calendar, a compact today/month financial summary, an existing procurement-envelope link (or the project envelope list when absent), client/inventory cards, attention items, and low-priority links to certificates, price list, finance, and analytics.
- A mini-calendar day opens `/cosmetology/visits?date=YYYY-MM-DD` directly in the existing day view. TypeScript PASS; all tests 338/338 PASS; `git diff --check` PASS.

### 2026-10-03 — Unified Safe screen

- Replaced the user-facing local cosmetology «Касса» address with a redirect to `/safe`. The new Safe is read-only over `getSafeOverview`: it uses real MoneyAccount wallet balances, active envelope balances, and the single Transaction journal; it does not introduce a local cashier balance or a second calculation path.
- Safe presents only today’s income/expense/result, real wallets, a clickable allocation summary leading to `/money/envelopes`, recent income/expense operations, and the four requested entry actions. The former graph, average check, transaction-count KPI, and date/payment-method filters remain out of Safe. The new standalone envelopes view distinguishes reservations from wallets and shows target progress where a target exists.
- The mobile IMPERIA destination is now «Сейф». TypeScript PASS; focused Safe/finance tests 36/36 PASS; `git diff --check` PASS.
### 2026-10-03 — Коррекция «Сейфа» и восстановление локального запуска

- В общей верхней навигации IMPERIA карточка «Касса» заменена на «Сейф» и ведёт на `/safe`.
- Причина зависания экрана была установлена по журналу: запущенный Next.js использовал устаревший Prisma Client и падал на поле `MoneyAccount.category`. Клиент пересоздан, миграции локальной базы проверены (`up to date`), dev-сервер перезапущен.
- Актуализирован контракт нижней навигации: теперь ожидает `/safe` и «Сейф».

### 2026-10-03 — Завершение UI «Сейф» и отдельная аналитика

- `ImperiaSafe` показывает только итог дня, активные кошельки, кликабельное распределение, последние реальные доходы/расходы и четыре действия добавления.
- Операции теперь содержат тип, направление, категорию, указанный кошелёк и дату/время. Переводы и резервирование не входят в показатели «Сегодня».
- Добавлен `/analytics` с фильтрами периода, направления, типа, категории и кошелька; с суммами поступлений, расходов, итогом, количеством операций и графиком по дням. В нём нет «Среднего прихода».
- `/safe` и `/analytics` используют контекстную нижнюю навигацию IMPERIA.
- Исправлено стилевое подключение `/analytics`: маршрут включён в `ImperiaAppShell`, поэтому использует тёмную тему, верхние карточки и навигацию IMPERIA, а не старый светлый каркас.

### 2026-10-03 — Устранено зависание после создания кошелька

- Причина загрузочного экрана `/money` после создания кошелька: синхронизация технического семейного кошелька «Доступно семье» пыталась назначить его основным, когда новый кошелёк уже был отмечен основным. Уникальное ограничение основного кошелька проекта приводило к ошибке Prisma и бесконечному состоянию загрузки.
- Синхронизация теперь атомарно снимает признак `isPrimary` с других семейных кошельков перед обновлением «Доступно семье». Созданный пользователем кошелёк остаётся активным и не удаляется; изменяется только служебный признак основного. Страница проверена в браузере: она открывается с уведомлением «Кошелёк создан» и списком всех четырёх кошельков. TypeScript PASS; `git diff --check` PASS.

### 2026-10-03 — Нормализация MoneyAccount перед подключением косметологии

- Создана резервная копия до изменения: `backups/finance-pre-moneyaccount-normalization-2026-10-03.dump` (SHA-256 `d182847b76bc83602c2522530757338473310169f7f00aed96e8226315bd72ce`). Аудит подтвердил: у «На Закупкку препаратов» и «На море» не было остатка, ledger-проводок или переводов; у «Доступно семье» не было проводок, но находился производный баланс 1,475.00 UAH.
- Удалена логика, которая пересоздавала технический Wallet «Доступно семье» из журнала Transaction. Его производный остаток перенесён в реальный Wallet «Наличные»; сам технический счёт удалён после проверки отсутствия связей. Существующий результат Transaction не был изменён.
- «На Закупкку препаратов» преобразован в общий `ENVELOPE` «На закупку» и перенесён в направление `COSMETOLOGY`; «На море» преобразован в `ENVELOPE` в направлении `FAMILY`. Резервы обоих остаются 0.00 UAH, не создавая дополнительных денег.
- Добавлены отсутствующие физические Wallet `Monobank` и `PrivatBank` с нулевыми стартовыми остатками; «Наличные» — единственный основной физический Wallet с 1,475.00 UAH. Browser-проверка `/safe` показала 1,475.00 UAH total/free, 0.00 UAH in envelopes и только три физических Wallet. TypeScript PASS; money-account/Safe tests 27/27 PASS; `git diff --check` PASS.

### 2026-10-03 — Действия «Сейфа» перенесены в нижнюю кнопку «Добавить»

- Убрана нижняя карточка «Добавить» с главного экрана `/safe`, чтобы он оставался компактной сводкой денег.
- Центральная кнопка `+` нижней навигации на `/safe` теперь открывает отдельное финансовое меню ровно с четырьмя действиями: `Доход`, `Расход`, `Перевод`, `В конверт`. Доход и расход ведут на соответствующие формы Family; оба действия перемещения открывают форму перевода, где пользователь выбирает кошелёк и, для резервирования, конверт.
- TypeScript PASS; тест Safe UI 3/3 PASS; `git diff --check` PASS.

### 2026-10-03 — Подключение косметологии к общему финансовому ядру

- Добавлена локальная миграция `20261003063638_connect_cosmetology_to_money_accounts`: `Transaction.moneyAccountId` связывает единственную реальную доходную/расходную операцию с активным общим Wallet; `MoneyLedgerEntry.transactionId` связывает изменения Wallet/Envelope с той же Transaction. Prisma migration status: up to date.
- Новая процедура через форму «Провести и сохранить» выбирает общий Wallet (`Наличные`, `Monobank`, `PrivatBank`), создаёт ровно одну `INCOME` Transaction направления `COSMETOLOGY` и категорию «Процедуры», пополняет выбранный Wallet ledger. Сумма «На закупку» создаёт только положительную ledger-запись общего Envelope «На закупку» — не расход и не второй Transaction. Автосписание материалов не восстановлено.
- Экран «Препараты» теперь оформляет новую закупку через выбранные общий Wallet и косметологический Envelope «На закупку». Одна `EXPENSE` Transaction создаёт отрицательные ledger-записи Wallet и Envelope, один `CosmetologyExpense` с `transactionId`, одну складскую партию/историю цены и одно приходное складское движение. Операция не допускается при недостаточном резерве. Старый `CosmetologyWalletMovement` в новых сценариях не записывается.
- Добавлены история резерва `/cosmetology/procurement-reserve` (процедуры/закупки/изменения и текущий остаток) и история препарата `/cosmetology/inventory/[id]` (дата, количество, цена за единицу, поставщик, сумма). Резерв кабинета ведёт на его историю.
- Проверки: TypeScript PASS; focused Cosmetology tests 4/4 PASS; `git diff --check` PASS. Контрольные сценарии не записывались в пользовательскую БД как тестовые финансовые данные; их выполнение остаётся безопасной ручной проверкой после создания настоящей процедуры/закупки.

### 2026-10-03 — Точечная доводка UI косметологии

- Кабинет теперь читает только отображаемую сумму положительных движений общего Envelope «На закупку» за текущий день и показывает «Свободно = Поступило сегодня − На закупку сегодня». Финансовые сущности, операции и складская логика не менялись.
- Форма проведения процедуры получает список активных общих Wallet с сервера вместо статичного списка, показывает динамическое «Свободно» и не даёт отправить резерв больше фактически оплаченной суммы.
- В закупке служебный вариант «Не найден конверт» показывается только при действительном отсутствии Envelope. Экран препарата и список склада ясно обозначают историю закупок и цен.
- Старые UI-переходы из кабинета и косметологического меню на `/finance?module=COSMETOLOGY` заменены на `/analytics?module=COSMETOLOGY`; текст «Касса за день» удален из оставшегося интерфейса аналитики/меню.
- Проверки: TypeScript PASS; focused Cosmetology UI/finance tests 8/8 PASS; `git diff --check` PASS. Browser-проверка не создавала операций: кабинет отображает нулевое реальное резервирование вместо заглушки, а форма закупки содержит только активный Envelope «На закупку».

### 2026-10-03 — Стабильная контрольная точка: «Косметология → Мой кабинет»

- Текущая реализация кабинета зафиксирована как стабильная: проектное меню, мини-календарь, сводка финансов, резерв «На закупку», клиенты, препараты, блок внимания и быстрые ссылки работают поверх уже принятой общей финансовой модели.
- Финансовые правила, которые нельзя обходить в последующих модулях: только `Transaction` является реальным доходом/расходом; Wallet — физическое место денег; Envelope — резерв без второй денежной операции; процедура может создать одну income Transaction и увеличить резерв; закупка создаёт одну expense Transaction и уменьшает тот же резерв. Автосписание материалов по процедуре запрещено.
- Для новых записей не использовать legacy-механизмы `CosmetologyWallet`, `CosmetologyWalletMovement`, локальные CASH/MONO/PRIVAT-балансы, отдельные Goal и старые переходы `/finance?module=COSMETOLOGY`. Они не являются активной моделью нового интерфейса.
- README синхронизирован с этими правилами. В контрольный commit включаются код, Prisma migrations, тесты и документация; локальные rollback-дампы БД и design references остаются вне Git, чтобы не переносить финансовые данные пользователя.
- STOP: можно безопасно переходить к следующему модулю. Не изменять косметологическую финансовую логику без отдельного согласованного задания.

### 2026-10-03 — Разделение «Капитал» и «Сейф»

- Добавлен отдельный read-only маршрут `/capital`. Он показывает только консолидированную финансовую картину: общий капитал/всего денег как сумму остатков активных `WALLET`, резерв как сумму активных `ENVELOPE`, свободно как `Wallet − Envelope`, а также доходы, расходы, результат и результат операций по пяти направлениям за выбранный период. Конверты не прибавляются к капиталу.
- Карточка «Капитал» на Доме ведёт на `/capital`. `/safe` остаётся рабочим экраном денег, а последние операции на нём предпочитают новый `Transaction.moneyAccount` и используют legacy `familyAccount` только как совместимый fallback для старых записей. Конверты — `/money/envelopes`, аналитика — `/analytics`.
- Старый смешанный пользовательский экран `/money` безопасно перенаправляет на `/safe`. Из исходного `ImperiaFinance` удалено представление «Баланс проектов», «Внутренние переводы», входящие/исходящие проектные переводы и «Доступно семье»; сами серверные сервисы `getMoneyWorkspace`, `getInternalTransfer` и механизм реальных Wallet/Envelope-переводов сохранены. Их формы теперь группируют реальные кошельки и конверты, а после перевода возвращают в «Сейф».
- Никакие Wallet, Envelope, Transaction, ledger-проводки и пользовательские финансовые записи при UI-рефакторинге не изменялись. Проверки: TypeScript PASS; focused Capital/Safe/accounts/transfers/core suite 71/71 PASS; browser-проверка: Дом → `/capital`, `/money` → `/safe`.

### 2026-10-03 — Компактный UI «Косметология → Препараты и расходники»

- Главный маршрут `/cosmetology/inventory` больше не содержит трёх больших форм. Он показывает поиск, фильтр категории, кнопки «Добавить позицию» и «Новая закупка» и компактные кликабельные карточки позиций с остатком, единицей, последней закупочной ценой, low-stock отметкой и ссылкой на историю.
- Короткие отдельные экраны: `/cosmetology/inventory/new` — создание позиции; `/cosmetology/inventory/purchase` — закупка с синхронным расчётом «цена за единицу ↔ общая сумма»; `/cosmetology/inventory/[id]/adjust` — ручная корректировка. Если нет ни одной позиции, закупка честно просит сначала создать её.
- Детальная страница препарата теперь показывает остаток, последнюю цену, историю закупок/цен и ручные корректировки. Корректировка сохраняет уже существующую складскую операцию, а её причина и дополнительный комментарий записываются в существующее поле комментария; новой складской или финансовой логики не добавлено.
- Без изменений: Wallet, Envelope, Transaction, резерв «На закупку», одна расходная Transaction при закупке, складские правила и отсутствие автосписания при процедуре. Browser-проверка не создавала записей. TypeScript PASS; focused inventory/cosmetology tests 30/30 PASS; `git diff --check` PASS.

### 2026-10-03 — Закупка: гарантированный пересчёт общей суммы

- В форме новой закупки «Общая сумма» теперь реактивно пересчитывается при каждом изменении количества или цены за единицу, независимо от порядка ввода. Значение округляется до двух знаков после запятой; ввод общей суммы по-прежнему рассчитывает цену за единицу.
- Это UI-расчёт перед отправкой уже существующей формы; финансовая, складская и транзакционная логика не менялись. TypeScript PASS; focused inventory UI/money tests 11/11 PASS; `git diff --check` PASS.

### 2026-10-03 — Компактный неоновый профиль клиента

- Экран `/cosmetology/clients/[id]` переработан только визуально по утверждённому неоновому референсу. Сохранены существующие загрузка клиента, редактирование, история, план, Loyalty/Beauty Bonus Club и маршруты действий; финансовая, клиентская и визитная бизнес-логика не менялись.
- В верхней карточке остались ровно «Позвонить» и «Записать». Убраны неработающий текст «Нет ссылки», дополнительная кнопка «Написать» и повтор заметки. Контакты объединены в компактные поля «Телефон», «Дата рождения», «Соцсети», «Откуда пришёл».
- Блоки «Следующая запись» и «Последний визит» расположены рядом; последний визит выводит только завершённую процедуру. Раздельные «История процедур / Последние визиты» заменены единой карточкой «История посещений». Платежи показывают оплачено всего, средний чек и визиты; заметки открываются как компактная карточка. План и Beauty Bonus Club сохранены.
- Browser-проверка на существующем профиле подтвердила новую иерархию и доступность сохранённых действий без отправки форм или создания данных. TypeScript PASS после очистки только сгенерированного `.next`-кэша; профильный UI-тест 7/7 PASS; `git diff --check` PASS.

### 2026-10-03 — Единый календарь событий

- `/cosmetology/visits` теперь читает существующие `CosmetologyVisit` и реальные `Transaction` (`INCOME`/`EXPENSE`) в одном календаре. Календарь не создаёт собственных сущностей и не дублирует записи или финансы.
- Месячный вид показывает отдельные индикаторы: запись — pink, доход — success/turquoise, расход — orange. Добавлены единый фильтр «Все / Записи / Доходы / Расходы», дневной блок финансовых событий и финансовые строки в списке. Месячная дата открывает день в текущем календарном маршруте.
- Добавлен стандартный маршрут `/safe/new`: он использует активный `MoneyAccount(kind=WALLET)`, создаёт одну `Transaction` и одну связанную ledger-проводку. Он не изменяет модель `Wallet`/`Envelope`/`Transaction`; создан для уже принятой общей финансовой архитектуры вместо legacy `FamilyAccount`-формы. Календарное меню «Что добавить?» ведёт либо к существующей форме записи, либо к этой общей форме дохода/расхода с выбранной датой и возвратом в календарь.
- Проверки: TypeScript PASS; профильные calendar/cosmetology UI тесты 8/8 PASS; `git diff --check` PASS. Browser-проверка календаря подтвердила рендер общего месячного вида и фильтров без создания пользовательских операций.

### 2026-10-03 — Профиль клиента: отдельные окна истории и плана

- «Все процедуры» и «Открыть план» больше не разворачивают содержимое внутри карточки профиля. Нативные `details` отображаются как независимые bottom-sheet окна поверх затемнённого профиля и закрываются нажатием на затемнённую область; это не требует клиентской гидратации и сохраняет работу на мобильном устройстве.
- Окно истории показывает дату, название процедуры, реально сохранённую сумму оплаты и комментарий каждой процедуры. Окно плана содержит табличный список «Дата / Планируем / Ориентировочная цена», кнопку «Создать запись» и существующую форму добавления пункта плана.
- В существующей модели `CosmetologyTreatmentPlanItem` нет поля ориентировочной цены. Поэтому UI честно отображает «Не указана» и не генерирует/не сохраняет вымышленные цены; добавление цены требует отдельного согласования на изменение модели и бизнес-логики.
- Телефон и указанная ссылка на соцсеть остаются прямыми ссылками. Дублирующие нижние CTA из профиля не возвращались. Финансовые, клиентские и визитные данные не изменялись.
- Проверки: TypeScript PASS; `tests/imperia-clients-ui-c.test.ts` 7/7 PASS; `git diff --check` PASS. Browser-проверка подтвердила, что «Все процедуры» открывает отдельное окно без создания данных.

### 2026-10-03 — Календарь: рабочие действия нижней кнопки «Добавить»

- В нижней навигации проекта «Косметология» меню `+ Добавить` теперь содержит три активных маршрута: «Создать запись» ведёт к списку клиентов для выбора клиента, «Доход» и «Расход» ведут на общую форму операции.
- Финансовые формы открываются с предвыбранным направлением `COSMETOLOGY` и после сохранения возвращают пользователя в `/cosmetology/visits`. Это только маршрутизация и значения формы: модель Wallet/Envelope/Transaction и финансовые правила не менялись.
- Browser-проверка календаря подтвердила три ссылки меню с корректными URL. TypeScript PASS; `tests/imperia-calendar-ui-d.test.ts` 5/5 PASS; `git diff --check` PASS.

### 2026-10-03 — Календарь: «Создать запись» открывает форму напрямую

- Действие «Создать запись» в нижнем меню календаря ведёт на `/cosmetology/visits?new=appointment`; календарь сразу открывает существующую форму новой записи, а не список клиентов. В форме доступны выбор клиента, выбор/ручной ввод услуги, ориентировочная сумма, дата, время и создание записи.
- Поле «Ориентировочная сумма» вынесено в постоянную часть формы. Если оно пустое, существующая серверная логика использует базовую цену выбранной услуги; изменений модели, оплат или финансовых операций нет.
- Browser-проверка подтвердила открытие формы с клиентом, услугой, суммой, датой и кнопкой «Создать запись» без отправки формы. TypeScript PASS; `tests/imperia-calendar-ui-d.test.ts` 5/5 PASS; `git diff --check` PASS.

### 2026-10-03 — Новая запись: компактные дополнительные действия

- «Новый клиент» и «Ввести услугу вручную» в форме записи больше не выглядят как отдельные большие поля. Они отображаются как короткие текстовые действия с маленьким `+` и раскрывают дополнительные поля только по нажатию.
- Основные элементы формы — выбор клиента, выбор услуги, ориентировочная сумма, дата, время/длительность, предоплата и создание записи — не менялись. TypeScript PASS; calendar UI tests 5/5 PASS; `git diff --check` PASS.

### 2026-10-03 — Новая запись: упрощённая предоплата

- В форме новой записи раскрываемая «Предоплата» теперь содержит только выбор способа (`Наличные`, `Monobank`, `ПриватБанк`, `Прочее`) и одну сумму. При «Прочее» появляется короткий обязательный комментарий. Сертификаты и Beauty Bonus Club не загружают этот компактный сценарий предоплаты.
- Компонент всё равно отправляет полный совместимый набор полей оплаты с нулями для невыбранных способов; существующая серверная валидация и бизнес-логика оплаты не менялись. Полная форма оплаты в проведении визита остаётся прежней.
- Проверки: TypeScript PASS; payment/calendar contracts 8/8 PASS; `git diff --check` PASS.

### 2026-10-03 — Новая запись: гарантированное закрытие

- Крестик формы новой записи — обычная ссылка на `/cosmetology/visits`, а не обработчик клиентского состояния. Поэтому он надёжно закрывает форму и возвращает к календарю, даже если JavaScript-обработчик на устройстве не выполнился.
- Browser-проверка подтвердила переход с `/cosmetology/visits?new=appointment` на чистый `/cosmetology/visits` и исчезновение формы без создания записи. TypeScript PASS; calendar UI tests 5/5 PASS; `git diff --check` PASS.

### 2026-10-03 — Единый источник календарных меток в кабинете и календаре

- Мини-календарь «Моего кабинета» теперь получает те же `CosmetologyVisit` и реальные `Transaction` (`INCOME`/`EXPENSE`), что и полный маршрут `/cosmetology/visits`. На дату выводятся идентичные типы отметок: запись — розовая, доход — зелёная, расход — оранжевая.
- Дни кабинета по-прежнему ведут в тот же выбранный день полного календаря. Финансовые данные не создаются и не пересчитываются отдельно для UI; используется существующий `getCalendarTransactions`.
- Проверки: TypeScript PASS; cabinet/calendar tests 10/10 PASS; `git diff --check` PASS. Browser-проверка кабинета подтвердила загрузку единых календарных маршрутов без создания записей.

### 2026-10-03 — Настройки: двухуровневая навигация

- На главном экране `/family/settings` детальные пункты больше не занимают место внутри карточек. «Уведомления», «Безопасность» и «Разделы приложения» стали крупными нативными раскрывающимися карточками; касание заголовка открывает соответствующие элементы.
- Внутри сохранены исходные статусы уведомлений, входа по паролю/биометрии и все реальные ссылки на проекты, категории, счета, обязательные платежи, услуги и препараты. Старое тестовое ожидание `/money` заменено на актуальный рабочий маршрут `/safe`.
- Browser-проверка подтвердила: на старте видны только верхние карточки, а «Уведомления» по нажатию раскрывает «Новые клиенты», «Финансовые события», «Напоминания и задачи». TypeScript PASS; settings tests 5/5 PASS; `git diff --check` PASS.

### 2026-10-03 — Доход: обязательный физический кошелёк

- Быстрая форма `/family/new?type=INCOME` больше не показывает радио-кнопки и «Без счёта». Вместо них используется один обязательный выбор «Кошелёк поступления» из активных семейных кошельков (сейчас: ПриватБанк, Монобанк, Наличка).
- `familyOperationSchema` серверно отклоняет доход без `accountId`; отношение в схеме БД остаётся nullable для сохранения старых операций и иных допустимых сценариев расходов. Данные и балансы не менялись.
- Browser-проверка подтвердила селект с тремя реальными кошельками без «Без счёта»; TypeScript PASS; focused family tests 11/11 PASS; `git diff --check` PASS.

### 2026-10-03 — Разделённый чек: компактный расход по частям

- Экран `/family/receipts/new` переведён на тёмные компактные карточки в визуальном стиле IMPERIA. Светлые блоки частей убраны; каждая часть содержит категорию, сумму и необязательный комментарий.
- У разделённого чека теперь обязательный «Кошелёк оплаты». В UI и серверной валидации убран вариант «Без счёта», поэтому расход не может быть создан без реального кошелька. Старые записи и их связи не изменялись.
- Действие добавления третьей и следующих строк переименовано в заметную активную кнопку «+ Добавить часть»; оно добавляет ещё одну часть чека, а не создаёт финансовую операцию. Browser-проверка подтвердила активную кнопку и список ПриватБанк / Монобанк / Наличка; TypeScript PASS; focused family tests 12/12 PASS; `git diff --check` PASS.

### 2026-10-06 — Предпубликационный аудит Railway: STOP до безопасных миграций

- Railway read-only status: сервис FEVORA и PostgreSQL `Online`; последняя доступная FEVORA deployment `b35e7f15-c7f0-4601-9e0d-b5e050a340ca` от 2026-09-17 — `SUCCESS`. Никаких Railway deployment, migration, production-запросов с записью, seed или финансовых операций не выполнялось.
- Локальная версия опережает облачную: 45 tracked файлов изменены, есть новые UI/routes/tests/backups и две новые неразвёрнутые Prisma migration. Их нельзя отправлять в production без отдельного безопасного review.
- Обнаружен блокер: `20261003063638_connect_cosmetology_to_money_accounts` содержит удаление колонок и таблицы `PoultryBreed`; `20261003090000_merge_goals_into_envelopes` содержит `DROP TABLE SavingsMovement`, `DROP TABLE SavingsGoal`, `DROP TYPE SavingsGoalStatus`. Эти операции не соответствуют правилу сохранения реальных пользовательских данных и не будут применены автоматически.
- Следующий безопасный шаг: составить replacement migration plan, который сохранит/перенесёт валидные данные и не содержит destructive SQL; затем создать свежий production backup, прогнать полный build/test gate и только после отдельного review выполнять deploy. Dirty worktree сохранён без очистки.

### 2026-10-06 — Безопасная подготовка cloud release: готово, STOP перед backup/deploy

- По явному разрешению владельца две неразвёрнутые migration переписаны как additive-only: `20261003063638_connect_cosmetology_to_money_accounts` добавляет только nullable связи `Transaction.moneyAccountId` и `MoneyLedgerEntry.transactionId` с индексами/FK; `20261003090000_merge_goals_into_envelopes` добавляет только `MoneyAccount.icon` и `categoryId` с индексом/FK.
- Удаление `SavingsGoal`, `SavingsMovement`, `SavingsGoalStatus`, `PoultryBreed`, полей птицеводства и любых существующих данных удалено из migration. Legacy-цели/движения намеренно остаются в базе до отдельного аудита и подтверждённого плана переноса. Local audit backup выявил две спорные одинаковые legacy-цели «На море» с одинаковыми тестовыми движениями — их не переносили и не удаляли автоматически.
- Добавлен migration safety-contract в `tests/money-transfers.test.ts`: он запрещает `DROP TABLE/COLUMN/TYPE`, `DELETE` и `TRUNCATE` в новых migration. Обновлено устаревшее Home test expectation с прежних маршрутов на текущие `/capital`, `/money/envelopes` и `/analytics`.
- Проверки: `prisma validate` PASS; TypeScript PASS; focused money/cosmetology/family tests 45/45 PASS; полный Vitest suite 42 files / 363 tests PASS; production build PASS; `git diff --check` PASS. Mock-loyalty tests печатают ожидаемые transport diagnostics, без внешних production-вызовов.
- Railway/production не изменялись: backup, migration, deploy, seed, financial writes, loyalty payment/redemption не выполнялись. STOP: владелец должен создать fresh native backup в Railway (`Postgres → Backups → Create Backup`) и подтвердить его готовность. После этого — read-only preflight, deploy, проверка migration/health и сверка сохранности данных. Dirty worktree по-прежнему не очищен и не закоммичен.

### 2026-10-06 — Fresh local production backup перед публикацией

- Native Railway backup/PITR недоступен на текущем тарифе: вкладка `Postgres → Backups` показывает, что создание новых backup доступно только на Pro; существующий `Pre-Security-Patch Backup` создан около месяца назад и не может быть контрольной точкой для текущего релиза.
- По явному разрешению владельца создан свежий логический SQL-дамп текущей production-базы прямо внутри сервиса Railway Postgres: `backups/railway-production-2026-10-06T221300EEST.dump`. Он содержит только данные и структуру базы, не печатает в консоль строку подключения, пароль или пользовательские записи. Права файла ограничены владельцем.
- Контроль целостности: размер `254164` bytes, timestamp `2026-10-06 22:15:56 EEST`, SHA-256 `73b9bc6e29c74af34d1e8fac812208fb30fcbe6deadb210162b78ea888c3445d`; в дампе присутствует завершающий маркер `PostgreSQL database dump complete`.
- Это переносимый текстовый SQL-дамп (не native Railway snapshot): для восстановления нужен PostgreSQL client/контейнер и явное подтверждение владельца. Production не менялся: migration, deploy, seed, финансовые writes и loyalty payment/redemption не выполнялись.

### 2026-10-06 — Cloud release: FEVORA UI and safe finance release

- По явному разрешению владельца опубликован проверенный локальный код в Railway **только** для production-сервиса `FEVORA`; сервис Postgres вручную не менялся. Deployment: `7aad8ff1-a736-4870-9726-c0f00a6a127f`, status `SUCCESS`.
- Перед публикацией: `prisma validate` PASS; полный Vitest suite `42 files / 363 tests` PASS; production `npm run build` PASS; `git diff --check` PASS. Тестовые loyalty diagnostics ожидаемы и не выполняли production-вызовы.
- Railway применил ровно две подготовленные additive-only migration: `20261003063638_connect_cosmetology_to_money_accounts` и `20261003090000_merge_goals_into_envelopes`; logs подтверждают `All migrations have been successfully applied`. Destructive SQL, seed и автоматические финансовые записи не запускались.
- Post-deploy health check `https://fevora-production.up.railway.app/api/health` вернул `200`. Локальные пользовательские записи намеренно не импортировались: cloud release переносит код/UI, а не содержимое локальной БД. Локальный production dump остаётся контрольной точкой для отдельной, явно согласованной миграции данных при необходимости.

### 2026-10-06 — Cloud login: email/password вместо local PIN

- Обнаружено: production-страница `/login` оставалась на legacy local PIN-форме, хотя `authenticateLocalPin` намеренно запрещён при `NODE_ENV=production`. Из-за этого в облачной FEVORA нельзя было войти через корректный механизм авторизации.
- Исправлены только `src/app/login/page.tsx`, `src/app/login/login-form.tsx` и `src/app/login/actions.ts`: production показывает email/password и необязательное имя для первого владельца; server action вызывает уже существующий `authenticateOwner`. Локальная dev-версия сохраняет шестизначный PIN и прежнее поведение.
- Проверено без раскрытия значений: в Railway присутствуют `AUTH_SECRET`, `OWNER_EMAIL`, `OWNER_PASSWORD`. Полный Vitest suite `42 files / 363 tests` PASS; production build PASS; `git diff --check` PASS. Вход пользователя, создание профиля и любые финансовые записи не выполнялись во время проверки.
- Исправление опубликовано в Railway service `FEVORA`: deployment `140febe7-73b5-412f-893f-9b06d4c0ee`, status `SUCCESS`. Post-deploy проверка `/login` подтверждает поля `Email` и `Пароль`; `/api/health` вернул `200`.

### 2026-10-10 — Финансовые категории: отдельные мобильные экраны

- По запросу владельца управление категориями вынесено из плотного списка и встроенных форм в отдельный IMPERIA flow. `/family/categories` теперь показывает только крупный список и действие «Добавить»; создание открывается на `/family/categories/new`, а касание категории открывает отдельный экран `/family/categories/[id]` для изменения или удаления.
- Добавлен переиспользуемый `FamilyCategoryForm`. Он отправляет прежние `createFamilyCategoryAction`, `updateFamilyCategoryAction` и `deleteFamilyCategoryAction`; серверные actions, валидация, модель `Category`, финансовые операции, Wallet, Envelope и Transaction не изменялись. Системная категория открывается честно как read-only.
- Изменены только presentation/routes/tests: `src/app/(private)/family/categories/page.tsx`, новые страницы `new` и `[id]`, `src/components/family-category-form.tsx`, scoped-стили в `src/app/imperia-design-system.css` и `tests/imperia-settings-ui-g.test.ts`.
- Проверки: TypeScript PASS; `tests/imperia-settings-ui-g.test.ts` 6/6 PASS; `git diff --check` PASS; production build PASS, маршруты `/family/categories`, `/family/categories/new` и `/family/categories/[id]` присутствуют в build output.
- Railway, production, migrations, seed и пользовательские данные не менялись; deploy не выполнялся. Следующий безопасный шаг: открыть локально Settings → Financial Categories и проверить удобство на телефоне; публиковать в Railway только по отдельному разрешению владельца.

### 2026-10-10 — Настройки: «Разделы приложения» вынесены из раскрывающейся карточки

- Владелец уточнил, что отдельным окном должен быть весь список разделов, а не только форма финансовой категории. `Разделы приложения` на `/family/settings` теперь является большой ссылкой на новый маршрут `/family/settings/sections`, а не нативным раскрывающимся `<details>` со сжатым списком.
- Новый маршрут показывает крупные touch-friendly строки: Проекты, Финансовые категории, Счета и способы оплаты, Обязательные платежи, Услуги, Препараты и расходники. Каждая строка сохраняет прежний рабочий маршрут; модели, server actions и данные не изменены.
- Проверки после уточнения: TypeScript PASS; `tests/imperia-settings-ui-g.test.ts` 6/6 PASS; `git diff --check` PASS; production build PASS, включая маршрут `/family/settings/sections`.
- Railway/production, migrations, seed и пользовательские данные не изменялись; deploy не выполнялся. Следующий безопасный шаг: владелец проверяет локально Settings → Разделы приложения. Публикация требует отдельного разрешения.

### 2026-10-10 — Настройки: отдельные экраны уведомлений и безопасности

- По следующему уточнению владельца «Уведомления» и «Безопасность» также перестали разворачиваться внутри длинного экрана `/family/settings`. Обе карточки теперь ведут на отдельные мобильные маршруты: `/family/settings/notifications` и `/family/settings/security`.
- На экранах крупно показаны только реальные текущие статусы: новые клиенты, финансовые события, напоминания/задачи остаются честно «Не настроено»; пароль «Активен», биометрический вход «Не подключён». Неработающих переключателей или выдуманных настроек не добавлено.
- Проверки: TypeScript PASS; `tests/imperia-settings-ui-g.test.ts` 6/6 PASS; `git diff --check` PASS; production build PASS, новые маршруты присутствуют в build output.
- Railway/production, migrations, seed и пользовательские данные не изменялись; deploy не выполнялся. Следующий безопасный шаг: владелец проверяет локальные отдельные экраны. Публикация требует отдельного разрешения.

### 2026-10-10 — «Сейф»: история операций удалена из главной сводки

- По уточнению владельца блок «Последние операции» удалён из `/safe`. «Сейф» оставлен исключительно экраном текущего состояния денег: Сегодня (пришло/ушло/итог), физические Wallet и распределение Всего/В конвертах/Свободно.
- `ImperiaSafe` больше не принимает и не рендерит recent transactions; данные и серверный финансовый сервис не менялись. История движения остаётся в специально предназначенных разделах аналитики и кассы.
- Проверки: TypeScript PASS; `tests/imperia-safe-ui-h.test.ts` 3/3 PASS; `git diff --check` PASS.
- Railway/production, migrations, seed и пользовательские данные не изменялись; deploy не выполнялся. Следующий безопасный шаг: владелец проверяет компактный `/safe` локально. Публикация требует отдельного разрешения.

### 2026-10-10 — Счета: возврат в «Разделы приложения»

- Исправлена навигация `/family/accounts`: верхняя ссылка была ошибочно задана как «← Дом», хотя экран открывается через Settings → Разделы приложения. Теперь она ведёт на `/family/settings/sections` и подписана «← Разделы приложения».
- После создания/изменения счёта существующие server action redirects сохраняют пользователя на `/family/accounts`; возврат по верхней ссылке ведёт в правильный launcher, не на Дом. Финансовая модель, счета и данные не менялись.
- Проверки: TypeScript PASS; `tests/imperia-settings-ui-g.test.ts` 7/7 PASS; `git diff --check` PASS. Railway/production, migrations, seed и пользовательские данные не изменялись; deploy не выполнялся.

### 2026-10-10 — Единая навигация возврата из разделов приложения

- Проведён аудит всех шести верхнеуровневых экранов, которые открываются через Settings → «Разделы приложения»: Проекты, Финансовые категории, Счета и способы оплаты, Обязательные платежи, Услуги, Препараты и расходники.
- Верхняя ссылка каждого из этих экранов теперь возвращает на `/family/settings/sections`. Ранее «Категории» вели в настройки, «Обязательные платежи» — на Дом, «Услуги» и «Препараты» — в Кабинет, а у «Проектов» не было явной ссылки возврата.
- Вложенные формы и карточки остаются с локальным возвратом к своему списку: это сохраняет понятную цепочку «форма → раздел → Разделы приложения» и не меняет сохранение данных.
- Изменена только навигация/стили и профильный UI-contract. Проверки: TypeScript PASS; `tests/imperia-settings-ui-g.test.ts` 8/8 PASS; `git diff --check` PASS. Railway/production, migrations, seed и пользовательские данные не менялись; deploy не выполнялся.

### 2026-10-10 — Настройки: отдельное управление кошельками и конвертами

- Убрана ошибочная нижняя ссылка «Кошельки и конверты» из блока системных настроек: она вела на рабочий `/safe`, хотя пользователю нужен экран настройки, а не сводка денег. В Settings → «Разделы приложения» добавлен самостоятельный пункт «Кошельки и конверты».
- Новый маршрут `/family/settings/money` раздельно показывает активные физические Wallet и Envelope-резервы, позволяет открыть настройки каждой записи и начать создание кошелька либо конверта. Это использует существующие MoneyAccount и actions; Wallet/Envelope/Transaction, остатки и финансовые правила не менялись.
- Для входа из этого маршрута добавлен строго ограниченный внутренний `returnTo`: создание, редактирование, архивирование и допустимое удаление возвращаются обратно к настройкам кошельков/конвертов, а не в «Сейф». Другие сценарии сохраняют прежние redirects.
- «Системные настройки» больше не ведут на legacy `/settings`. Новый `/family/settings/profile` показывает текущие системные данные в стиле IMPERIA и имеет явный возврат в `/family/settings`.
- Проверки: TypeScript PASS; `tests/imperia-settings-ui-g.test.ts` 9/9 PASS; `git diff --check` PASS. Railway/production, migrations, seed и пользовательские данные не менялись; deploy не выполнялся.

### 2026-10-10 — Профиль и система: безопасное редактирование предпочтений

- По подтверждению владельца экран `/family/settings/profile` получил компактную форму «Изменить профиль»: имя, часовой пояс (Киев/Варшава/Лондон/UTC) и основная валюта (UAH/USD/EUR).
- Email остаётся только для просмотра: изменение email связано с авторизацией и требует отдельного security-flow. Стартовый остаток не редактируется, чтобы не искажать финансовую историю.
- Новая server action валидирует только три разрешённые preference-поля и обновляет только запись `User`. Смена основной валюты честно не конвертирует и не меняет существующие операции, Wallet, Envelope или их остатки.
- Проверки: TypeScript PASS; `tests/imperia-settings-ui-g.test.ts` 10/10 PASS; `git diff --check` PASS. Railway/production, migrations, seed и пользовательские данные не менялись; deploy не выполнялся.

### 2026-10-10 — PWA: IMPERIA-иконка, современный старт и iPad

- PWA manifest обновлён для текущего бренда: название `FEVORA IMPERIA`, тёмные background/theme colors, старт `/family`, ориентация `any` и существующие фирменные crown icons с version query `v=2`. Старый дом с листом больше не указан как PWA-иконка.
- Legacy `/` теперь открывает `/family`; `/dashboard` и `/settings` сохранены только как compatibility redirects к `/family` и `/family/settings`. Это убирает старый светлый Home/Settings из нормального пользовательского входа, не удаляя маршруты и не меняя данные.
- Для touch-устройств с большим экраном добавлен отдельный iPad shell: в portrait и landscape скрыта desktop sidebar, сохранена удобная нижняя навигация и увеличены touch targets. Manifest больше не блокирует горизонтальный режим.
- Проверки: TypeScript PASS; PWA/mobile/settings tests 14/14 PASS; production `npm run build` PASS; `git diff --check` PASS. Railway/production, migrations, seed и пользовательские данные не менялись; deploy не выполнялся.

### 2026-10-10 — Railway production: полный пользовательский reset для чистого старта

- По явному подтверждению владельца «Очистить всё» создана свежая логическая SQL-копия production Postgres до сброса: `backups/railway-production-2026-10-10T225100EEST-before-full-reset.sql`, размер `247807` bytes, SHA-256 `74918375b27d99d67ee9708c3aef9acabf45f23911869e606983c6efb215d05a`. В дампе подтверждён финальный маркер PostgreSQL.
- После backup очищены все public пользовательские таблицы через `TRUNCATE … RESTART IDENTITY CASCADE`. Сохранены только `User` (одна учётная запись для входа) и `_prisma_migrations` (26 технических миграций), чтобы облачная FEVORA оставалась доступной и схема БД не изменялась.
- Post-reset SQL verification проверила `count(*) = 0` для каждой очищаемой таблицы; `https://fevora-production.up.railway.app/api/health` вернул `{"status":"ok"}`. Это удаляет старые суммы, операции, кошельки, конверты, клиентов, визиты, препараты и прочие пользовательские данные production.
- Новый локальный IMPERIA/PWA UI в этот момент не публиковался; production продолжает исполнять deployment `140febe7-73b5-412f-893f-9b06d4c0ee` до отдельной явной команды на deploy.

### 2026-10-11 — Production: создана и подключена клиентка Beauty Bonus Club

- По явному поручению владельца через штатный authenticated UI создана карточка клиента Людмилы Красиковой; источник указан как Instagram.
- Карточка успешно связана с существующим клиентом Beauty Bonus Club через `loyaltyClientId = 72`. После подключения FEVORA показала актуальный профиль: доступно `138` бонусов, уровень `Bronze`, начисление `1%`, рефералов `0`.
- Новая регистрация в Beauty Bonus Club не создавалась. Визит, Payment, PaymentComponent, Income, loyalty delivery, bonus redemption или bonus transaction не создавались; флаги реальных начислений/списаний не менялись.
- Следующий безопасный шаг: создать только реальный/разрешённый визит и не проводить первое списание бонусов без отдельного явного поручения владельца.

### 2026-10-11 — Production: дедупликация Beauty Bonus Club и импорт в FEVORA

- По явному подтверждению владельца перед изменениями созданы две локальные контрольные копии с правами только для владельца: `backups/beauty-bonus-club-pre-dedupe-20261010T215410Z.json.gz` (SHA-256 `1bb4df2eb339547c85a5714955fc8672a4080388d0424080f2a0482d06b11296`) и `backups/fevora-pre-loyalty-import-20261010T2200Z.sql` (SHA-256 `486ee6c5e933b353ba8ed1082a9be584ef07521c02572a45ef5af6aa09678277`).
- В production Beauty Bonus Club удалена ровно 21 подтверждённая дублирующая/тестовая карточка с ID: `1, 5, 40, 48, 58, 63, 70, 78, 80, 84, 88, 92, 95, 97, 98, 99, 103, 106, 107, 108, 111`. Каскадно удалены 25 связанных bonus transactions и 3 payments; bonus redemptions не было. После операции осталось 87 клиентов, 138 bonus transactions и 30 payments; дубликатов по нормализованному телефону — 0. Детальный audit: `backups/beauty-bonus-club-dedupe-audit-20261010T215410Z.json`.
- Все 87 оставшихся клиентов импортированы/связаны с production FEVORA: карточка Людмилы Красиковой (`loyaltyClientId = 72`) сохранена и обновлена, ещё 86 карточек созданы. Итог: 87 активных клиентов и 87 уникальных `loyaltyClientId`.
- Транзакционная проверка FEVORA до/после подтвердила: визиты `0 → 0`, оплаты `0 → 0`, финансовые Transaction `0 → 0`. Начисления, списания бонусов, PaymentComponent, касса и feature flags не изменялись. UI-проверка карточки Людмилы Красиковой показывает подключение к Beauty Bonus Club и доступный баланс 138 бонусов.

### 2026-10-11 — Экран входа приведён к интерфейсу IMPERIA

- `/login` визуально перестроен в текущей тёмной neon-glass системе IMPERIA: фирменная crown PWA-иконка, бренд и слоган, адаптивная двухколоночная композиция на широком экране и компактная карточка на телефоне.
- Production-механизм авторизации не менялся: сохранены `email`, `password`, необязательное `name` для первого входа, `authenticateOwner` и redirect на `/family`. Поле имени помещено в раскрываемый блок «Первый вход? Укажите имя». Локальный шестизначный PIN и `authenticateLocalPin` также сохранены.
- Добавлен `tests/imperia-login-ui.test.ts`. Проверки: TypeScript PASS; login/PWA tests 6/6 PASS; production build PASS; scoped `git diff --check` PASS.
- Browser-проверка локальной dev-формы: 390×844 и 1440×1000 без horizontal/vertical overflow; на мобильном карточка 354 px внутри viewport 390 px, на desktop intro и форма располагаются в двух колонках.
- Railway/production, база данных, миграции, secrets, пользовательские записи и loyalty-флаги не менялись; deploy не выполнялся. STOP: публикация нового login и накопленного локального UI в Railway требует отдельного явного разрешения владельца.

### 2026-10-11 — Railway production: опубликован IMPERIA login и согласованный UI

- По явному разрешению владельца текущий проверенный локальный интерфейс вместе с новым `/login` опубликован в Railway service `FEVORA`. Deployment `643b4e64-cd45-4ad3-a320-c2124f46692b` завершён со статусом `SUCCESS`; image digest `sha256:09cd2ada72ed9c946977e5ba19eb2cfd050a940c884f888930133aa850f462d6`.
- Перед upload ссылки трёх IMPERIA headers переведены с отсутствующего legacy-файла на действующую `/icons/fevora-crown-512.png`; отсутствующая картинка preset `income-clients` безопасно использует существующую визуально близкую `income-community.png`, поэтому production не получает 404 для текущих UI assets.
- Локальные dumps и audit-файлы исключены из Railway/Docker context через `backups/` в `.gitignore` и `.dockerignore`; резервные копии и пользовательские данные в build archive не отправлялись.
- Локальные gates: TypeScript PASS; login/PWA/client UI tests 13/13 PASS; production build PASS; `git diff --check` PASS. Railway build: Next.js compile/typecheck/static generation PASS.
- Startup нашёл 26 migrations и сообщил `No pending migrations to apply`; seed не запускался. Public `/api/health` вернул HTTP 200 `{"status":"ok"}`.
- Production browser verification `/login`: email/password и first-entry disclosure присутствуют, logo загружен; 390×844 имеет `clientWidth=scrollWidth=390`, карточка 354 px, `scrollHeight=clientHeight=844`; console errors/warnings 0.
- Database schema/data, payments, bonus transactions/redemptions и loyalty feature flags не изменялись. STOP: интерфейс опубликован и доступен; первый реальный loyalty payment/redemption всё ещё требует отдельного явного поручения.

### 2026-10-11 — Конверт: фактическая сумма и динамический прогресс готовы локально

- По обратной связи владельца экран `/money/[id]` для Envelope дополнен фактическим остатком: «Уже в конверте», целью, остатком до цели, процентом и визуальной полосой прогресса. При отсутствии цели экран честно предлагает указать её в настройках.
- Добавлен короткий блок «Добавить деньги в конверт»: пользователь выбирает активный Wallet той же валюты и вводит уже имеющуюся сумму. Операция использует существующий `createInternalAllocation`; это резервирование, а не новый Income/Expense и не создание денег.
- Dropdown показывает только Wallet с положительной свободной суммой. `getMoneyTransferWorkspace` теперь рассчитывает `availableBalanceMinor` как физический balance минус уже активные allocations из этого Wallet в Envelope; server-side проверка недостатка средств и idempotency сохранены.
- После пополнения revalidate охватывает `/money/[id]`, `/money/envelopes`, `/safe`, `/capital`, `/family` и другие существующие финансовые поверхности, поэтому прогресс обновляется на главной и в списке конвертов.
- Локальная read-only browser-проверка существующего конверта «На море» подтвердила новый остаток, форму пополнения и фильтрацию источников; финансовая форма не отправлялась и данные не менялись.
- Проверки: TypeScript PASS; focused envelope/money/home/settings tests 49/49 PASS; production build PASS; scoped `git diff --check` PASS. Один отдельно запущенный старый `imperia-finance-ui-f` contract остаётся красным из-за уже существующего устаревшего ожидания удалённого блока recent transactions в Safe и не относится к этой задаче.
- Railway/production, schema, migrations и пользовательские деньги не менялись; deploy не выполнялся. STOP: публикация этого улучшения в Railway требует отдельного явного подтверждения владельца.

### 2026-10-11 — Календарь: мобильное создание записи исправлено локально

- По обратной связи владельца временная сетка дня и недели стала интерактивной: касание свободного часа открывает «Новую запись» с уже выбранными датой и временем. Существующие карточки визитов остаются поверх слотов и ведут в прежнюю карточку визита.
- Недельная сетка теперь ограничена шириной календарной карточки и прокручивается горизонтально только внутри неё; корневая страница больше не расширяется из-за фиксированной ширины семи колонок. На мобильной проверке `documentElement.scrollWidth = clientWidth`, а внутренний week scroller имеет собственный больший `scrollWidth`.
- Нативный длинный `select` клиента заменён на touch-friendly поиск по имени или цифрам телефона с явным выбором найденной карточки. Возможность раскрыть «Новый клиент» и создать его вместе с записью сохранена.
- Нижний центральный «плюс» в косметологии переведён с нативного `<details>` на управляемую action sheet. Переход `?new=appointment` теперь повторно открывает форму без перезагрузки, а закрытие формы очищает query-параметр, поэтому следующий тап снова работает.
- Локальная browser-проверка: тап по 11:00 открыл форму со значениями `2026-10-11` и `11:00`; нижний плюс показал «Создать запись / Расход кабинета / Новый клиент / Доход»; отправка формы не выполнялась и данные не менялись. Focused calendar/envelope tests 9/9 PASS; production build PASS.
- Railway/production, база данных, записи клиентов/визитов и loyalty не менялись; deploy не выполнялся. Накопленные локальные изменения календаря и конверта публиковать только по отдельному явному разрешению владельца.

### 2026-10-11 — GitHub и Railway: опубликованы календарь и прогресс конвертов

- По явному поручению владельца полная проверенная рабочая версия IMPERIA отправлена в GitHub `vseregi2024-blip/FEVORA`, branch `main`, application commit `49576f81b9931d44b4618dff0660c5bde852dadf`. Вместе с сегодняшними календарём и конвертами GitHub догнан до ранее согласованного и уже частично опубликованного IMPERIA UI.
- Перед публикацией полный Vitest suite исправлен от трёх устаревших UI-contract ожиданий и прошёл: `45 files / 378 tests` PASS. Production `npm run build` PASS; `git diff --check` PASS. `.env`, `backups/` и старая локальная копия `src/app/(private)/family/accounts/page 2.tsx` исключены из Git/Railway context.
- Railway service `FEVORA` deployment `a274d623-b94c-40d9-999c-a02f92202352` завершён со статусом `SUCCESS`; image digest `sha256:71702ca0143c3489d68c69f3384a8a6b4c887fd497886b7dd72fbe4fb814ba32`. Public `/api/health` вернул HTTP 200 `{"status":"ok"}`.
- Production read-only browser verification: день календаря показывает активные часовые слоты; нажатие 11:00 открыло форму с датой `2026-10-11` и временем `11:00`; форма не отправлялась. Конверт «На отдых» показывает «Уже в конверте», цель, 0%, остаток до цели и рабочий блок выбора Wallet/суммы; пополнение не отправлялось.
- Production data, визиты, финансовые операции, бонусы и loyalty feature flags во время deployment verification не менялись.
