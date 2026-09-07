import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const APPLY = process.argv.includes("--apply");
const IMPORT_TAG = "FEVORA-HISTORY-2026-08-31";
const d = (value) => new Date(`${value}T00:00:00.000Z`);
const dec = (value) => new Prisma.Decimal(value);
const mark = (key, text = "") => `[${IMPORT_TAG}:${key}]${text ? ` ${text}` : ""}`;

const batches = [
  { code: "P-001", name: "Взрослые несушки", birdType: "Куры", breed: "Несушки", startDate: "2026-01-01", starting: 17, current: 17, source: "OTHER", status: "ACTIVE", comment: "Дата формирования исходного взрослого стада не зафиксирована.", breeds: [["Несушки", 17]] },
  { code: "P-002", name: "Молодые несушки · вывод 09.05", birdType: "Куры", breed: "Смешанные несушки", startDate: "2026-05-09", starting: 40, current: 40, source: "INCUBATION", status: "ACTIVE", comment: "Майская инкубация; физически содержатся одной группой.", breeds: [["Маран / Легбар / Амераукана / Уйхелюх", 40]] },
  { code: "P-003", name: "Майские бройлеры · вывод 09.05", birdType: "Бройлеры", breed: "Кобб / Мастер Грей", startDate: "2026-05-09", starting: 22, current: 2, source: "INCUBATION", status: "ACTIVE", comment: "На 31.08 осталось 2. Содержатся вместе с P-006, но учитываются отдельно для себестоимости.", breeds: [["Кобб / Мастер Грей", 22]] },
  { code: "P-004", name: "Старшие утки · историческая партия", birdType: "Утки", breed: null, startDate: "2026-04-12", starting: 24, current: 0, source: "INCUBATION", status: "COMPLETED", comment: "Историческая партия продаж 02–03.07 и 01.08. Не включена в подтверждённый текущий остаток 31.08.", breeds: [["Утка", 24]] },
  { code: "P-005", name: "Индоутки · общая партия", birdType: "Индоутки", breed: "Индоутка", startDate: "2026-06-25", starting: 25, current: 24, source: "INCUBATION", status: "ACTIVE", comment: "Одна общая партия. Собственная инкубация из купленных яиц; стоимость яиц не сохранилась. После падежа 1 осталось 24.", breeds: [["Индоутка", 25]] },
  { code: "P-006", name: "Купленные бройлеры · 23.06", birdType: "Бройлеры", breed: "Кобб 500", startDate: "2026-06-23", starting: 21, current: 21, source: "PURCHASE", status: "ACTIVE", comment: "Подготовлено 21 перед самостоятельным внесением продажи за 30.08; после продажи должно остаться 20.", breeds: [["Кобб 500", 21]] },
  { code: "P-007", name: "Молодняк · общая партия 78", birdType: "Цыплята", breed: "Смешанная", startDate: "2026-07-20", starting: 78, current: 78, source: "INCUBATION", status: "ACTIVE", comment: "Одна партия. Учётная средняя дата вывода 20.07; закладки 27.06 и 30.06.", breeds: [["Аям Цемани", 2], ["Феникс", 2], ["Бройлер", 10], ["Фокси Чик", 22], ["Amazon", 24], ["R3/R3A", 18]] },
  { code: "P-008", name: "Подаренные утята · 18.08", birdType: "Утята", breed: null, startDate: "2026-08-18", starting: 7, current: 7, source: "GIFT", status: "ACTIVE", comment: "Отдельная подаренная восьмая партия; не входит в другие группы уток.", breeds: [["Утята", 7]] },
  { code: "P-009", name: "Утки Star 53 · вывод 25.06", birdType: "Утки", breed: "Star 53", startDate: "2026-06-25", starting: 24, current: 24, source: "INCUBATION", status: "ACTIVE", comment: "24 утёнка Star 53 из совместной инкубации с индоуткой; отдельная партия.", breeds: [["Star 53", 24]] },
];

const incubations = [
  {
    key: "INC-MAY", name: "Майская инкубация · вывод 09.05", setDate: "2026-04-19", hatchDate: "2026-05-09", birdType: "Куры / бройлеры", cashCost: 3430,
    comment: "Посылки на 17.04; закладка 19.04. Фактический общий итог 3 430 грн. Промежуточные суммы содержали два расхождения по 50 грн, поэтому не суммируются повторно.",
    items: [
      { key: "LAYERS", breed: "Несушки: Маран, Легбар, Амераукана, Уйхелюх", set: 44, hatched: 40, batch: "P-002" },
      { key: "BROILERS", breed: "Бройлеры: Кобб, Мастер Грей", set: 50, hatched: 22, batch: "P-003" },
    ],
  },
  {
    key: "INC-DUCK-JUNE", name: "Индоутка + Star 53 · вывод 25.06", setDate: "2026-05-20", hatchDate: "2026-06-25", birdType: "Утки", cashCost: 610,
    comment: "20.05 заложено 64 яйца индоутки; 27.05 добавлено 32 яйца Star 53. Star 53: 480 грн + доставка 130 грн = 610 грн. Яйца индоутки куплены, но сумма не сохранилась. Первый Star 53 23.06; официальный вывод 25.06.",
    items: [
      { key: "MUSCOVY", breed: "Индоутка", set: 64, hatched: 25, batch: "P-005", comment: "В позднем пересчёте встречалось 65 (22+22+21); первичная запись закладки — 64." },
      { key: "STAR53", breed: "Star 53", set: 32, hatched: 24, batch: "P-009" },
    ],
  },
  {
    key: "INC-150", name: "150 куриных яиц · общая инкубация", setDate: "2026-06-27", hatchDate: "2026-07-20", birdType: "Куры", cashCost: 4055,
    comment: "Одна инкубация: 78 яиц 27.06 и 72 яйца 30.06. Средняя дата вывода для возраста — 20.07. Точная сумма 4 055 грн; округление 4 100 не использовать.",
    items: [
      { key: "AYAM", breed: "Аям Цемани", set: 15, infertile: 8, loss: 5, hatched: 2 },
      { key: "PHOENIX", breed: "Феникс", set: 15, infertile: 13, loss: 0, hatched: 2 },
      { key: "BROILER", breed: "Бройлер", set: 30, infertile: 8, loss: 12, hatched: 10, comment: "Много неоплода; отмечались проблемные цыплята с деформациями." },
      { key: "FOXY", breed: "Фокси Чик", set: 30, infertile: 2, loss: 6, hatched: 22 },
      { key: "AMAZON", breed: "Amazon", set: 30, infertile: 0, loss: 6, hatched: 24, comment: "Разбивка шести невыведенных на неоплод/потери не сохранилась; технически отражено как потери." },
      { key: "R3", breed: "R3/R3A", set: 30, infertile: 2, loss: 10, hatched: 18, comment: "По неоплоду в старом резюме встречалась иная цифра; сохранено подтверждённое значение 2." },
    ],
  },
];

const sales = [
  ["S-0702-E10", "2026-07-02", "P-001", "EGGS", "Куриные яйца", 10, null, 6, 60, "10 яиц по 6 грн"],
  ["S-0702-D3", "2026-07-02", "P-004", "LIVE_BIRD", "Утка", 1, 3, 230, 690, "Продажа"],
  ["S-0702-D23", "2026-07-02", "P-004", "LIVE_BIRD", "Утка", 1, 2.3, null, 530, "Фактическая сумма"],
  ["S-0703-D265", "2026-07-03", "P-004", "LIVE_BIRD", "Утка", 1, 2.65, null, 610, "Фактическая сумма"],
  ["S-0704-E15", "2026-07-04", "P-001", "EGGS", "Куриные яйца", 15, null, 6, 90, "15 яиц"],
  ["S-0704-B30", "2026-07-04", "P-003", "LIVE_BIRD", "Бройлер", 1, 3, 180, 540, "Продажа"],
  ["S-0704-B26", "2026-07-04", "P-003", "LIVE_BIRD", "Бройлер", 1, 2.6, 180, 468, "Расчётная сумма; фактическое округление не зафиксировано"],
  ["S-0708-B26", "2026-07-08", "P-003", "LIVE_BIRD", "Бройлер", 1, 2.6, 180, 470, "Фактически получено 470"],
  ["S-0708-B29", "2026-07-08", "P-003", "LIVE_BIRD", "Бройлер", 1, 2.9, 180, 530, "Фактически получено 530"],
  ["S-0709-E30", "2026-07-09", "P-001", "EGGS", "Куриные яйца", 30, null, 6, 180, "3 десятка"],
  ["S-0709-B28", "2026-07-09", "P-003", "LIVE_BIRD", "Бройлер", 1, 2.8, 180, 510, "Фактически получено 510"],
  ["S-0717-E15", "2026-07-17", "P-001", "EGGS", "Куриные яйца", 15, null, 6, 90, "15 яиц"],
  ["S-0717-B32", "2026-07-17", "P-003", "LIVE_BIRD", "Бройлер", 1, 3.2, 180, 580, "Расчёт 576; фактически 580"],
  ["S-0724-E15", "2026-07-24", "P-001", "EGGS", "Куриные яйца", 15, null, 6, 90, "15 яиц"],
  ["S-0825-E20", "2026-08-25", "P-001", "EGGS", "Куриные яйца", 20, null, 6, 120, "20 яиц × 6 грн"],
  ["S-0826-E15", "2026-08-26", "P-001", "EGGS", "Куриные яйца", 15, null, 6, 90, "15 яиц × 6 грн"],
];

const movements = [
  ["M-FAMILY-0707", "2026-07-07", "P-003", "FAMILY_USE", 1, "Для семьи", "Вес 2,4 кг"],
  ["M-FAMILY-0709", "2026-07-09", "P-003", "FAMILY_USE", 1, "Для семьи", "Вес 2,8 кг"],
  ["M-FAMILY-0714", "2026-07-14", "P-003", "FAMILY_USE", 2, "Для семьи", "2 головы"],
  ["M-FAMILY-0723", "2026-07-23", "P-003", "FAMILY_USE", 1, "Для семьи", "Вес 3,1 кг"],
  ["M-MORT-P003", "2026-08-31", "P-003", "MORTALITY", 1, "Падёж", "Точная дата не подтверждена; 31.08 — техническая дата импорта"],
  ["M-MORT-P005", "2026-08-31", "P-005", "MORTALITY", 1, "Падёж", "Точная дата не подтверждена; 31.08 — техническая дата импорта"],
];

const feedEntries = [
  ["F-0630-BK2", "2026-06-30", "БК-2", 1, 25, 25, 500, "feed", "Куплен и открыт в тот же день; для больших бройлеров"],
  ["F-0709-BK3", "2026-07-09", "БК-3", 1, 25, 25, 500, "feed", "Корм для бройлеров"],
  ["F-0709-PK34", "2026-07-09", "ПК 3-4", 1, 25, 25, 470, "feed", "Для молодых несушек"],
  ["F-0709-KSM", "2026-07-09", "КСМ", 1, 25, 25, 300, "feed", "Корм для уток"],
  ["F-0710-PK23", "2026-07-10", "ПК 2-3", 1, 25, 25, 0, "feed", "Историческая запись открытия; цена не сохранилась"],
  ["F-0711-BK2", "2026-07-11", "БК-2", 1, 25, 25, 525, "feed", "Восстановленная запись"],
  ["F-0711-VK3", "2026-07-11", "ВК-3", 1, 25, 25, 520, "feed", "Название требует проверки; не исправлено автоматически на БК-3"],
  ["F-0712-START", "2026-07-12", "Стартовый корм для малышей", 1, 25, 25, 0, "feed", "Историческая запись открытия; цена не сохранилась"],
  ["F-0712-WHEY", "2026-07-12", "Сыворотка", 0, null, 9, 72, "supplement", "9 л по 8 грн; в учёте сохранено как 9 кг/л"],
  ["F-0718-PK125", "2026-07-18", "ПК 1-25 (старт)", 1, 25, 25, 0, "feed", "Открыт для молодняка; цена не сохранилась"],
  ["F-0720-BK3", "2026-07-20", "БК-3", 2, 25, 50, 1000, "feed", "Для P-003/P-004/P-005/P-006; оба мешка закончились 26.07"],
  ["F-0720-PK34", "2026-07-20", "ПК 3-4", 1, 25, 25, 470, "feed", "Для P-002; открыт 26.07"],
  ["F-0726-BK3", "2026-07-26", "БК-3", 3, 25, 75, 1500, "feed", "Для P-003/P-004/P-005/P-006"],
  ["F-0726-TRI", "2026-07-26", "Трикальций", 0, null, 2, 42, "supplement", "2 кг"],
  ["F-0726-YEAST", "2026-07-26", "Дрожжи кормовые", 0, null, 2, 68, "supplement", "2 кг"],
  ["F-0726-MEAT", "2026-07-26", "Мясокостная мука", 0, null, 2, 68, "supplement", "2 кг"],
  ["F-0726-CORN", "2026-07-26", "Кукуруза битая №2", 0, null, 25, 325, "grain", "25 кг"],
  ["F-0802-BK3", "2026-08-02", "БК-3", 3, 25, 75, 1500, "feed", "Первая из двух одинаковых закупок"],
  ["F-0802-PK26", "2026-08-02", "ПК 2-6", 1, 25, 25, 535, "feed", "Для P-007"],
  ["F-0802-KSM", "2026-08-02", "КСМ финиш", 2, 25, 50, 600, "feed", "Для P-001/P-002"],
  ["F-0802-TRIP", "2026-08-02", "Трикальций фосфат", 0, null, 2, 46, "supplement", "2 кг"],
  ["F-0809-BK3", "2026-08-09", "БК-3", 3, 25, 75, 1500, "feed", "Повторная одинаковая закупка"],
  ["F-0809-PK26", "2026-08-09", "ПК 2-6", 1, 25, 25, 535, "feed", "Для P-007; сопоставить существующую карточку 530 грн"],
  ["F-0809-KSM", "2026-08-09", "КСМ финиш", 2, 25, 50, 600, "feed", "Для P-001/P-002; сопоставить существующую карточку КСМ"],
  ["F-0809-TRIP", "2026-08-09", "Трикальций фосфат", 0, null, 2, 46, "supplement", "2 кг"],
  ["F-0816-KSM", "2026-08-16", "КСМ финиш", 2, 25, 50, 600, "feed", ""],
  ["F-0816-PK26", "2026-08-16", "ПК 2-6", 1, 25, 25, 535, "feed", "Для P-007"],
  ["F-0816-PK34", "2026-08-16", "ПК 3-4", 1, 25, 25, 470, "feed", "Для P-002"],
  ["F-0816-BK3", "2026-08-16", "БК-3", 2, 25, 50, 1000, "feed", "Для P-003/P-005/P-006"],
  ["F-0816-YEAST", "2026-08-16", "Дрожжи кормовые", 0, null, 1.6, 76, "supplement", "2 × 0,8 кг"],
  ["F-0816-FISH", "2026-08-16", "Рыбная мука", 0, null, 2, 118, "supplement", "2 кг"],
  ["F-0823-KSM", "2026-08-23", "КСМ финиш", 2, 25, 50, 600, "feed", "На чеке: утки"],
  ["F-0823-NK2", "2026-08-23", "НК-2", 2, 25, 50, 880, "feed", "На чеке: несушки; P-001/P-002"],
  ["F-0823-BK3", "2026-08-23", "БК-3", 1, 10, 10, 205, "feed", "На чеке: бройлер"],
  ["F-0823-NK1", "2026-08-23", "НК-1", 0, null, 5, 101, "feed", "5 кг для P-008"],
  ["F-0823-BMVD", "2026-08-23", "БМВД универсальный 30%-20%-10%", 1, 25, 25, 785, "supplement", "Для зерносмеси"],
  ["F-0816-WHEAT", "2026-08-16", "Пшеница", 0, null, 1000, 5000, "grain", "Дата приблизительная: к 16.08 тонна уже была куплена"],
];

async function ensureCategory(db, userId, name, kind) {
  const existing = await db.category.findFirst({ where: { module: "POULTRY", name, OR: [{ userId }, { userId: null }] } });
  if (existing) return existing;
  return db.category.create({ data: { userId: null, module: "POULTRY", name, kind, sortOrder: 100 } });
}

async function findMatchedBatch(db, userId, batch) {
  const tagged = await db.poultryBatch.findFirst({ where: { userId, comment: { contains: `${IMPORT_TAG}:${batch.code}` } } });
  if (tagged) return tagged;
  if (batch.code === "P-005") return db.poultryBatch.findFirst({ where: { userId, startDate: d("2026-06-25"), OR: [{ birdType: { contains: "Індо" } }, { birdType: { contains: "Индо" } }, { name: { contains: "индо" } }, { name: { contains: "індо" } }] } });
  if (batch.code === "P-006") return db.poultryBatch.findFirst({ where: { userId, startDate: d("2026-06-23"), OR: [{ birdType: { contains: "Брой" } }, { name: { contains: "23.07" } }, { name: { contains: "23.06" } }] } });
  return null;
}

async function upsertBatches(db, userId) {
  const result = new Map();
  for (const batch of batches) {
    const existing = await findMatchedBatch(db, userId, batch);
    const data = {
      userId, name: batch.name, birdType: batch.birdType, breed: batch.breed,
      startDate: d(batch.startDate), acquisitionDate: d(batch.startDate),
      startingQuantity: batch.starting, currentQuantity: batch.current,
      source: batch.source, status: batch.status,
      comment: mark(batch.code, batch.comment),
    };
    const row = existing
      ? await db.poultryBatch.update({ where: { id: existing.id }, data })
      : await db.poultryBatch.upsert({ where: { id: `hist-${batch.code.toLowerCase()}` }, update: data, create: { id: `hist-${batch.code.toLowerCase()}`, ...data } });
    result.set(batch.code, row);
    for (const [index, [name, quantity]] of batch.breeds.entries()) {
      await db.poultryBatchBreed.upsert({
        where: { id: `hist-breed-${batch.code.toLowerCase()}-${index}` },
        update: { batchId: row.id, name, quantity, deletedAt: null },
        create: { id: `hist-breed-${batch.code.toLowerCase()}-${index}`, batchId: row.id, name, quantity },
      });
    }
  }
  return result;
}

async function upsertIncubations(db, userId, batchMap, eggCategory) {
  for (const inc of incubations) {
    const txId = `hist-tx-${inc.key.toLowerCase()}`;
    await db.transaction.upsert({
      where: { id: txId },
      update: { userId, type: "EXPENSE", amount: dec(inc.cashCost), operationDate: d(inc.setDate), categoryId: eggCategory.id, module: "POULTRY", description: mark(inc.key, `Инкубационные яйца: ${inc.name}`), deletedAt: null },
      create: { id: txId, userId, type: "EXPENSE", amount: dec(inc.cashCost), operationDate: d(inc.setDate), categoryId: eggCategory.id, module: "POULTRY", description: mark(inc.key, `Инкубационные яйца: ${inc.name}`), source: "WEB" },
    });
    const incId = `hist-${inc.key.toLowerCase()}`;
    await db.incubationBatch.upsert({
      where: { id: incId },
      update: { userId, name: inc.name, setDate: d(inc.setDate), hatchDate: d(inc.hatchDate), birdType: inc.birdType, eggSource: "PURCHASED", cashCost: dec(inc.cashCost), productionCost: dec(inc.cashCost), expenseTransactionId: txId, status: "COMPLETED", comment: mark(inc.key, inc.comment), deletedAt: null },
      create: { id: incId, userId, name: inc.name, setDate: d(inc.setDate), hatchDate: d(inc.hatchDate), birdType: inc.birdType, eggSource: "PURCHASED", cashCost: dec(inc.cashCost), productionCost: dec(inc.cashCost), expenseTransactionId: txId, status: "COMPLETED", comment: mark(inc.key, inc.comment) },
    });
    for (const item of inc.items) {
      const itemId = `hist-${inc.key.toLowerCase()}-${item.key.toLowerCase()}`;
      await db.incubationBatchItem.upsert({
        where: { id: itemId },
        update: { incubationBatchId: incId, breed: item.breed, setQuantity: item.set, infertileQuantity: item.infertile ?? 0, lossQuantity: item.loss ?? Math.max(0, item.set - item.hatched), hatchedQuantity: item.hatched, comment: item.comment ?? null, deletedAt: null },
        create: { id: itemId, incubationBatchId: incId, breed: item.breed, setQuantity: item.set, infertileQuantity: item.infertile ?? 0, lossQuantity: item.loss ?? Math.max(0, item.set - item.hatched), hatchedQuantity: item.hatched, comment: item.comment ?? null },
      });
      if (item.batch) {
        const birdBatch = batchMap.get(item.batch);
        await db.poultryBatch.update({ where: { id: birdBatch.id }, data: { incubationBatchId: incId, incubationItemId: itemId } });
      }
    }
  }
  const mixed = batchMap.get("P-007");
  await db.poultryBatch.update({ where: { id: mixed.id }, data: { incubationBatchId: "hist-inc-150", acquisitionProductionCost: dec(4055) } });
  await db.poultryBatch.update({ where: { id: batchMap.get("P-002").id }, data: { acquisitionProductionCost: dec("2212.90") } });
  await db.poultryBatch.update({ where: { id: batchMap.get("P-003").id }, data: { acquisitionProductionCost: dec("1217.10") } });
  await db.poultryBatch.update({ where: { id: batchMap.get("P-005").id }, data: { acquisitionProductionCost: dec(0) } });
  await db.poultryBatch.update({ where: { id: batchMap.get("P-009").id }, data: { acquisitionProductionCost: dec(610) } });

  const costs = [
    ["P-002", "hist-inc-may", "2212.90", "2026-05-09", "Доля стоимости майской инкубации: 40 из 62 выведенных"],
    ["P-003", "hist-inc-may", "1217.10", "2026-05-09", "Доля стоимости майской инкубации: 22 из 62 выведенных"],
    ["P-009", "hist-inc-duck-june", "610", "2026-06-25", "Подтверждённая стоимость яиц Star 53 и доставки"],
    ["P-007", "hist-inc-150", "4055", "2026-07-20", "150 яиц и доставка; 78 здоровых цыплят, 51,99 грн/голову"],
  ];
  for (const [code, ref, amount, date, comment] of costs) {
    await db.poultryCostEntry.upsert({
      where: { id: `hist-cost-${code.toLowerCase()}` },
      update: { userId, batchId: batchMap.get(code).id, type: "INCUBATION_EGGS", amount: dec(amount), referenceId: ref, operationDate: d(date), comment: mark(`COST-${code}`, comment), deletedAt: null },
      create: { id: `hist-cost-${code.toLowerCase()}`, userId, batchId: batchMap.get(code).id, type: "INCUBATION_EGGS", amount: dec(amount), referenceId: ref, operationDate: d(date), comment: mark(`COST-${code}`, comment) },
    });
  }
}

async function upsertSalesAndMovements(db, userId, batchMap, incomeCategory) {
  for (const [key, date, batchCode, saleType, itemName, quantity, weight, price, total, note] of sales) {
    const txId = `hist-tx-${key.toLowerCase()}`;
    const saleId = `hist-${key.toLowerCase()}`;
    await db.transaction.upsert({
      where: { id: txId },
      update: { userId, type: "INCOME", amount: dec(total), operationDate: d(date), categoryId: incomeCategory.id, module: "POULTRY", description: mark(key, `Продажа: ${itemName}`), deletedAt: null },
      create: { id: txId, userId, type: "INCOME", amount: dec(total), operationDate: d(date), categoryId: incomeCategory.id, module: "POULTRY", description: mark(key, `Продажа: ${itemName}`), source: "WEB" },
    });
    await db.poultrySale.upsert({
      where: { id: saleId },
      update: { userId, batchId: batchMap.get(batchCode).id, saleType, itemName, quantity, weightKg: weight == null ? null : dec(weight), price: price == null ? null : dec(price), totalAmount: dec(total), operationDate: d(date), incomeTransactionId: txId, comment: mark(key, note), deletedAt: null },
      create: { id: saleId, userId, batchId: batchMap.get(batchCode).id, saleType, itemName, quantity, weightKg: weight == null ? null : dec(weight), price: price == null ? null : dec(price), totalAmount: dec(total), operationDate: d(date), incomeTransactionId: txId, comment: mark(key, note) },
    });
    if (saleType === "LIVE_BIRD") {
      await db.poultryMovement.upsert({
        where: { id: `hist-move-${key.toLowerCase()}` },
        update: { userId, batchId: batchMap.get(batchCode).id, type: "SALE", quantity, quantityDelta: -quantity, operationDate: d(date), reason: "Продажа", comment: mark(key, note), saleId, deletedAt: null },
        create: { id: `hist-move-${key.toLowerCase()}`, userId, batchId: batchMap.get(batchCode).id, type: "SALE", quantity, quantityDelta: -quantity, operationDate: d(date), reason: "Продажа", comment: mark(key, note), saleId },
      });
    }
  }
  for (const [key, date, code, type, quantity, reason, note] of movements) {
    await db.poultryMovement.upsert({
      where: { id: `hist-${key.toLowerCase()}` },
      update: { userId, batchId: batchMap.get(code).id, type, quantity, quantityDelta: -quantity, operationDate: d(date), reason, comment: mark(key, note), deletedAt: null },
      create: { id: `hist-${key.toLowerCase()}`, userId, batchId: batchMap.get(code).id, type, quantity, quantityDelta: -quantity, operationDate: d(date), reason, comment: mark(key, note) },
    });
  }
}

async function reconcileExistingRows(db, userId, batchMap) {
  const existingDuckSale = await db.poultrySale.findFirst({ where: { userId, operationDate: d("2026-08-01"), quantity: 2, totalAmount: dec(1058), deletedAt: null, id: { not: { startsWith: "hist-" } } }, include: { movement: true } });
  if (existingDuckSale) {
    await db.poultrySale.update({ where: { id: existingDuckSale.id }, data: { batchId: batchMap.get("P-004").id, comment: mark("EXISTING-DUCK-SALE", "Существующая продажа сохранена и перенесена из индоуток в историческую партию старших уток.") } });
    if (existingDuckSale.movement) await db.poultryMovement.update({ where: { id: existingDuckSale.movement.id }, data: { batchId: batchMap.get("P-004").id } });
  }
}

async function upsertFeed(db, userId, batchMap, feedCategory, supplementCategory) {
  const touchedProducts = new Set();
  for (const [key, date, name, bags, bagSize, kg, total, category, note] of feedEntries) {
    const product = await db.feedProduct.upsert({
      where: { userId_name: { userId, name } },
      update: { type: category, bagSizeKg: bagSize == null ? undefined : dec(bagSize) },
      create: { userId, name, type: category, bagSizeKg: bagSize == null ? null : dec(bagSize) },
    });
    touchedProducts.add(product.id);
    const categoryRow = category === "supplement" ? supplementCategory : feedCategory;
    let existingLot = null;
    if (key === "F-0809-KSM") existingLot = await db.feedLot.findFirst({ where: { userId, purchaseDate: d(date), purchasedBags: 2, product: { name: "КСМ" }, deletedAt: null } });
    if (key === "F-0809-PK26") existingLot = await db.feedLot.findFirst({ where: { userId, purchaseDate: d(date), purchasedBags: 1, product: { name: "ПК 3-4" }, deletedAt: null } });
    const txId = existingLot?.purchaseTransactionId ?? `hist-tx-${key.toLowerCase()}`;
    await db.transaction.upsert({
      where: { id: txId },
      update: { userId, type: "EXPENSE", amount: dec(total), operationDate: d(date), categoryId: categoryRow.id, module: "POULTRY", description: mark(key, `Корм/добавка: ${name}`), deletedAt: null },
      create: { id: txId, userId, type: "EXPENSE", amount: dec(total), operationDate: d(date), categoryId: categoryRow.id, module: "POULTRY", description: mark(key, `Корм/добавка: ${name}`), source: "WEB" },
    });
    const lotData = { userId, productId: product.id, purchaseTransactionId: txId, purchasedBags: bags, availableBags: 0, costPerBag: dec(bags > 0 ? total / bags : total), purchaseUnit: bags > 0 ? "BAG" : "KG", purchaseQuantity: dec(bags > 0 ? bags : kg), purchasedKg: dec(kg), availableKg: dec(0), costPerKg: dec(kg > 0 ? total / kg : 0), purchaseDate: d(date), comment: mark(key, note), deletedAt: null };
    if (existingLot) await db.feedLot.update({ where: { id: existingLot.id }, data: lotData });
    else await db.feedLot.upsert({ where: { id: `hist-${key.toLowerCase()}` }, update: lotData, create: { id: `hist-${key.toLowerCase()}`, ...lotData } });
  }

  for (const productId of touchedProducts) {
    const adjustmentId = `hist-feed-zero-${productId}`;
    const [lots, usages, adjustments] = await Promise.all([
      db.feedLot.aggregate({ where: { userId, productId, deletedAt: null, purchaseTransaction: { deletedAt: null } }, _sum: { purchasedKg: true } }),
      db.feedUsage.aggregate({ where: { lot: { userId, productId }, deletedAt: null }, _sum: { quantityKg: true } }),
      db.feedInventoryAdjustment.aggregate({ where: { userId, productId, deletedAt: null, id: { not: adjustmentId } }, _sum: { quantityDeltaKg: true } }),
    ]);
    const calculated = Number(lots._sum.purchasedKg ?? 0) - Number(usages._sum.quantityKg ?? 0) + Number(adjustments._sum.quantityDeltaKg ?? 0);
    await db.feedInventoryAdjustment.upsert({
      where: { id: adjustmentId },
      update: { userId, productId, type: "RECONCILIATION", calculatedKg: dec(calculated), actualKg: dec(0), quantityDeltaKg: dec(-calculated), operationDate: d("2026-08-31"), comment: mark("FEED-ZERO", "Исторические закупки не увеличивают текущий склад; фактический остаток не предоставлен."), deletedAt: null },
      create: { id: adjustmentId, userId, productId, type: "RECONCILIATION", calculatedKg: dec(calculated), actualKg: dec(0), quantityDeltaKg: dec(-calculated), operationDate: d("2026-08-31"), comment: mark("FEED-ZERO", "Исторические закупки не увеличивают текущий склад; фактический остаток не предоставлен.") },
    });
  }

  const existingPkUsage = await db.feedUsage.findFirst({ where: { lot: { userId, purchaseDate: d("2026-08-09") }, deletedAt: null, id: { not: { startsWith: "hist-" } } } });
  if (existingPkUsage && existingPkUsage.batchId !== batchMap.get("P-007").id) await db.feedUsage.update({ where: { id: existingPkUsage.id }, data: { batchId: batchMap.get("P-007").id, comment: mark("EXISTING-PK-USAGE", "Сопоставлено с молодняком P-007.") } });
}

async function upsertEquipment(db, userId, equipmentCategory) {
  const txId = "hist-tx-equipment-incubator";
  await db.transaction.upsert({
    where: { id: txId },
    update: { userId, type: "EXPENSE", amount: dec(6345), operationDate: d("2026-06-24"), categoryId: equipmentCategory.id, module: "POULTRY", description: mark("EQUIPMENT-INCUBATOR", "Инкубатор 6 200 грн + доставка 145 грн"), deletedAt: null },
    create: { id: txId, userId, type: "EXPENSE", amount: dec(6345), operationDate: d("2026-06-24"), categoryId: equipmentCategory.id, module: "POULTRY", description: mark("EQUIPMENT-INCUBATOR", "Инкубатор 6 200 грн + доставка 145 грн"), source: "WEB" },
  });
  await db.poultryOperationalExpense.upsert({
    where: { transactionId: txId },
    update: { userId, deletedAt: null },
    create: { id: "hist-equipment-incubator", userId, transactionId: txId },
  });
}

async function snapshot(db, userId) {
  const rows = await db.poultryBatch.findMany({ where: { userId, deletedAt: null, comment: { contains: IMPORT_TAG } }, orderBy: { name: "asc" }, select: { name: true, startingQuantity: true, currentQuantity: true, status: true, source: true } });
  const [salesCount, feedLotsCount, incubationsCount, taggedTx] = await Promise.all([
    db.poultrySale.count({ where: { userId, deletedAt: null, comment: { contains: IMPORT_TAG } } }),
    db.feedLot.count({ where: { userId, deletedAt: null, comment: { contains: IMPORT_TAG } } }),
    db.incubationBatch.count({ where: { userId, deletedAt: null, comment: { contains: IMPORT_TAG } } }),
    db.transaction.count({ where: { userId, deletedAt: null, OR: [{ description: { contains: IMPORT_TAG } }] } }),
  ]);
  return { batches: rows, salesCount, feedLotsCount, incubationsCount, taggedTransactions: taggedTx };
}

async function main() {
  const users = await prisma.user.findMany({ select: { id: true } });
  if (users.length !== 1) throw new Error(`Ожидался один пользователь FEVORA, найдено: ${users.length}`);
  const userId = users[0].id;
  if (!APPLY) {
    console.log(JSON.stringify({ mode: "DRY_RUN", importTag: IMPORT_TAG, planned: { batches: batches.length, incubations: incubations.length, sales: sales.length, movements: movements.length, feedLots: feedEntries.length, equipmentExpenses: 1 }, existingTagged: await snapshot(prisma, userId), rules: ["Поголовье устанавливается абсолютными остатками", "Продажа за 30.08 не импортируется", "Корм после импорта сверяется в 0 кг", "Повторный запуск идемпотентен"] }, null, 2));
    return;
  }
  const final = await prisma.$transaction(async (db) => {
    const [incomeCategory, feedCategory, supplementCategory, eggCategory, equipmentCategory] = await Promise.all([
      ensureCategory(db, userId, "Продаж продукції", "INCOME"),
      ensureCategory(db, userId, "Корма", "EXPENSE"),
      ensureCategory(db, userId, "Витамины и добавки", "EXPENSE"),
      ensureCategory(db, userId, "Інкубаційні яйця", "EXPENSE"),
      ensureCategory(db, userId, "Оборудование", "EXPENSE"),
    ]);
    const batchMap = await upsertBatches(db, userId);
    await upsertIncubations(db, userId, batchMap, eggCategory);
    await upsertSalesAndMovements(db, userId, batchMap, incomeCategory);
    await reconcileExistingRows(db, userId, batchMap);
    await upsertFeed(db, userId, batchMap, feedCategory, supplementCategory);
    await upsertEquipment(db, userId, equipmentCategory);
    for (const batch of batches) await db.poultryBatch.update({ where: { id: batchMap.get(batch.code).id }, data: { startingQuantity: batch.starting, currentQuantity: batch.current, status: batch.status } });
    return snapshot(db, userId);
  }, { timeout: 120000 });
  console.log(JSON.stringify({ mode: "APPLIED", importTag: IMPORT_TAG, result: final }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
