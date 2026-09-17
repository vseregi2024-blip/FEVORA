# FEVORA IMPERIA — C1.2 MOBILE OVERFLOW COMPLETION REPORT

Дата завершения: 17.09.2026 (Europe/Kyiv)
Статус: **COMPLETE / STOP**

## Причина дефекта

Заголовок списка сертификатов сохранял горизонтальную компоновку `.page-header` до глобального breakpoint `390px`. На ширине `430px` длинный заголовок вместе с кнопкой «＋ Новый сертификат» не помещались в доступную ширину и увеличивали `scrollWidth` страницы до `449px`.

## Исправление

- `src/app/(private)/cosmetology/certificates/page.tsx`: заголовку списка добавлен scoped-класс `certificates-page-header`.
- `src/app/globals.css`: на ширине до `430px` только этот заголовок переводится в колонку, а кнопка получает `width: 100%`.
- `tests/cosmetology-certificates-c1.test.ts`: добавлен regression contract для класса и breakpoint.
- Размер текста не уменьшался. Schema, migrations, database, Payment, PaymentComponent, касса, финансовая логика и Beauty Bonus Club не менялись.

## Локальные проверки

| Проверка | Результат |
|---|---|
| Typecheck | PASS |
| Lint | PASS, 0 errors; 3 прежних предупреждения `no-img-element` вне C1.2 |
| Relevant tests | PASS, 1 файл / 15 тестов |
| Production build | PASS |
| Prisma generate внутри build | PASS |

Локальная browser-проверка списка, карточки и формы создания на `375 / 390 / 430px`: PASS, horizontal overflow отсутствует.

## Production

- Railway deployment: `5bba620b-b128-4507-9615-af9a9220c176`.
- Статус: `SUCCESS`.
- Image digest: `sha256:20fea6636aff9bdf8e5069f880240e28475807416a29ce22cacf1be725663e28`.
- Startup: `23 migrations found`, `No pending migrations to apply`.
- Health: `GET /api/health` → HTTP `200`, `{"status":"ok"}`.

## Production mobile verification

| Viewport | Список | Кнопка | Карточка | Создание |
|---|---|---|---|---|
| 375px | `375 = 375`, overflow `0px` | полностью видна, высота `49.1875px` | PASS | PASS |
| 390px | `390 = 390`, overflow `0px` | полностью видна, высота `49.1875px` | PASS | PASS |
| 430px | `430 = 430`, overflow `0px` | полностью видна, высота `49.1875px` | PASS | PASS |

На всех трёх ширинах список читается, карточки не выходят за экран, кнопки доступны. Контрольный отменённый `TEST-CERT-001` отображается корректно.

## Подтверждение границ этапа

- Новая migration не создавалась и не применялась.
- Production database не изменялась.
- Сертификаты, платежи, PaymentComponent, финансовые операции и бонусные операции не создавались.
- Beauty Bonus Club не вызывался.
- C2 не начинался.

**STOP: C1.2 завершён.**
