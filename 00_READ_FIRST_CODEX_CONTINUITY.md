# FEVORA + Beauty Bonus Club — CODEX CONTINUITY / READ FIRST

## CURRENT STATUS

**FUNCTIONAL CORE STABLE.**
**NEXT PHASE: UI/UX REDESIGN.**
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
