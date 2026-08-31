import "server-only";

import { CategoryKind, FinanceModule, Prisma, TransactionType } from "@prisma/client";
import { z } from "zod";

import { dateFromInput } from "@/lib/dates";
import { calculateBalance, minorUnitsToMoney } from "@/lib/money";
import { prisma } from "@/lib/prisma";

const transactionSchema = z.object({
  type: z.nativeEnum(TransactionType),
  amount: z.string().min(1),
  operationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  module: z.nativeEnum(FinanceModule),
  categoryId: z.string().cuid().nullable(),
  description: z.string().trim().max(500).nullable(),
});

export type TransactionInput = z.infer<typeof transactionSchema>;

export function parseTransactionForm(formData: FormData): TransactionInput {
  const parsed = transactionSchema.safeParse({
    type: formData.get("type"),
    amount: formData.get("amount"),
    operationDate: formData.get("operationDate"),
    module: formData.get("module"),
    categoryId: formData.get("categoryId") || null,
    description: formData.get("description") || null,
  });
  if (!parsed.success) throw new Error("Перевірте обов'язкові поля операції.");
  return parsed.data;
}

async function assertCategoryOwner(userId: string, categoryId: string | null, module: FinanceModule) {
  if (!categoryId) return;
  const category = await prisma.category.findFirst({
    where: { id: categoryId, module, isArchived: false, OR: [{ userId }, { userId: null }] },
  });
  if (!category) throw new Error("Категорія недоступна.");
}

function decimalAmount(amount: string, type: TransactionType) {
  const normalized = amount.trim().replace(/\s/g, "").replace(",", ".");
  if (!/^-?\d+(\.\d{1,2})?$/.test(normalized) || new Prisma.Decimal(normalized).eq(0) || (type !== "ADJUSTMENT" && new Prisma.Decimal(normalized).lte(0))) {
    throw new Error(type === "ADJUSTMENT" ? "Коригування не може дорівнювати нулю." : "Сума має бути більшою за нуль і містити максимум дві цифри після коми.");
  }
  return new Prisma.Decimal(normalized);
}

export async function createTransaction(userId: string, input: TransactionInput) {
  if (input.module === FinanceModule.POULTRY || input.module === FinanceModule.GOODS || input.module === FinanceModule.INFOBUSINESS || input.module === FinanceModule.COSMETOLOGY) throw new Error("Операции проекта создаются только в его разделе, чтобы сохранить связанные данные корректными.");
  await assertCategoryOwner(userId, input.categoryId, input.module);
  return prisma.transaction.create({
    data: {
      userId,
      type: input.type,
      amount: decimalAmount(input.amount, input.type),
      operationDate: dateFromInput(input.operationDate),
      module: input.module,
      categoryId: input.categoryId,
      description: input.description,
      source: "WEB",
    },
  });
}

export async function updateTransaction(userId: string, id: string, input: TransactionInput) {
  const existing = await prisma.transaction.findFirst({ where: { id, userId, deletedAt: null }, include: { productPurchase: true, productSale: true, goodsExpense: true, infoSale: true, infoExpense: true, cosmetologyVisit: true, cosmetologyLot: true, cosmetologyExpense: true } });
  if (!existing) throw new Error("Операцію не знайдено.");
  if (existing.module === FinanceModule.POULTRY || existing.module === FinanceModule.GOODS || existing.module === FinanceModule.INFOBUSINESS || existing.module === FinanceModule.COSMETOLOGY || existing.productPurchase || existing.productSale || existing.goodsExpense || existing.infoSale || existing.infoExpense || existing.cosmetologyVisit || existing.cosmetologyLot || existing.cosmetologyExpense) throw new Error("Эту операцию нужно изменять в соответствующем проекте, чтобы связанные данные остались корректными.");
  if (input.module === FinanceModule.POULTRY || input.module === FinanceModule.GOODS || input.module === FinanceModule.INFOBUSINESS || input.module === FinanceModule.COSMETOLOGY) throw new Error("Операции проекта создаются только в соответствующем разделе.");
  await assertCategoryOwner(userId, input.categoryId, input.module);
  return prisma.transaction.update({
    where: { id },
    data: {
      type: input.type,
      amount: decimalAmount(input.amount, input.type),
      operationDate: dateFromInput(input.operationDate),
      module: input.module,
      categoryId: input.categoryId,
      description: input.description,
    },
  });
}

export async function softDeleteTransaction(userId: string, id: string) {
  const existing = await prisma.transaction.findFirst({ where: { id, userId, deletedAt: null }, include: { productPurchase: true, productSale: true, goodsExpense: true, infoSale: true, infoExpense: true, cosmetologyVisit: true, cosmetologyLot: true, cosmetologyExpense: true } });
  if (!existing) throw new Error("Операцію не знайдено.");
  if (existing.module === FinanceModule.POULTRY || existing.module === FinanceModule.GOODS || existing.module === FinanceModule.INFOBUSINESS || existing.module === FinanceModule.COSMETOLOGY || existing.productPurchase || existing.productSale || existing.goodsExpense || existing.infoSale || existing.infoExpense || existing.cosmetologyVisit || existing.cosmetologyLot || existing.cosmetologyExpense) throw new Error("Эту операцию нужно удалять в соответствующем проекте, чтобы связанные данные остались корректными.");
  return prisma.transaction.update({ where: { id }, data: { deletedAt: new Date() } });
}

export async function getCategories(userId: string, module?: FinanceModule) {
  return prisma.category.findMany({
    where: { isArchived: false, OR: [{ userId }, { userId: null }], ...(module ? { module } : {}) },
    orderBy: [{ module: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function getFinancialSummary(userId: string, from?: Date, to?: Date) {
  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      deletedAt: null,
      ...(from || to ? { operationDate: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
    },
    select: { amount: true, type: true },
  });
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { startingBalance: true } });
  const balance = calculateBalance(user.startingBalance.toString(), transactions.map((item) => ({ amount: item.amount.toString(), type: item.type })));
  const income = transactions.filter((item) => item.type === "INCOME").reduce((sum, item) => sum.plus(item.amount), new Prisma.Decimal(0));
  const expense = transactions.filter((item) => item.type === "EXPENSE").reduce((sum, item) => sum.plus(item.amount), new Prisma.Decimal(0));
  return { balance: minorUnitsToMoney(balance), income: income.toFixed(2), expense: expense.toFixed(2) };
}

export type TransactionFilters = { from?: string; to?: string; type?: TransactionType; module?: FinanceModule; categoryId?: string; query?: string };

export async function getTransactions(userId: string, filters: TransactionFilters = {}) {
  return prisma.transaction.findMany({
    where: {
      userId,
      deletedAt: null,
      ...(filters.from || filters.to ? { operationDate: { ...(filters.from ? { gte: dateFromInput(filters.from) } : {}), ...(filters.to ? { lte: dateFromInput(filters.to) } : {}) } } : {}),
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.module ? { module: filters.module } : {}),
      ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
      ...(filters.query ? { description: { contains: filters.query, mode: "insensitive" } } : {}),
    },
    include: { category: true },
    orderBy: [{ operationDate: "desc" }, { createdAt: "desc" }],
  });
}

export { CategoryKind, FinanceModule, TransactionType };
