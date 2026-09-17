# FEVORA IMPERIA — F3 Completion Report

Дата завершения: 11.09.2026
Статус: **F3 COMPLETE**
Граница этапа: реальный production `POST /api/v1/payments` **НЕ выполнялся**; реальные бонусы **НЕ начислялись**.

## 1. Production backup

Перед применением migration создан полный SQL backup production PostgreSQL:

- файл: `/private/tmp/fevora-backups/fevora-production-pre-f3-20260911-v2.dump`;
- размер: 227 KB;
- SHA-256: `15fc19c441faa4afa9d4237a0f54a45263e52a2b458ebca4f8d2ac910fc5b18f`;
- права файла: `600`;
- дамп проверен: присутствуют схема и данные, в конце есть штатная отметка завершения `pg_dump`.

Первая локальная попытка дампа через недоступный внутренний адрес Railway создала пустой файл `fevora-production-pre-f3-20260911.dump`. Он не считается backup и не использовался. Рабочим backup является только файл с суффиксом `-v2`.

## 2. Migration

Добавлена и применена migration:

`prisma/migrations/20260911073500_add_cosmetology_loyalty_delivery/migration.sql`

Migration строго additive:

- добавляет enum `CosmetologyLoyaltyDeliveryStatus`;
- добавляет таблицу `CosmetologyLoyaltyDelivery`;
- добавляет индексы, два DB-level UNIQUE ограничения и внешний ключ;
- не содержит `DROP`, `TRUNCATE`, `UPDATE`, `DELETE`, backfill или создания delivery-записей для старых процедур;
- `db reset` и `db push` не использовались.

Перед production migration все 21 migration были успешно проверены на чистой временной PostgreSQL 18. После production deploy Railway/Prisma применил только новую migration; запуск завершён успешно.

## 3. Структура CosmetologyLoyaltyDelivery

Таблица содержит:

| Поле | Назначение |
|---|---|
| `id` | внутренний ID delivery |
| `visitId` | связь с `CosmetologyVisit`, DB-level UNIQUE |
| `externalEventId` | стабильный ключ события, DB-level UNIQUE |
| `loyaltyClientId` | зафиксированный ID клиента Beauty Bonus Club |
| `amount` | зафиксированная фактически оплаченная сумма, `Decimal(18,2)` |
| `currency` | зафиксированная валюта, `Char(3)` |
| `status` | `NOT_SENT`, `SENDING`, `SENT`, `FAILED` |
| `attemptCount` | число фактических попыток отправки |
| `lastAttemptAt` | время последней попытки |
| `lastErrorCode` | безопасный код последней ошибки |
| `remotePaymentId` | ID платежа Bot Client |
| `sentAt` | время подтверждённой доставки |
| `createdAt`, `updatedAt` | служебные даты |

После migration в production: `CosmetologyLoyaltyDelivery = 0` строк. Для трёх существующих `CosmetologyVisit` delivery-записи автоматически не создавались.

## 4. Условия создания delivery

Новая запись создаётся только при завершении подходящей процедуры:

- статус процедуры `COMPLETED`;
- процедура не удалена;
- клиент уже связан с Beauty Bonus Club;
- `loyaltyClientId` является корректным положительным числовым ID;
- сумма больше нуля;
- процедура полностью оплачена;
- валюта `UAH`.

Снимок `loyaltyClientId`, `amount` и `currency` сохраняется отдельно от финансовой операции FEVORA. Предоплата, незавершённая или не полностью оплаченная процедура, нулевая сумма и несвязанный клиент delivery не создают. Само создание delivery не отправляет HTTP-запрос.

## 5. Idempotency

Для каждой процедуры используется неизменяемый ключ:

`fevora:appointment:<visitId>:final`

Он сохраняется в `externalEventId`, защищён DB-level UNIQUE и повторно используется при retry. Также DB-level UNIQUE установлен на `visitId`. `incomeTransactionId` как delivery state не используется.

Один завершённый визит формирует одно финальное loyalty-событие. При нескольких услугах фактически оплаченная сумма распределяется между строками услуг пропорционально с детерминированным округлением; сумма строк точно равна итоговой сумме события. Себестоимость, прибыль и локальный бонусный процент в payload не передаются.

## 6. Защита от параллельной отправки

Перед вызовом Bot Client выполняется атомарный DB claim через `updateMany`:

- допустим исходный статус `NOT_SENT` или `FAILED`;
- устаревший `SENDING` можно забрать только после двухминутного lease;
- claim переводит запись в `SENDING`, увеличивает `attemptCount` и фиксирует `lastAttemptAt`;
- если обновлена не ровно одна строка, второй параллельный запрос не отправляется.

Перед claim повторно проверяются пользователь, актуальное состояние процедуры, привязка клиента, сумма, валюта и сохранённый `externalEventId`.

## 7. Отправка, ответы и retry

Server-side интеграция отправляет payload только на Bot Client `/api/v1/payments`. Secret читается только на сервере и не включается во frontend bundle или UI.

Поведение:

- обычный успешный ответ: `SENT`, сохраняются `remotePaymentId`, `sentAt`, `lastErrorCode = null`;
- `already_processed`: считается успешной идемпотентной доставкой и также переводится в `SENT`;
- timeout, network error, HTTP 5xx и 429: `FAILED`, сохранён безопасный код ошибки; возможен только ручной retry;
- HTTP 409: `FAILED`, код конфликта отображается явно, автоматический и ручной retry из UI не предлагается;
- HTTP 401/404/validation error: безопасная явная ошибка без автоматического retry.

Автоматического retry нет. При ручной повторной отправке используется тот же `externalEventId`.

## 8. Production safety switch

Добавлен серверный флаг:

`BOT_CLIENT_PAYMENTS_ENABLED=false`

Отправка разрешается только при точном значении `true`. В production переменная отсутствует или выключена, поэтому delivery прекращается до чтения/claim записи и до любого внешнего HTTP-вызова. Это дополнительная блокировка перед первым реальным payment.

## 9. UI

В карточку процедуры добавлен блок состояния Beauty Bonus Club:

- клиент не подключён;
- процедура ещё не готова или оплачена частично;
- старая процедура без delivery;
- `NOT_SENT` — готово к отправке;
- `SENDING` — отправляется;
- `SENT` — отправлено;
- `FAILED` — безопасное описание ошибки и разрешённый ручной retry, кроме конфликта 409.

При выключенном production-флаге кнопки отправки и retry скрыты, показывается предупреждение об отключённой передаче.

После deploy production-карточка клиента открылась и корректно показала данные Beauty Bonus Club: баланс `100`, уровень `Bronze`, начисление `1%`, рефералы `0`. При переходе на отдельную карточку процедуры текущая браузерная сессия была перенаправлена на страницу входа; учётные данные не вводились и никакие формы не отправлялись. Наличие всех UI-состояний и запрет кнопок при выключенном флаге проверены contract-тестами и успешной production-сборкой.

## 10. Tests и проверки сборки

Результат полного набора тестов:

- 20 test files;
- **251/251 tests passed**.

F3-тесты покрывают:

- обычный success;
- `already_processed`;
- HTTP 409, 401, 404, 429, 500, 503;
- timeout/network failure;
- параллельный claim;
- выключенный production-флаг;
- стабильный `externalEventId` при retry;
- фактически оплаченную сумму с учётом скидки;
- несколько услуг и точную сумму service lines;
- отсутствие финансовых полей в payload;
- структуру schema/migration и UI-контракт.

Проверки:

- lint: успешно, 0 ошибок; остаются 3 ранее существовавших предупреждения Next.js по `<img>` в family-компонентах;
- typecheck: успешно;
- tests: успешно, 251/251;
- build: успешно.

Typecheck и build выполнены в чистом Node.js 22 Docker-окружении, соответствующем production-сборке Railway.

## 11. Deployment и health check

- Railway deployment ID: `c870ab18-f0d5-46ac-8a7e-81866d29ac8a`;
- deployment status: `SUCCESS`;
- production build/typecheck: успешно;
- startup: все 21 migration обнаружены, новая migration применена успешно, приложение запущено;
- health check: `GET https://fevora-production.up.railway.app/api/health` → HTTP `200`.

## 12. Контроль финансовых данных

Снимок до migration/deploy и после него совпадает:

| Данные | До | После |
|---|---:|---:|
| Transactions | 87 / -47 622,00 | 87 / -47 622,00 |
| MoneyAccount | 0 / 0,00 | 0 / 0,00 |
| MoneyLedger | 0 / 0,00 | 0 / 0,00 |
| Envelope | 0 / 0,00 | 0 / 0,00 |
| InternalTransfer | 0 | 0 |
| CosmetologyVisit | 3 | 3 |
| CosmetologyLoyaltyDelivery | — | 0 |

Существующие финансовые операции, кошельки, конверты, внутренние переводы и общий капитал migration не изменили.

## 13. Источник истины

В FEVORA не создавались локальные `bonus_balance`, `bonus_transactions` или loyalty level. Beauty Bonus Club остаётся единственным источником истины для баланса, истории бонусов, уровня и процента.

## 14. Финальная граница

**Реальный production `POST /api/v1/payments` НЕ выполнялся.**
**Реальные бонусы НЕ начислялись и НЕ списывались.**
**Записи Bot Client `payments`, `bonus_transactions` и referral не изменялись.**

F3 завершён. Работа остановлена перед первым реальным production payment. Следующий шаг возможен только после отдельного явного подтверждения владельца.
