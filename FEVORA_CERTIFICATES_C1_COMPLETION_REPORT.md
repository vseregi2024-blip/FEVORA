# FEVORA IMPERIA — C1 PRODUCTION COMPLETION REPORT

Дата выполнения: 16.09.2026 (Europe/Kyiv)
Статус: **C1 PRODUCTION COMPLETE**
Production: `https://fevora-production.up.railway.app`

## 1. Результат

Additive migration `20260916090000_add_cosmetology_certificates` применена к production PostgreSQL. Реализация C1 развёрнута в production. Railway deployment завершён со статусом `SUCCESS`, health endpoint отвечает HTTP `200`.

Реальные сертификаты, новые платежи и бонусные операции для проверки не создавались. Реальный `POST /api/v1/payments` в Beauty Bonus Club не выполнялся.

## 2. Backup production database

Перед migration создан свежий custom-format PostgreSQL backup:

- путь на persistent volume PostgreSQL: `/var/lib/postgresql/data/backups/fevora-c1-pre-migration-20260916T200224Z.dump`;
- размер: `241585` bytes;
- права: `600`;
- SHA-256: `f73ff0b5c827c7dc6fa7dbc0f31a4332a6c8f528fb88a82517c45413afb355f7`;
- `pg_restore --list`: успешно, `494` строки каталога архива.

После migration и deploy файл повторно проверен: путь, размер и SHA-256 не изменились.

## 3. Migration

Применена только:

`20260916090000_add_cosmetology_certificates`

Контроль перед применением:

- в production были применены предыдущие `22` migrations;
- Prisma внутри production-контейнера показала ровно одну ожидающую migration — C1;
- SHA-256 временно переданного в production SQL совпал с локальным файлом: `4ca5bbbff6afea3fa351056378efc8a0038a5d8dcdc324b1751e546f133b7623`;
- SQL повторно проверен: отсутствуют `DROP`, `TRUNCATE`, `DELETE FROM`, data `UPDATE`, `db reset` и `db push`.

Результат Prisma:

- `Applying migration 20260916090000_add_cosmetology_certificates`;
- `All migrations have been successfully applied`;
- повторный `prisma migrate status`: `Database schema is up to date`;
- при старте нового контейнера: `23 migrations found`, `No pending migrations to apply`.

Migration добавила только новые структуры и nullable-связь. Автоматического backfill существующих платежей или создания сертификатов не было.

## 4. Certificate schema в production

Добавлено:

- `CosmetologyPaymentMethod.CERTIFICATE`;
- enum `CosmetologyCertificateStatus`:
  - `ACTIVE`;
  - `FULLY_USED`;
  - `EXPIRED`;
  - `CANCELLED`;
- таблица `CosmetologyCertificate`:
  - `id`;
  - `userId`;
  - nullable `clientId`;
  - `certificateNumber`;
  - `initialAmount`;
  - `remainingAmount`;
  - `currency`;
  - `status`;
  - `issuedAt`;
  - nullable `expiresAt`;
  - nullable `comment`;
  - `createdAt`;
  - `updatedAt`;
- nullable `CosmetologyPaymentComponent.certificateId`;
- DB-level unique `[userId, certificateNumber]`;
- индексы поиска сертификатов и компонентов;
- foreign keys к `User`, `CosmetologyClient` и `CosmetologyPaymentComponent`.

После migration `CosmetologyCertificate` содержит `0` строк: реальные и тестовые production-сертификаты не создавались.

## 5. Deployment

- Railway project: `7365c6b1-9b2d-4f71-8154-4c88614153f9`;
- service: `FEVORA`;
- deployment ID: `49e90aa0-7b79-4c42-a86e-fc7ad379ebc4`;
- deployment status: `SUCCESS`;
- image digest: `sha256:9390e75b11b97cd2c5997f93c8ea4e4f3be33847a55a8a01d67ed4323bd8a7ff`;
- Docker production build: PASS;
- Prisma Client generation в Docker: PASS;
- Next.js compile: PASS;
- TypeScript внутри production build: PASS;
- health route `/api/health`: `{"status":"ok"}`, HTTP `200`.

### Безопасный startup

До deploy обнаружено, что старый `docker-entrypoint.sh` безусловно запускал `prisma:seed` при каждом старте и мог выполнять UPDATE общих справочников. Чтобы выполнить прямое условие «не перезаписывать production-данные», seed сделан opt-in через `RUN_PRISMA_SEED=true`.

В production startup log после C1:

- migration check выполнен;
- pending migrations отсутствуют;
- seed не запускался;
- приложение запущено через `next start`.

## 6. Сохранность production-данных

Счётчики зафиксированы до migration и повторно проверены после migration и deploy.

| Объект | До | После | Результат |
|---|---:|---:|---|
| `CosmetologyVisit` | 5 | 5 | сохранено |
| `CosmetologyPayment` | 1 | 1 | сохранено |
| `CosmetologyPaymentComponent` | 1 | 1 | сохранено |
| `Transaction` | 92 | 92 | сохранено |
| `CosmetologyLoyaltyDelivery` | 1 | 1 | сохранено |
| `CosmetologyCertificate` | отсутствовала | 0 | тестовые данные не создавались |

Старая оплата 1 000 грн сохранена:

- visit: `cmtwk2glz0005pl4xaht37vtp`;
- процедура: «чистка»;
- статус: `COMPLETED`;
- стоимость: `1000.00 UAH`;
- оплачено: `1000.00 UAH`;
- Payment: `legacy-payment-cmtwk2glz0005pl4xaht37vtp`;
- единственный component: `CASH`, `1000.00`;
- `certificateId = NULL`.

Карточка процедуры в production показывает стоимость 1 000 грн, оплачено 1 000 грн, остаток 0 грн и историю наличной оплаты.

## 7. Production UI и «Касса за день»

| Проверка | Результат | Фактическое подтверждение |
|---|---|---|
| Список сертификатов | PASS | `/cosmetology/certificates` открывается, показывает пустое состояние |
| Создание сертификата | PASS | `/cosmetology/certificates/new` открывается; форма не отправлялась |
| Карточка сертификата | Ограниченная read-only проверка | dynamic route собран; отсутствующий ID безопасно показывает ошибку. Реальную карточку невозможно открыть при `0` сертификатов без запрещённого создания production-записи; полная карточка ранее прошла локальную проверку |
| Касса за день | PASS | `/cosmetology/cash` открывается |
| Касса за 11.09.2026 | PASS | общий денежный итог `1000.00 UAH`, CASH `1000.00 UAH` |
| Сегодняшняя касса | PASS | `0.00 UAH`, новых поступлений проверка не создала |
| Сертификаты в кассе | PASS по production-коду и тестам | отображаются отдельно как «Сертификаты закрыли» и исключены из денежного итога |

Ограниченная проверка карточки не является ошибкой приложения: это соблюдение запрета создавать тестовый production-сертификат.

## 8. PAYMENT 2.0 regression и CERTIFICATE

Production enum содержит:

- `CASH`;
- `MONOBANK`;
- `PRIVATBANK`;
- `OTHER`;
- `CERTIFICATE`.

| Проверка | Результат |
|---|---|
| CASH | PASS — существующая production-оплата 1 000 грн сохранена и видна |
| MONOBANK | PASS по schema/build/local regression; production-запись для теста не создавалась |
| PRIVATBANK | PASS по schema/build/local regression; production-запись для теста не создавалась |
| OTHER | PASS по schema/build/local regression; production-запись для теста не создавалась |
| CERTIFICATE как PaymentComponent | PASS — enum и nullable relation применены в production |
| CASH + CERTIFICATE | PASS в тестах; реальный production-платёж не создавался |
| MONOBANK + CERTIFICATE | PASS в тестах; реальный production-платёж не создавался |
| PRIVATBANK + CERTIFICATE | PASS в тестах; реальный production-платёж не создавался |
| CASH + MONOBANK + CERTIFICATE | PASS в тестах; один Payment с несколькими components |
| Частичная оплата | PASS в regression tests |
| Остаток | PASS в regression tests и на существующей процедуре (`0.00 UAH`) |
| Защита от переплаты | PASS — server-side validation |
| Atomicity | PASS — списание сертификата и component выполняются в одной DB transaction |
| Concurrent use | PASS — условный atomic `updateMany`, остаток не может уйти ниже нуля |

После production deploy повторно выполнены targeted C1 tests:

- `2` test files passed;
- `20` tests passed.

Полный локальный gate перед production был зелёным:

- Prisma validate: PASS;
- Prisma generate: PASS;
- typecheck: PASS;
- lint: PASS (`0` ошибок, `3` прежних warning вне C1);
- tests: PASS (`24` files, `291` tests);
- production build: PASS;
- mobile `375 / 390 / 430 px`: PASS, horizontal overflow отсутствует.

## 9. Финансовая семантика сертификата

Реализация сохраняет модель:

`одна процедура → один Payment → несколько PaymentComponent`.

`CERTIFICATE` закрывает стоимость процедуры, но:

- не создаёт отдельный денежный доход;
- не создаёт wallet movement;
- не входит в денежный `Transaction.amount`;
- не входит в CASH/MONOBANK/PRIVATBANK/OTHER итог кассы;
- отображается отдельным неденежным итогом `certificateTotal`.

Денежная транзакция формируется только по сумме денежных компонентов. Это проверено unit/contract tests. Эмпирический production-тест со списанием сертификата намеренно не выполнялся, потому что создание сертификата и платежа было запрещено.

## 10. Beauty Bonus Club

- `BOT_CLIENT_PAYMENTS_ENABLED` не равен `true`;
- реальный `POST /api/v1/payments` не выполнялся;
- бонусы не начислялись и не списывались;
- существующий delivery после migration/deploy:
  - visit: `cmtwk2glz0005pl4xaht37vtp`;
  - status: `NOT_SENT`;
  - `attemptCount = 0`;
  - `remotePaymentId = NULL`;
  - `lastErrorCode = NULL`;
- количество delivery осталось `1`;
- для будущей delivery сумма считается только по monetary components; `CERTIFICATE` исключён.

## 11. Запрещённые действия

Не выполнялись:

- `db reset`;
- `db push`;
- `DROP`;
- `TRUNCATE`;
- удаление production-данных;
- destructive conversion существующих данных;
- создание реального production-сертификата;
- создание нового production-платежа;
- начисление или списание бонусов;
- реальный `POST /api/v1/payments`;
- refund;
- reversal.

## 12. Финальный статус и STOP

**C1 PRODUCTION COMPLETE.**

Migration и deploy завершены. Production health зелёный, существующие данные и оплата 1 000 грн сохранены, реальные операции для тестирования не создавались.

**STOP:** к оплате бонусами, refund, reversal и следующим этапам переход не выполнялся.
