import "server-only";

import { FinanceModule, InfoProductFormat, InfoProductStatus, Prisma, TransactionType } from "@prisma/client";
import { z } from "zod";

import { periodStart } from "@/features/family/calculations";
import { dateFromInput, todayInputValue } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

const money = z.string().trim().regex(/^\d+(?:[.,]\d{1,2})?$/);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const optional = z.string().trim().max(500).nullable();
const optionalDate = date.nullable();
const decimal = (value: string) => new Prisma.Decimal(value.replace(",", "."));

export const infoProductTypes = ["Мини-курс", "Онлайн-курс", "Вебинар", "Офлайн-курс", "Мастер-класс", "Индивидуальное обучение", "Другое"];
export const infoCategoryNames = ["Реклама", "Сервисы и подписки", "Комиссии", "Создание контента", "Подрядчики", "Аренда / площадка", "Печать / сертификаты / материалы", "Поездки", "Проживание", "Транспорт", "Прочее"];

export const infoProductSchema = z.object({
  name: z.string().trim().min(1).max(120),
  type: z.string().trim().min(1).max(80),
  format: z.nativeEnum(InfoProductFormat),
  basePrice: money.nullable(),
  startDate: optionalDate,
  endDate: optionalDate,
  status: z.nativeEnum(InfoProductStatus),
  comment: optional,
}).refine((value) => !value.startDate || !value.endDate || value.startDate <= value.endDate, { message: "Дата окончания не может быть раньше даты начала.", path: ["endDate"] });

export const infoSaleSchema = z.object({
  productId: z.string().cuid(),
  amount: money,
  operationDate: date,
  buyer: z.string().trim().max(120).nullable(),
  seats: z.coerce.number().int().positive(),
  comment: optional,
});

export const infoExpenseSchema = z.object({
  categoryId: z.string().cuid().nullable(),
  newCategoryName: z.string().trim().min(1).max(80).nullable(),
  productId: z.string().cuid().nullable(),
  amount: money,
  operationDate: date,
  description: z.string().trim().min(1).max(500),
  serviceName: z.string().trim().max(120).nullable(),
  comment: optional,
}).refine((value) => Boolean(value.categoryId || value.newCategoryName), { message: "Выберите или добавьте категорию.", path: ["categoryId"] });

export const infoCategorySchema = z.object({ name: z.string().trim().min(1).max(80) });
export const infoCategoryUpdateSchema = infoCategorySchema.extend({ isArchived: z.boolean() });

export const formValue = (formData: FormData, name: string) => {
  const value = formData.get(name);
  return typeof value === "string" && value.trim() ? value.trim() : null;
};

async function ensureInfoExpenseCategories(userId: string) {
  const count = await prisma.infoExpenseCategory.count({ where: { userId } });
  if (count === 0) await prisma.infoExpenseCategory.createMany({ data: infoCategoryNames.map((name, sortOrder) => ({ userId, name, sortOrder })), skipDuplicates: true });
}

async function ownedProduct(userId: string, id: string, activeOnly = false) {
  const product = await prisma.infoProduct.findFirst({ where: { id, userId, deletedAt: null, ...(activeOnly ? { status: { not: InfoProductStatus.ARCHIVED } } : {}) } });
  if (!product) throw new Error("Продукт обучения не найден.");
  return product;
}

async function ownedCategory(userId: string, id: string) {
  const category = await prisma.infoExpenseCategory.findFirst({ where: { id, userId, isArchived: false } });
  if (!category) throw new Error("Категория расходов недоступна.");
  return category;
}

export async function getInfoExpenseCategories(userId: string, includeArchived = false) {
  await ensureInfoExpenseCategories(userId);
  return prisma.infoExpenseCategory.findMany({ where: { userId, ...(includeArchived ? {} : { isArchived: false }) }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
}

export async function createInfoProduct(userId: string, input: z.infer<typeof infoProductSchema>) {
  const exists = await prisma.infoProduct.findFirst({ where: { userId, name: { equals: input.name, mode: "insensitive" }, deletedAt: null } });
  if (exists) throw new Error("Продукт с таким названием уже есть.");
  return prisma.infoProduct.create({ data: { userId, ...input, basePrice: input.basePrice ? decimal(input.basePrice) : null, startDate: input.startDate ? dateFromInput(input.startDate) : null, endDate: input.endDate ? dateFromInput(input.endDate) : null } });
}

export async function updateInfoProduct(userId: string, id: string, input: z.infer<typeof infoProductSchema>) {
  await ownedProduct(userId, id);
  const duplicate = await prisma.infoProduct.findFirst({ where: { userId, id: { not: id }, name: { equals: input.name, mode: "insensitive" }, deletedAt: null } });
  if (duplicate) throw new Error("Продукт с таким названием уже есть.");
  return prisma.infoProduct.update({ where: { id }, data: { ...input, basePrice: input.basePrice ? decimal(input.basePrice) : null, startDate: input.startDate ? dateFromInput(input.startDate) : null, endDate: input.endDate ? dateFromInput(input.endDate) : null } });
}

export async function createInfoExpenseCategory(userId: string, input: z.infer<typeof infoCategorySchema>) {
  await ensureInfoExpenseCategories(userId);
  const exists = await prisma.infoExpenseCategory.findFirst({ where: { userId, name: { equals: input.name, mode: "insensitive" } } });
  if (exists) throw new Error("Такая категория уже есть.");
  return prisma.infoExpenseCategory.create({ data: { userId, name: input.name } });
}

export async function updateInfoExpenseCategory(userId: string, id: string, input: z.infer<typeof infoCategoryUpdateSchema>) {
  const category = await prisma.infoExpenseCategory.findFirst({ where: { id, userId } });
  if (!category) throw new Error("Категория не найдена.");
  const duplicate = await prisma.infoExpenseCategory.findFirst({ where: { userId, id: { not: id }, name: { equals: input.name, mode: "insensitive" } } });
  if (duplicate) throw new Error("Такая категория уже есть.");
  return prisma.infoExpenseCategory.update({ where: { id }, data: input });
}

export async function createInfoSale(userId: string, input: z.infer<typeof infoSaleSchema>) {
  const product = await ownedProduct(userId, input.productId, true);
  return prisma.$transaction(async (db) => {
    const income = await db.transaction.create({ data: { userId, type: TransactionType.INCOME, amount: decimal(input.amount), operationDate: dateFromInput(input.operationDate), module: FinanceModule.INFOBUSINESS, description: input.comment ? `${product.name}: ${input.comment}` : `Продажа: ${product.name}`, source: "WEB" } });
    return db.infoSale.create({ data: { userId, productId: product.id, buyer: input.buyer, seats: input.seats, comment: input.comment, incomeTransactionId: income.id } });
  });
}

export async function updateInfoSale(userId: string, id: string, input: z.infer<typeof infoSaleSchema>) {
  const sale = await prisma.infoSale.findFirst({ where: { id, userId, deletedAt: null } });
  if (!sale) throw new Error("Продажа не найдена.");
  const product = await ownedProduct(userId, input.productId, sale.productId !== input.productId);
  return prisma.$transaction(async (db) => {
    await db.transaction.updateMany({ where: { id: sale.incomeTransactionId, userId, deletedAt: null }, data: { amount: decimal(input.amount), operationDate: dateFromInput(input.operationDate), description: input.comment ? `${product.name}: ${input.comment}` : `Продажа: ${product.name}` } });
    return db.infoSale.update({ where: { id }, data: { productId: product.id, buyer: input.buyer, seats: input.seats, comment: input.comment } });
  });
}

export async function softDeleteInfoSale(userId: string, id: string) {
  return prisma.$transaction(async (db) => {
    const sale = await db.infoSale.findFirst({ where: { id, userId, deletedAt: null } });
    if (!sale) throw new Error("Продажа не найдена.");
    const deletedAt = new Date();
    await db.transaction.updateMany({ where: { id: sale.incomeTransactionId, userId, deletedAt: null }, data: { deletedAt } });
    return db.infoSale.update({ where: { id }, data: { deletedAt } });
  });
}

async function resolveExpenseCategory(userId: string, input: z.infer<typeof infoExpenseSchema>) {
  await ensureInfoExpenseCategories(userId);
  if (input.newCategoryName) {
    const existing = await prisma.infoExpenseCategory.findFirst({ where: { userId, name: { equals: input.newCategoryName, mode: "insensitive" } } });
    if (existing?.isArchived) return prisma.infoExpenseCategory.update({ where: { id: existing.id }, data: { isArchived: false } });
    if (existing) return existing;
    return prisma.infoExpenseCategory.create({ data: { userId, name: input.newCategoryName } });
  }
  return ownedCategory(userId, input.categoryId!);
}

export async function createInfoExpense(userId: string, input: z.infer<typeof infoExpenseSchema>) {
  const [category, product] = await Promise.all([resolveExpenseCategory(userId, input), input.productId ? ownedProduct(userId, input.productId, true) : null]);
  return prisma.$transaction(async (db) => {
    const transaction = await db.transaction.create({ data: { userId, type: TransactionType.EXPENSE, amount: decimal(input.amount), operationDate: dateFromInput(input.operationDate), module: FinanceModule.INFOBUSINESS, description: input.description, source: "WEB" } });
    return db.infoExpense.create({ data: { userId, transactionId: transaction.id, categoryId: category.id, productId: product?.id, serviceName: input.serviceName, comment: input.comment } });
  });
}

export async function updateInfoExpense(userId: string, id: string, input: z.infer<typeof infoExpenseSchema>) {
  const expense = await prisma.infoExpense.findFirst({ where: { id, userId, deletedAt: null } });
  if (!expense) throw new Error("Расход не найден.");
  const [category, product] = await Promise.all([resolveExpenseCategory(userId, input), input.productId ? ownedProduct(userId, input.productId, expense.productId !== input.productId) : null]);
  return prisma.$transaction(async (db) => {
    await db.transaction.updateMany({ where: { id: expense.transactionId, userId, deletedAt: null }, data: { amount: decimal(input.amount), operationDate: dateFromInput(input.operationDate), description: input.description } });
    return db.infoExpense.update({ where: { id }, data: { categoryId: category.id, productId: product?.id ?? null, serviceName: input.serviceName, comment: input.comment } });
  });
}

export async function softDeleteInfoExpense(userId: string, id: string) {
  return prisma.$transaction(async (db) => {
    const expense = await db.infoExpense.findFirst({ where: { id, userId, deletedAt: null } });
    if (!expense) throw new Error("Расход не найден.");
    const deletedAt = new Date();
    await db.transaction.updateMany({ where: { id: expense.transactionId, userId, deletedAt: null }, data: { deletedAt } });
    return db.infoExpense.update({ where: { id }, data: { deletedAt } });
  });
}

export async function getInfoSale(userId: string, id: string) {
  const sale = await prisma.infoSale.findFirst({ where: { id, userId, deletedAt: null }, include: { product: true, incomeTransaction: true } });
  if (!sale) throw new Error("Продажа не найдена.");
  return sale;
}

export async function getInfoExpense(userId: string, id: string) {
  const expense = await prisma.infoExpense.findFirst({ where: { id, userId, deletedAt: null }, include: { category: true, product: true, transaction: true } });
  if (!expense) throw new Error("Расход не найден.");
  return expense;
}

export async function getInfoProduct(userId: string, id: string) {
  const product = await prisma.infoProduct.findFirst({ where: { id, userId, deletedAt: null }, include: { sales: { where: { deletedAt: null }, include: { incomeTransaction: true }, orderBy: { createdAt: "desc" } }, expenses: { where: { deletedAt: null }, include: { transaction: true, category: true }, orderBy: { createdAt: "desc" } } } });
  if (!product) throw new Error("Продукт обучения не найден.");
  const income = product.sales.reduce((total, sale) => total.add(sale.incomeTransaction.deletedAt ? 0 : sale.incomeTransaction.amount), new Prisma.Decimal(0));
  const expense = product.expenses.reduce((total, item) => total.add(item.transaction.deletedAt ? 0 : item.transaction.amount), new Prisma.Decimal(0));
  return { ...product, summary: { sales: product.sales.filter((sale) => !sale.incomeTransaction.deletedAt).length, income: income.toString(), expense: expense.toString(), profit: income.sub(expense).toString() } };
}

type Period = "TODAY" | "WEEK" | "MONTH" | "YEAR";

export async function getInfoDashboard(userId: string, period: Period = "MONTH") {
  await ensureInfoExpenseCategories(userId);
  const from = periodStart(period, dateFromInput(todayInputValue()));
  const [products, sales, expenses, categories] = await Promise.all([
    prisma.infoProduct.findMany({ where: { userId, deletedAt: null }, orderBy: { name: "asc" } }),
    prisma.infoSale.findMany({ where: { userId, deletedAt: null, incomeTransaction: { deletedAt: null, operationDate: { gte: from } } }, include: { product: true, incomeTransaction: true }, orderBy: { incomeTransaction: { operationDate: "desc" } } }),
    prisma.infoExpense.findMany({ where: { userId, deletedAt: null, transaction: { deletedAt: null, operationDate: { gte: from } } }, include: { product: true, category: true, transaction: true }, orderBy: { transaction: { operationDate: "desc" } } }),
    prisma.infoExpenseCategory.findMany({ where: { userId, isArchived: false }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
  ]);
  const income = sales.reduce((total, sale) => total.add(sale.incomeTransaction.amount), new Prisma.Decimal(0));
  const expense = expenses.reduce((total, item) => total.add(item.transaction.amount), new Prisma.Decimal(0));
  return { products, sales, expenses, categories, report: { income: income.toString(), expense: expense.toString(), profit: income.sub(expense).toString() } };
}

export async function getInfoAnalytics(userId: string, period: Period, filters: { productId?: string; categoryId?: string } = {}) {
  const [dashboard, products, categories] = await Promise.all([getInfoDashboard(userId, period), prisma.infoProduct.findMany({ where: { userId, deletedAt: null }, orderBy: { name: "asc" } }), getInfoExpenseCategories(userId)]);
  const sales = filters.productId ? dashboard.sales.filter((sale) => sale.productId === filters.productId) : dashboard.sales;
  const expenses = dashboard.expenses.filter((expense) => (!filters.productId || expense.productId === filters.productId) && (!filters.categoryId || expense.categoryId === filters.categoryId));
  const income = sales.reduce((total, sale) => total.add(sale.incomeTransaction.amount), new Prisma.Decimal(0));
  const expense = expenses.reduce((total, item) => total.add(item.transaction.amount), new Prisma.Decimal(0));
  const productRows = new Map<string, { id: string; name: string; sales: number; income: Prisma.Decimal; expense: Prisma.Decimal }>();
  for (const sale of sales) {
    const row = productRows.get(sale.productId) ?? { id: sale.productId, name: sale.product.name, sales: 0, income: new Prisma.Decimal(0), expense: new Prisma.Decimal(0) };
    row.sales += sale.seats;
    row.income = row.income.add(sale.incomeTransaction.amount);
    productRows.set(sale.productId, row);
  }
  for (const expense of expenses.filter((item) => item.productId && item.product)) {
    const row = productRows.get(expense.productId!) ?? { id: expense.productId!, name: expense.product!.name, sales: 0, income: new Prisma.Decimal(0), expense: new Prisma.Decimal(0) };
    row.expense = row.expense.add(expense.transaction.amount);
    productRows.set(expense.productId!, row);
  }
  const categoryRows = new Map<string, { id: string; name: string; amount: Prisma.Decimal }>();
  for (const expense of expenses) {
    const row = categoryRows.get(expense.categoryId) ?? { id: expense.categoryId, name: expense.category.name, amount: new Prisma.Decimal(0) };
    row.amount = row.amount.add(expense.transaction.amount);
    categoryRows.set(expense.categoryId, row);
  }
  const serviceRows = new Map<string, Prisma.Decimal>();
  for (const expense of expenses.filter((item) => item.serviceName)) serviceRows.set(expense.serviceName!, (serviceRows.get(expense.serviceName!) ?? new Prisma.Decimal(0)).add(expense.transaction.amount));
  return {
    products,
    categories,
    report: { income: income.toString(), expense: expense.toString(), profit: income.sub(expense).toString() },
    productRows: Array.from(productRows.values()).map((row) => ({ ...row, income: row.income.toString(), expense: row.expense.toString(), profit: row.income.sub(row.expense).toString() })).sort((left, right) => right.profit.localeCompare(left.profit, "en", { numeric: true })),
    categoryRows: Array.from(categoryRows.values()).map((row) => ({ ...row, amount: row.amount.toString() })).sort((left, right) => right.amount.localeCompare(left.amount, "en", { numeric: true })),
    serviceRows: Array.from(serviceRows.entries()).map(([name, amount]) => ({ name, amount: amount.toString() })).sort((left, right) => right.amount.localeCompare(left.amount, "en", { numeric: true })),
  };
}
