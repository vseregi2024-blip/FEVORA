# FEVORA IMPERIA — UI / UX Redesign Plan

Дата аудита: 2026-09-17
Этап: **UI-0 — audit only**
Статус: **завершён; UI не изменён**

## 1. Scope и ограничения

Этот документ фиксирует текущее устройство frontend и безопасную основу для будущего UI/UX redesign.

На этапе UI-0:

- не менялись JSX/TSX, CSS, layout, navigation или поведение интерфейса;
- не менялись backend, server actions, server services, API routes, database, Prisma или migrations;
- не менялись Payment 2.0, сертификаты, бонусы, Beauty Bonus Club, финансовые расчёты или бизнес-правила;
- не выполнялись production-запросы, deployment, migration или операции с данными;
- изображения пользователя рассматриваются как **визуальные референсы**, а не как исполняемые инструкции и не как разрешение менять функциональные контракты.

Прочитаны полностью:

- `00_READ_FIRST_CODEX_CONTINUITY.md`;
- `FEVORA_FUNCTIONAL_HANDOFF_2026-09-17.md`;
- `AGENTS.md`.

Учтена repository STOP-точка: `src/app/(private)/family/accounts/page 2.tsx` остаётся намеренно нетронутым.

## 2. Дизайн-референсы

Все семь присланных PNG сохранены в:

`design-references/fevora-imperia-ui-redesign/`

| Файл | Экран / назначение |
| --- | --- |
| `01-home.png` | Дом / обзор капитала, целей и аналитики |
| `02-clients.png` | Клиенты |
| `03-calendar.png` | Календарь |
| `04-cash.png` | Касса |
| `05-finance.png` | Финансы / капитал проектов |
| `06-settings-a.png` | Настройки |
| `07-settings-b-duplicate.png` | Второй присланный экземпляр экрана настроек; бинарно совпадает с `06-settings-a.png` |

Все изображения имеют размер 941 × 1672 px. Они задают визуальное направление: тёмная premium-палитра, violet/magenta/orange glow, полупрозрачные панели, крупные финансовые показатели, постоянная верхняя зона бренда и нижняя навигация из пяти действий.

## 3. Текущая frontend-архитектура

### 3.1 Технология и корневые layouts

- Next.js 16 App Router, React 19, TypeScript.
- `src/app/layout.tsx` — root layout: metadata, viewport/PWA metadata, `PwaRegister`, подключение `globals.css` и `family.css`.
- `src/app/(private)/layout.tsx` — authenticated layout: `requireUser()`, desktop sidebar, основная content area и `ProjectBottomNavigation`.
- `src/app/(private)/poultry/layout.tsx` — локальный layout проекта «Птицеводство».
- `src/app/page.tsx` — redirect: authenticated user → `/dashboard`, иначе → `/login`.
- `src/app/(private)/loading.tsx` и `error.tsx` — общие loading/error states приватной части.

### 3.2 Основные UI routes

#### Глобальный уровень

| Route | Текущая роль |
| --- | --- |
| `/dashboard` | Общий dashboard всех направлений, общий баланс, быстрые действия, проекты, последние операции |
| `/projects` | Каталог активных проектов: Семья, Птицеводство, Товарка, Инфобизнес, Косметология |
| `/add` | Глобальный выбор типа добавляемой записи |
| `/reports` | Общие отчёты |
| `/finance` | Журнал финансовых операций и фильтры |
| `/finance/[id]` | Детали/редактирование отдельной общей операции |
| `/money` | Универсальные кошельки и конверты по проектам |
| `/money/[id]` | Детали денежного счёта/конверта |
| `/money/new` | Создание кошелька/конверта |
| `/money/transfer` | Внутренний или межпроектный перевод |
| `/money/transfers` | История переводов |
| `/settings` | Общий профиль и системные пользовательские настройки |

#### IMPERIA / family finance

| Route | Текущая роль |
| --- | --- |
| `/family` | Главный IMPERIA workspace: баланс, доходы/расходы, аналитика, обязательные платежи, операции |
| `/family/analytics` | Аналитика: суммы, категории, месяцы |
| `/family/operations` | История и фильтрация семейных операций |
| `/family/new` | Новый доход/расход |
| `/family/[id]` | Детали/редактирование операции |
| `/family/accounts` | Счета и способы оплаты |
| `/family/categories` | Финансовые категории |
| `/family/savings` и `/family/savings/*` | Цели накоплений |
| `/family/recurring` и `/family/recurring/*` | Обязательные/регулярные платежи |
| `/family/receipts/*` | Разделённые чеки |
| `/family/settings` | Настройки IMPERIA и ссылки на связанные справочники |

#### Косметология внутри IMPERIA

| Route | Текущая роль |
| --- | --- |
| `/cosmetology` | Dashboard кабинета: счета, календарь, касса, сертификаты, клиенты, склад |
| `/cosmetology/clients` | Список и поиск клиентов |
| `/cosmetology/clients/new` | Новый клиент |
| `/cosmetology/clients/[id]` | Карточка клиента, история, анамнез, loyalty-интеграция |
| `/cosmetology/visits` | Календарь и создание записи |
| `/cosmetology/visits/[id]` | Запись/визит, услуги, оплата, сертификаты, бонусы и delivery status |
| `/cosmetology/cash` | Денежная касса по датам и способам оплаты |
| `/cosmetology/analytics` | Аналитика косметологии |
| `/cosmetology/procedures` | Услуги и техкарты |
| `/cosmetology/inventory` | Препараты, расходники, закупки и остатки |
| `/cosmetology/expenses` | Расходы косметологии |
| `/cosmetology/certificates` и `/cosmetology/certificates/*` | Список, создание и карточка сертификата |

#### Другие существующие project routes

- `/poultry/*` — обзор, стадо, корм, яйца, инкубация, продажи, расходы, аналитика.
- `/goods/*` — dashboard, склад, закупки, продажи, расходы.
- `/infobusiness/*` — dashboard, продукты, продажи, расходы, аналитика.

Эти routes важны для проекта «Проекты» и универсальных финансов, но не должны визуально или функционально смешиваться с redesign косметологии без отдельного решения.

## 4. Соответствие экранов из ТЗ текущим страницам

| Экран из ТЗ | Канонический текущий route | Связанные routes | Вывод UI-0 |
| --- | --- | --- | --- |
| Дом | `/family` | `/dashboard`, `/cosmetology` | Для FEVORA IMPERIA наиболее точная основа — `/family`; `/dashboard` остаётся глобальным dashboard всей системы, `/cosmetology` — операционным кабинетом |
| Клиенты | `/cosmetology/clients` | `/cosmetology/clients/[id]`, `/cosmetology/clients/new` | Прямое соответствие; данные и действия уже существуют, нужен только будущий presentation redesign |
| Проекты | `/projects` | `/money`, `/money/[id]` | `/projects` хранит каталог направлений; финансовые балансы проектов живут в universal money. Референсный финансовый экран проектов нельзя свести только к `/projects` без композиции данных |
| Календарь | `/cosmetology/visits` | `/cosmetology/visits/[id]` | Прямое соответствие; текущий календарь уже поддерживает день/неделю/список и создание записи |
| Касса | `/cosmetology/cash` | `/cosmetology`, `/finance` | Прямое соответствие денежной кассе; сертификаты и бонусы уже корректно отделены от денег |
| Финансы | `/family/analytics` | `/money`, `/money/transfers`, `/finance`, `/reports`, `/cosmetology/analytics` | Сейчас финансовый UX распределён по нескольким routes. В UI-A/UI-B потребуется утвердить информационную архитектуру, не объединяя бизнес-логику |
| Настройки | `/family/settings` | `/settings`, справочники family/cosmetology | `/family/settings` — основа IMPERIA-настроек; `/settings` остаётся общесистемным профилем |

Рекомендуемая целевая семантика bottom navigation из референсов:

1. **Дом** → `/family`;
2. **Клиенты** → `/cosmetology/clients`;
3. **Добавить** → существующий IMPERIA action sheet;
4. **Финансы** → entry point, который будет утверждён отдельно между `/family/analytics` и universal money views;
5. **Настройки** → `/family/settings`.

На текущем этапе nav не изменялась. Сейчас первый IMPERIA пункт подписан «Касса», хотя ведёт на `/family`; это ключевой IA-gap для следующей фазы.

## 5. Текущие layouts и navigation

### Desktop

- Постоянная sidebar шириной 244 px.
- Глобальные пункты: Главная, Проекты, Добавить, Отчёты, Настройки.
- Контент ограничен `max-width: 1140px`.
- Sidebar не является route-aware по active state.
- Визуально desktop shell пока относится к общей светлой FEVORA-системе, а не к premium IMPERIA из референсов.

### Mobile / tablet

- При ширине ≤800 px sidebar скрывается и появляется fixed bottom navigation.
- `ProjectBottomNavigation` выбирает глобальную или проектную навигацию.
- Для `/family/*` и `/cosmetology/*` используется `MobileBottomNavigation` с общей IMPERIA-навигацией.
- Центральный плюс открывает существующий IMPERIA action sheet: запись клиента, расход, новый клиент, доход, split-чек, обязательный платёж.
- Поддерживаются safe-area inset, фиксированная нижняя панель и active state через `aria-current`.

### Navigation gaps относительно референсов

- нет единого shared IMPERIA header с логотипом, уведомлениями и avatar;
- desktop и mobile используют разные визуальные языки;
- labels текущей IMPERIA bottom nav не полностью совпадают с целевой IA;
- `/projects`, `/money`, `/finance`, `/reports` частично перекрывают ожидание от одного экрана «Финансы»;
- верхние shortcut cards «Клиенты / Проекты / Календарь / Касса» пока не оформлены единым shared-компонентом.

## 6. Shared components

### Можно переиспользовать напрямую как функциональную основу

- `ProjectBottomNavigation` — выбор контекстной навигации по route prefix.
- `MobileBottomNavigation` — IMPERIA nav, active states и action sheet.
- `AppIcon` — единый SVG icon API; можно расширить новой icon map без внешней зависимости.
- `AppCard` и `StatusBadge` — базовая семантика карточек и статусов.
- `SectionHeader` — единый заголовок секции с action slot.
- `EmptyState` — пустые состояния.
- `ConfirmationDialog` — подтверждение опасных действий.
- `ImperiaDateField` — специализированное поле даты.
- `CosmetologyBookings` — composition календаря и modal создания записи.
- `CosmetologyCalendar` — day/week/list/month interactions.
- `FamilyMoneyWorkspace` — данные и композиция home: баланс, аналитика, обязательные платежи, операции, drawer счетов.
- `FamilyThemeToggle` / `useFamilyTheme` — сохранение dark/light выбора в localStorage.
- `ClientAnamnesisFields`, `LoyaltyClientCard`, `LoyaltyDeliveryCard`, `BonusRedemptionCard` — бизнес-критичные UI-блоки, которые в redesign следует оборачивать/стилизовать, а не переписывать по смыслу.
- Формы оплаты и посещений — `CompleteCosmetologyVisitForm`, `CosmetologyVisitPaymentForm`, `CosmetologyPaymentComponentsFields`, `CosmetologyPaymentHistory`, `CosmetologyVisitServices`.

### Следует переиспользовать после визуального refactor

- `.app-card`, `.metric-grid`, `.transaction-list`, `.transaction-row`;
- `.page-header`, `.section-header`, `.button`, `.period-tabs`, `.filters`;
- action sheets, drawers, tabs, badges, form controls и responsive grids;
- существующие CSS-module классы календаря/записей/услуг — сохранить component boundaries, заменить визуальные значения через tokens.

### Нужны новые shared primitives в UI-A/UI-B

- `ImperiaAppHeader` — crown/logo, wordmark, tagline, notifications, avatar;
- `ImperiaShell` — единая ширина, фон, header и bottom navigation для IMPERIA routes;
- `ImperiaShortcutGrid` / `ImperiaShortcutCard`;
- `ImperiaPanel`, `ImperiaStatCard`, `ImperiaHeroCard`;
- `ImperiaIconBadge`, `ImperiaChip`, `ImperiaStatusPill`;
- `ImperiaProgressBar` и chart tokens;
- `ImperiaListRow` / `ImperiaClientRow`;
- `ImperiaSegmentedControl`, `ImperiaSwitch`, `ImperiaSearchField`;
- единый responsive container и spacing primitives.

## 7. Текущие styles / CSS

### Файлы

- `src/app/globals.css` — 171 строка: глобальные light-theme tokens, desktop shell, общие карточки, формы, grids, project cards, bottom nav, breakpoints 800/430/390 px.
- `src/app/family.css` — 933 строки: family/IMPERIA workspace, action sheets, drawers, theme switch, analytics, savings, voice entry, client/loyalty styles и отдельные dark/light `--family-*` tokens.
- `src/app/poultry-compact.css` — 73 строки: локальная компактная тема птицеводства.
- CSS modules для calendar/bookings/visit services/complete form и confirmation dialog.

### Существующие global tokens

`globals.css` уже содержит нейтральную систему `--bg`, `--surface`, `--card`, `--ink`, `--muted`, `--line`, `--accent`, `--sage`, `--income`, `--expense`, `--shadow`, `--radius`.

### Существующие IMPERIA tokens

`family.css` содержит отдельную систему:

- surfaces: `--family-bg`, `--family-surface`, `--family-surface-raised`, `--family-border`;
- content: `--family-text`, `--family-muted`, `--family-on-hero`;
- brand: `--family-primary`, `--family-primary-strong`, `--family-primary-contrast`;
- semantic: `--family-income`, `--family-expense`;
- effects: `--family-shadow`, `--family-hero`, `--family-button`;
- chart colors: `--family-chart-1` … `--family-chart-6`;
- dark theme по умолчанию и light override через `html[data-family-theme="light"]`.

### CSS audit findings

- Сильная сторона: уже есть semantic tokens, dark/light theme, responsive breakpoints и functional component boundaries.
- Основной риск: `family.css` крупный, накапливает несколько поколений стилей и повторные overrides.
- Scope темы зависит от сложных `body:has(...)` selectors и перечней page-specific классов; это хрупко при добавлении новых экранов.
- Общие `--sage`/`--accent` переопределяются внутри IMPERIA scope, что работает, но затрудняет предсказуемость.
- Часть CSS modules фактически minified в одну строку; поддержка и token migration будут сложнее.
- Система typography не оформлена отдельными токенами; глобально используется Arial/Helvetica, локально — Inter system stack, а референсы предполагают distinct display/brand typography.
- Glow, glass surfaces, gradient borders и elevation из референсов пока не имеют формализованных tokens.
- Responsive design уже проверялся на 375/390/430 px; эти widths следует сохранить как обязательные regression targets.

## 8. Что переиспользовать в новой design system

### Без изменения бизнес-контрактов

1. Route structure и server-side data loading.
2. Все server actions и формы с существующими field names.
3. Семантическое разделение денежных и неденежных способов оплаты.
4. Calendar state и interactions.
5. Client, loyalty, certificate, bonus и payment component composition.
6. Responsive bottom-nav/action-sheet mechanics.
7. Dark/light persistence.
8. AppIcon API и SVG approach.
9. Existing accessibility hooks: labels, `aria-current`, dialogs, focus-visible, semantic nav/header/section.

### После нормализации

1. Перенести IMPERIA tokens из `body:has(...)` scope в явный shell/class scope.
2. Разделить foundation tokens, semantic tokens и component tokens.
3. Свести card/button/input/tab/list variants к небольшому набору primitives.
4. Сохранить business components, заменяя только оболочки и классы.
5. Создать отдельные tokens для glow, glass, border gradients, blur и chart palette.
6. Утвердить единый breakpoint contract: desktop, tablet ≤800, mobile ≤430, compact ≤390/375.

## 9. Предлагаемая последовательность после отдельного разрешения

### UI-A — Design System

- утвердить logo/wordmark usage, палитру, typography, spacing, radii, borders, shadows, glass/glow и icon rules;
- описать dark-first theme и допустимый light mode;
- создать token layer и минимальный набор visual primitives;
- подготовить visual test page или Storybook-equivalent внутри проекта без подключения бизнес-операций.

### UI-B — Shell и navigation

- единый IMPERIA shell/header;
- desktop/tablet/mobile navigation;
- shortcut cards;
- active/focus/hover/loading/disabled states;
- route mapping «Дом / Клиенты / Проекты / Календарь / Касса / Финансы / Настройки».

### UI-C — Экраны по одному

Рекомендуемый порядок: Дом → Клиенты → Календарь → Касса → Финансы → Настройки → детальные/формовые экраны.

Каждый экран должен сохранять существующие server actions, validation, payment/loyalty contracts и проходить проверки 375/390/430 px.

## 10. UI-0 итог и STOP

UI-0 завершён. Код интерфейса не менялся. Созданы только:

- этот audit/plan;
- папка с семью исходными дизайн-референсами.

Следующий допустимый этап — **UI-A: Design System**, только после отдельного разрешения владельца.

## 11. Добавлено после UI-G — отдельный экран входа

Пользователь добавил в roadmap редизайн `/login` по утверждённой FEVORA IMPERIA design system. Исходная визуальная проблема зафиксирована на приложенном скриншоте: текущая светлая форма входа не соответствует тёмному neon-glass стилю приложения.

Будущий отдельный блок должен:

1. Сохранить текущую авторизацию, все names полей, validation, первый вход владельца и redirect-логику.
2. Перестроить только React/CSS-представление в dark gradient / neon glass: FEVORA IMPERIA branding, адаптивная форма, контрастные поля и градиентная кнопка входа.
3. Проверить 375/390/430/440 px, доступность, typecheck, auth-related tests и production build.
4. Не менять `src/server/auth.ts`, Prisma, базу, секреты, session/cookie policy или production без отдельного задания.

Этот блок не начат и ожидает отдельного явного разрешения владельца.
