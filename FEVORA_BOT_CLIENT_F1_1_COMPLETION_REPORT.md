# FEVORA IMPERIA — F1.1 COMPLETION REPORT

Дата завершения: 10.09.2026

Статус: **F1.1 COMPLETE**

## 1. Что было найдено

До F1.1 production FEVORA содержала старую карточку клиента без интеграции Beauty Bonus Club. Локальная заготовка интеграции существовала, но использовала прежние переменные окружения и старый JSON-контракт.

Production Bot Client API был проверен фактическими server-side GET-запросами. Доступны и отвечают:

- `GET /api/v1/clients/search`;
- `GET /api/v1/clients/{clientId}`;
- `GET /api/v1/clients/{clientId}/loyalty-profile`;
- `GET /api/v1/clients/{clientId}/bonus-transactions`.

API использует snake_case и возвращает:

- поиск: `items`, `total`;
- профиль: актуальные loyalty-поля;
- история: `items`, `page`, `limit`, `total`.

## 2. Переход на environment variables

Найдены прежние переменные:

```text
BEAUTY_BONUS_API_URL
BEAUTY_BONUS_API_KEY
```

Их использование удалено. Единый server-side client теперь использует только:

```text
BOT_CLIENT_API_URL
BOT_CLIENT_API_SECRET
```

`.env.example` содержит только пустые placeholders. Реальный secret не записан в Git, код или отчёт.

## 3. Server-side API client

Единый клиент находится в `src/server/loyalty.ts`.

Реализованы методы:

- `searchClientsByPhone(phone)`;
- `getClient(clientId)`;
- `getLoyaltyProfile(clientId)`;
- `getBonusTransactions(clientId, page, limit)`.

Все запросы проходят по схеме:

```text
FEVORA Browser → FEVORA Server → Bot Client API
```

Реализованы:

- Bearer authentication;
- timeout 7 секунд;
- `x-request-id`;
- `cache: no-store`;
- нормализация украинского номера `0XXXXXXXXX` → `380XXXXXXXXX`;
- ограничение `limit` от 1 до 100;
- безопасное сопоставление ошибок;
- Zod-валидация каждого ответа.

## 4. Error mapping

| Сценарий | Пользовательское сообщение | Результат |
|---|---|---|
| 401 | Нет доступа к программе лояльности | PASS |
| 404 | Клиент не найден в программе лояльности | PASS |
| 429 | Слишком много запросов | PASS |
| 500/503 | Программа лояльности временно недоступна | PASS |
| Timeout | Не удалось получить данные программы лояльности | PASS |
| Malformed JSON/schema | Не удалось получить данные программы лояльности | PASS |

Stack trace, SQL, secret и внутренние детали пользователю не показываются.

## 5. Database и loyaltyClientId

В `CosmetologyClient` используется только:

```prisma
loyaltyClientId String? @unique
```

Локальные поля `bonusBalance`, `pendingBonusBalance`, `levelName`, `levelBonusPercent`, `totalReferrals` и локальная таблица бонусных операций не создавались.

Production migration:

```text
20260910211500_add_loyalty_client_link
```

успешно применена entrypoint deployment. Она добавила nullable-колонку и unique index. Существующие карточки автоматически не связывались.

## 6. Backup

До migration создан production PostgreSQL custom dump:

```text
/private/tmp/fevora-backups/fevora-production-pre-f11-20260910.dump
```

SHA-256:

```text
f3417d6c393050e2eb04b930bbf5f2a341485bb3594dbc784e250649e321d0a2
```

Файл имеет права `600`, находится вне проекта и не вошёл в deployment или Git.

## 7. Linking flow

Реализован и проверен путь:

1. открыть карточку клиента FEVORA;
2. нажать «Подключить»;
3. выполнить server-side поиск по телефону карточки;
4. показать одного или несколько кандидатов;
5. отдельно показать подтверждение с именем, телефоном и Instagram;
6. после подтверждения проверить remote client/profile и уникальность;
7. сохранить только `loyaltyClientId`;
8. вернуть пользователя в карточку с сообщением об успешном подключении.

Для пустого результата предусмотрены «Попробовать снова» и «Закрыть». Автоматическое создание или автоматическая привязка отсутствуют.

Duplicate protection реализована запросом и unique index.

## 8. Loyalty profile

В production карточке отображаются актуальные данные непосредственно из Bot Client:

- `bonus_balance`;
- `pending_bonus_balance`, если больше нуля;
- `level_name`;
- `level_bonus_percent`;
- `total_referrals`;
- `total_spent` с явной подписью «в клубе»;
- Telegram status.

FEVORA не рассчитывает и не сохраняет эти значения.

## 9. Bonus history и pagination

История загружается непосредственно из Bot Client и показывает:

- дату;
- тип/название операции;
- описание;
- количество бонусов со знаком.

API pagination `page/limit/total` проверена реальными GET-запросами для страниц 1 и 2. UI загружает страницы порциями по 10 и показывает «Показать ещё», когда `total` превышает число загруженных операций.

У production-клиента smoke test имеется одна операция, поэтому кнопка «Показать ещё» корректно не отображалась. Ветка с несколькими страницами покрыта автоматическим тестом.

## 10. Disconnect

Отвязка требует отдельного подтверждения и очищает только `loyaltyClientId`. Клиент Bot Client, бонусы, история, Telegram, клиент FEVORA и процедуры не удаляются.

Production-клиент после smoke test оставлен подключённым согласно критерию успеха.

## 11. Security

Подтверждено:

- secret используется только server-side;
- отсутствует `NEXT_PUBLIC_...`;
- secret не передаётся в URL или query parameters;
- secret не хранится в localStorage/sessionStorage;
- browser напрямую не вызывает Bot Client;
- неправильный production Bearer token возвращает `401`;
- поиск без Authorization возвращает `401`;
- production static frontend bundles не содержат `BOT_CLIENT_API_SECRET`, старые variable names или Bearer value;
- логи содержат только request ID и безопасный код ошибки.

## 12. Financial isolation

Интеграция изменяет только `CosmetologyClient.loyaltyClientId`.

До и после production smoke test:

| Показатель | До | После | Результат |
|---|---:|---:|---|
| Общий баланс | −47 622,00 UAH | −47 622,00 UAH | PASS |
| Доходы за месяц | 0,00 UAH | 0,00 UAH | PASS |
| Расходы за месяц | 12 689,00 UAH | 12 689,00 UAH | PASS |
| Финансовый результат | −12 689,00 UAH | −12 689,00 UAH | PASS |

Автоматические тесты подтверждают отсутствие записей в `Income`, `Expense`, `MoneyAccount`, `Envelope` и `InternalTransfer` из loyalty flow.

`bonus_balance` не участвует в общем капитале FEVORA.

## 13. Navigation

Проверено:

- после подключения пользователь возвращается в карточку;
- отображается сообщение об успешном подключении;
- Browser Back возвращает на логический предыдущий экран;
- ссылка «К клиентам» возвращает в клиентскую базу;
- пустая страница после actions не возникает.

## 14. Mobile

Production проверен на viewport:

- 375 px;
- 390 px;
- 430 px.

Для всех размеров:

- horizontal overflow отсутствует;
- минимальная высота видимой кнопки блока — 49 px;
- карточка и метрики остаются в пределах экрана.

## 15. Automated checks

| Проверка | Результат |
|---|---|
| Loyalty targeted tests | 22/22 PASS |
| Полный test suite | 229/229 PASS |
| Typecheck | PASS |
| Production build | PASS |
| Lint | PASS: 0 errors |
| Existing lint warnings | 3 предупреждения `<img>` вне F1.1 |
| `git diff --check` | PASS |

Покрыты valid request, 401, 404, 429, 500/503, timeout, malformed response, one/multiple/no candidates, connect, duplicate, disconnect, balance, pending balance, level, percentage, referrals, history, pagination, empty history, secret isolation и finance isolation.

## 16. Deployment

Railway deployment:

```text
84c1cd83-842a-4f40-b118-0bc4b191d5cf
```

Статус: `SUCCESS`.

Build и TypeScript прошли на Railway. Startup logs подтверждают успешное применение migration и запуск приложения.

Production health check:

```text
GET https://fevora-production.up.railway.app/api/health → HTTP 200
```

## 17. Production smoke test

Использован существующий клиент FEVORA, который уже существовал в Bot Client. Новые клиенты не создавались.

Фактический результат:

- поиск по телефону: PASS;
- найден один совпадающий клиент: PASS;
- отдельное подтверждение: PASS;
- ручное сохранение `loyaltyClientId`: PASS;
- возврат в карточку: PASS;
- актуальный баланс: `100` бонусов;
- уровень: `Bronze`;
- процент: `1%`;
- рефералы: `0`;
- Telegram: подключён;
- история: одна реальная операция `+100`;
- FEVORA Finance: без изменений.

## 18. Запрещённые операции

Не создавались и не изменялись:

- payment;
- bonus начисление;
- bonus списание;
- `bonus_transactions`;
- referral Bot Client;
- webhook;
- процедуры или оплаты Bot Client;
- POST payment/bonus/redeem/refund/reversal endpoints.

Bot Client не изменялся.

## Финальная точка

**F1.1 COMPLETE.**

Работа остановлена. F2/F3/F4 не начинались.
