import "server-only";

import { CategoryKind, FinanceModule, Prisma, RecurringFrequency, SavingsGoalStatus } from "@prisma/client";
import { z } from "zod";

import { calculateFamilyTotals, calendarMonthsInRange, nextRecurringDate, periodStart, recurringOccurrences, sumSplitReceipt } from "@/features/family/calculations";
import { positiveMoneyInput } from "@/features/family/validation";
import { dateFromInput, todayInputValue } from "@/lib/dates";
import { minorUnitsToMoney, moneyToMinorUnits } from "@/lib/money";
import { prisma } from "@/lib/prisma";

const dateInput = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Укажите корректную дату.");
const categoryId = z.string().cuid();
const optionalText = z.string().trim().max(500).nullable().transform((value) => value || null);
const decimal = (value: string) => new Prisma.Decimal(value.replace(",", "."));

export const familyOperationSchema = z.object({ type: z.enum(["INCOME", "EXPENSE"]), amount: positiveMoneyInput, operationDate: dateInput, categoryId, accountId: categoryId.nullable(), description: z.string().trim().max(500).default("") });
const splitItemSchema = z.object({ id: z.string().cuid().optional(), categoryId, amount: positiveMoneyInput, description: z.string().trim().max(500).optional() });
export const splitReceiptSchema = z.object({ totalAmount: positiveMoneyInput, operationDate: dateInput, accountId: categoryId.nullable(), description: z.string().trim().max(500).default(""), items: z.array(splitItemSchema).min(2).max(12) }).superRefine((value, context) => {
  if (sumSplitReceipt(value.items) !== moneyToMinorUnits(value.totalAmount)) context.addIssue({ code: z.ZodIssueCode.custom, path: ["items"], message: "Сумма частей должна совпадать с общей суммой чека." });
});
export const recurringPaymentSchema = z.object({ name: z.string().trim().min(1, "Укажите название.").max(120), amount: positiveMoneyInput, categoryId: categoryId.nullable(), accountId: categoryId.nullable(), frequency: z.nativeEnum(RecurringFrequency), nextDueDate: dateInput, endDate: dateInput.nullable(), note: optionalText }).refine((value) => !value.endDate || value.endDate >= value.nextDueDate, { path: ["endDate"], message: "Дата окончания не может быть раньше следующего платежа." });
export const savingsGoalSchema = z.object({ name: z.string().trim().min(1, "Укажите название.").max(120), targetAmount: positiveMoneyInput.nullable(), initialAmount: positiveMoneyInput.nullable().optional(), targetDate: dateInput.nullable(), note: optionalText });
export const categoryMutationSchema = z.object({ name: z.string().trim().min(1, "Укажите название.").max(80), icon: z.string().trim().max(100_000).nullable().refine((value) => !value || !value.startsWith("data:") || /^data:image\/(?:png|jpeg|webp);base64,/.test(value), "Некорректный формат иконки."), kind: z.nativeEnum(CategoryKind) });
export const familyAccountSchema = z.object({ name: z.string().trim().min(1, "Укажите название счёта.").max(80) });

async function assertFamilyCategory(userId: string, selectedCategoryId: string, type: "INCOME" | "EXPENSE") {
  const category = await prisma.category.findFirst({ where: { id: selectedCategoryId, module: FinanceModule.FAMILY, isArchived: false, OR: [{ userId }, { userId: null }] } });
  if (!category || (category.kind !== "BOTH" && category.kind !== type)) throw new Error("Выберите доступную категорию Family.");
}
async function assertFamilyAccount(userId: string, selectedAccountId: string | null) {
  if (!selectedAccountId) return;
  if (!await prisma.familyAccount.findFirst({ where: { id: selectedAccountId, userId, isArchived: false } })) throw new Error("Выберите доступный счёт Family.");
}
async function assertUniqueCategoryName(userId: string, name: string, exceptId?: string) {
  const duplicate = await prisma.category.findFirst({ where: { userId, module: FinanceModule.FAMILY, name: { equals: name.trim(), mode: "insensitive" }, ...(exceptId ? { id: { not: exceptId } } : {}) } });
  if (duplicate) throw new Error("Категория с таким названием уже существует.");
}
async function canManageFamilyCategory(userId: string, id: string) {
  const category = await prisma.category.findFirst({ where: { id, module: FinanceModule.FAMILY, OR: [{ userId }, { userId: null }] } });
  if (!category) return null;
  if (category.userId === userId) return category;
  const userCount = await prisma.user.count();
  return userCount === 1 ? category : null;
}

export async function createFamilyOperation(userId: string, input: z.infer<typeof familyOperationSchema>) {
  await assertFamilyCategory(userId, input.categoryId, input.type);
  await assertFamilyAccount(userId, input.accountId);
  return prisma.transaction.create({ data: { userId, type: input.type, amount: decimal(input.amount), operationDate: dateFromInput(input.operationDate), module: FinanceModule.FAMILY, categoryId: input.categoryId, familyAccountId: input.accountId, description: input.description || null, source: "WEB" }, include: { category: true, familyAccount: true } });
}
export async function createVoiceFamilyOperation(userId: string, voiceRequestId: string, input: z.infer<typeof familyOperationSchema>) {
  const requestId = z.string().uuid().parse(voiceRequestId);
  await assertFamilyCategory(userId, input.categoryId, input.type);
  await assertFamilyAccount(userId, input.accountId);
  return prisma.transaction.upsert({
    where: { userId_voiceRequestId: { userId, voiceRequestId: requestId } },
    update: {},
    create: { userId, type: input.type, amount: decimal(input.amount), operationDate: dateFromInput(input.operationDate), module: FinanceModule.FAMILY, categoryId: input.categoryId, familyAccountId: input.accountId, description: input.description || null, source: "WEB", voiceRequestId: requestId },
    include: { category: true, familyAccount: true },
  });
}
export async function updateFamilyOperation(userId: string, id: string, input: z.infer<typeof familyOperationSchema>) {
  const current = await prisma.transaction.findFirst({ where: { id, userId, module: FinanceModule.FAMILY, deletedAt: null }, include: { savingsMovement: true } });
  if (!current) throw new Error("Операция Family не найдена.");
  if (current.receiptId || current.recurringPaymentId || current.savingsMovement) throw new Error("Связанную операцию нужно изменять в её исходном разделе.");
  await assertFamilyCategory(userId, input.categoryId, input.type);
  await assertFamilyAccount(userId, input.accountId);
  return prisma.transaction.update({ where: { id }, data: { type: input.type, amount: decimal(input.amount), operationDate: dateFromInput(input.operationDate), categoryId: input.categoryId, familyAccountId: input.accountId, description: input.description || null }, include: { category: true, familyAccount: true } });
}
export async function softDeleteFamilyOperation(userId: string, id: string) {
  const current = await prisma.transaction.findFirst({ where: { id, userId, module: FinanceModule.FAMILY, deletedAt: null }, include: { savingsMovement: true } });
  if (!current) throw new Error("Операция Family не найдена.");
  if (current.receiptId || current.recurringPaymentId || current.savingsMovement) throw new Error("Связанную операцию нужно удалить в её исходном разделе.");
  return prisma.transaction.update({ where: { id }, data: { deletedAt: new Date() } });
}

export async function createSplitReceipt(userId: string, input: z.infer<typeof splitReceiptSchema>) {
  for (const item of input.items) await assertFamilyCategory(userId, item.categoryId, "EXPENSE");
  await assertFamilyAccount(userId, input.accountId);
  return prisma.$transaction(async (database) => {
    const receipt = await database.receipt.create({ data: { userId, totalAmount: decimal(input.totalAmount), description: input.description || null, operationDate: dateFromInput(input.operationDate) } });
    const transactions = await Promise.all(input.items.map((item) => database.transaction.create({ data: { userId, type: "EXPENSE", amount: decimal(item.amount), operationDate: dateFromInput(input.operationDate), module: FinanceModule.FAMILY, categoryId: item.categoryId, familyAccountId: input.accountId, description: item.description || input.description || null, receiptId: receipt.id, source: "WEB" }, include: { category: true, familyAccount: true } })));
    return { receipt, transactions };
  });
}
export async function getSplitReceipt(userId: string, id: string) {
  const receipt = await prisma.receipt.findFirst({ where: { id, userId, deletedAt: null }, include: { transactions: { where: { deletedAt: null }, include: { category: true, familyAccount: true }, orderBy: { createdAt: "asc" } } } });
  if (!receipt) throw new Error("Чек не найден."); return receipt;
}
export async function updateSplitReceipt(userId: string, id: string, input: z.infer<typeof splitReceiptSchema>) {
  for (const item of input.items) await assertFamilyCategory(userId, item.categoryId, "EXPENSE");
  await assertFamilyAccount(userId, input.accountId);
  if (!await prisma.receipt.findFirst({ where: { id, userId, deletedAt: null } })) throw new Error("Чек не найден.");
  return prisma.$transaction(async (database) => {
    await database.transaction.updateMany({ where: { receiptId: id, userId, deletedAt: null }, data: { deletedAt: new Date() } });
    const receipt = await database.receipt.update({ where: { id }, data: { totalAmount: decimal(input.totalAmount), operationDate: dateFromInput(input.operationDate), description: input.description || null } });
    await Promise.all(input.items.map((item) => database.transaction.create({ data: { userId, type: "EXPENSE", amount: decimal(item.amount), operationDate: dateFromInput(input.operationDate), module: FinanceModule.FAMILY, categoryId: item.categoryId, familyAccountId: input.accountId, description: item.description || input.description || null, receiptId: id, source: "WEB" } })));
    return receipt;
  });
}
export async function deleteSplitReceipt(userId: string, id: string) {
  if (!await prisma.receipt.findFirst({ where: { id, userId, deletedAt: null } })) throw new Error("Чек не найден.");
  return prisma.$transaction([prisma.receipt.update({ where: { id }, data: { deletedAt: new Date() } }), prisma.transaction.updateMany({ where: { receiptId: id, userId, deletedAt: null }, data: { deletedAt: new Date() } })]);
}

export async function getFamilyCategories(userId: string, type?: "INCOME" | "EXPENSE", includeArchived = false) {
  return prisma.category.findMany({ where: { module: FinanceModule.FAMILY, ...(includeArchived ? {} : { isArchived: false }), OR: [{ userId }, { userId: null }], ...(type ? { AND: [{ OR: [{ kind: type }, { kind: "BOTH" }] }] } : {}) }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
}
export async function createFamilyCategory(userId: string, input: z.infer<typeof categoryMutationSchema>) {
  await assertUniqueCategoryName(userId, input.name); const last = await prisma.category.aggregate({ where: { userId, module: FinanceModule.FAMILY }, _max: { sortOrder: true } });
  return prisma.category.create({ data: { userId, module: FinanceModule.FAMILY, name: input.name.trim(), icon: input.icon, kind: input.kind, sortOrder: (last._max.sortOrder ?? 0) + 1 } });
}
export async function updateFamilyCategory(userId: string, id: string, input: z.infer<typeof categoryMutationSchema>) {
  if (!await canManageFamilyCategory(userId, id)) throw new Error("Эту категорию нельзя изменить."); await assertUniqueCategoryName(userId, input.name, id);
  return prisma.category.update({ where: { id }, data: { userId, name: input.name.trim(), icon: input.icon, kind: input.kind, isArchived: false } });
}
export async function deleteFamilyCategory(userId: string, id: string) {
  if (!await canManageFamilyCategory(userId, id)) throw new Error("Эту категорию нельзя удалить.");
  return prisma.category.delete({ where: { id } });
}
export async function setFamilyCategoryArchived(userId: string, id: string, isArchived: boolean) {
  if (!await prisma.category.findFirst({ where: { id, userId, module: FinanceModule.FAMILY } })) throw new Error("Можно изменять только собственные категории.");
  return prisma.category.update({ where: { id }, data: { isArchived } });
}
export async function moveFamilyCategory(userId: string, id: string, direction: "UP" | "DOWN") {
  const items = await prisma.category.findMany({ where: { userId, module: FinanceModule.FAMILY, isArchived: false }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }); const index = items.findIndex((item) => item.id === id); const swap = direction === "UP" ? index - 1 : index + 1;
  if (index < 0 || swap < 0 || swap >= items.length) return;
  await prisma.$transaction([prisma.category.update({ where: { id: items[index].id }, data: { sortOrder: items[swap].sortOrder } }), prisma.category.update({ where: { id: items[swap].id }, data: { sortOrder: items[index].sortOrder } })]);
}

export async function getFamilyAccounts(userId: string, includeArchived = false) {
  return prisma.familyAccount.findMany({ where: { userId, ...(includeArchived ? {} : { isArchived: false }) }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
}
export async function createFamilyAccount(userId: string, input: z.infer<typeof familyAccountSchema>) {
  const name = input.name.trim();
  if (await prisma.familyAccount.findFirst({ where: { userId, name: { equals: name, mode: "insensitive" } } })) throw new Error("Счёт с таким названием уже существует.");
  const last = await prisma.familyAccount.aggregate({ where: { userId }, _max: { sortOrder: true } });
  return prisma.familyAccount.create({ data: { userId, name, sortOrder: (last._max.sortOrder ?? 0) + 1 } });
}
export async function updateFamilyAccount(userId: string, id: string, input: z.infer<typeof familyAccountSchema>) {
  if (!await prisma.familyAccount.findFirst({ where: { id, userId } })) throw new Error("Счёт не найден.");
  const name = input.name.trim();
  if (await prisma.familyAccount.findFirst({ where: { userId, name: { equals: name, mode: "insensitive" }, id: { not: id } } })) throw new Error("Счёт с таким названием уже существует.");
  return prisma.familyAccount.update({ where: { id }, data: { name } });
}
export async function deleteFamilyAccount(userId: string, id: string) {
  if (!await prisma.familyAccount.findFirst({ where: { id, userId } })) throw new Error("Счёт не найден.");
  return prisma.familyAccount.delete({ where: { id } });
}
export async function setFamilyAccountArchived(userId: string, id: string, isArchived: boolean) {
  if (!await prisma.familyAccount.findFirst({ where: { id, userId } })) throw new Error("Счёт не найден.");
  return prisma.familyAccount.update({ where: { id }, data: { isArchived } });
}
export async function moveFamilyAccount(userId: string, id: string, direction: "UP" | "DOWN") {
  const items = await getFamilyAccounts(userId); const index = items.findIndex((item) => item.id === id); const swap = direction === "UP" ? index - 1 : index + 1;
  if (index < 0 || swap < 0 || swap >= items.length) return;
  await prisma.$transaction([prisma.familyAccount.update({ where: { id: items[index].id }, data: { sortOrder: items[swap].sortOrder } }), prisma.familyAccount.update({ where: { id: items[swap].id }, data: { sortOrder: items[index].sortOrder } })]);
}

export type FamilyFilters = { from?: string; to?: string; categoryId?: string; accountId?: string; type?: "INCOME" | "EXPENSE" };
export async function getFamilyTransactions(userId: string, filters: FamilyFilters = {}) {
  return prisma.transaction.findMany({ where: { userId, module: FinanceModule.FAMILY, deletedAt: null, type: filters.type, categoryId: filters.categoryId, familyAccountId: filters.accountId, ...(filters.from || filters.to ? { operationDate: { ...(filters.from ? { gte: dateFromInput(filters.from) } : {}), ...(filters.to ? { lte: dateFromInput(filters.to) } : {}) } } : {}) }, include: { category: true, familyAccount: true, receipt: true, savingsMovement: true }, orderBy: [{ operationDate: "desc" }, { createdAt: "desc" }] });
}
const rangeFor = (period: "TODAY" | "WEEK" | "MONTH" | "THREE_MONTHS" | "YEAR", custom?: { from: string; to: string }) => { const today = dateFromInput(todayInputValue()); if (custom) return { from: dateFromInput(custom.from), to: dateFromInput(custom.to) }; if (period === "THREE_MONTHS") { const from = new Date(today); from.setUTCMonth(from.getUTCMonth() - 2, 1); return { from, to: today }; } return { from: periodStart(period, today), to: today }; };
export async function getFamilyReport(userId: string, period: "TODAY" | "WEEK" | "MONTH" | "YEAR" = "MONTH") {
  const { from, to } = rangeFor(period); const transactions = await prisma.transaction.findMany({ where: { userId, module: FinanceModule.FAMILY, deletedAt: null, operationDate: { gte: from, lte: to } }, include: { category: true } });
  const totals = calculateFamilyTotals(transactions.map((item) => ({ amount: item.amount.toString(), categoryName: item.category?.name ?? null, operationDate: item.operationDate, type: item.type as "INCOME" | "EXPENSE" | "SAVING_IN" | "SAVING_OUT" })));
  return { from, to, income: minorUnitsToMoney(totals.income), expense: minorUnitsToMoney(totals.expense), balance: minorUnitsToMoney(totals.balance), savings: minorUnitsToMoney(totals.savings), expensesByCategory: [...totals.expensesByCategory.entries()].map(([name, amount]) => ({ name, amount: minorUnitsToMoney(amount) })), incomeByCategory: [...totals.incomeByCategory.entries()].map(([name, amount]) => ({ name, amount: minorUnitsToMoney(amount) })) };
}
export async function getFamilyAnalytics(userId: string, period: "MONTH" | "THREE_MONTHS" | "YEAR" = "MONTH", custom?: { from: string; to: string }) {
  const { from, to } = rangeFor(period, custom); const transactions = await prisma.transaction.findMany({ where: { userId, module: FinanceModule.FAMILY, deletedAt: null, operationDate: { gte: from, lte: to }, type: { in: ["INCOME", "EXPENSE"] } }, include: { category: true } });
  const totals = calculateFamilyTotals(transactions.map((item) => ({ amount: item.amount.toString(), categoryName: item.category?.name ?? null, operationDate: item.operationDate, type: item.type as "INCOME" | "EXPENSE" })));
  const expenses = transactions.filter((entry) => entry.type === "EXPENSE"); const expenseTrend: Array<{ key: string; label: string; amount: string }> = [];
  if (period === "MONTH" && !custom) {
    const daysInMonth = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, 0)).getUTCDate(); const buckets = Array.from({ length: Math.ceil(daysInMonth / 7) }, () => 0n);
    for (const item of expenses) { const index = Math.floor((item.operationDate.getUTCDate() - 1) / 7); buckets[index] += moneyToMinorUnits(item.amount.toString()); }
    buckets.forEach((amount, index) => { const start = index * 7 + 1; const finish = Math.min(start + 6, daysInMonth); expenseTrend.push({ key: `${from.toISOString().slice(0, 7)}-${index}`, label: `${start}–${finish}`, amount: minorUnitsToMoney(amount) }); });
  } else {
    const monthBuckets = new Map<string, bigint>();
    for (const item of expenses) { const key = item.operationDate.toISOString().slice(0, 7); monthBuckets.set(key, (monthBuckets.get(key) ?? 0n) + moneyToMinorUnits(item.amount.toString())); }
    const cursor = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 1, 12)); const end = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), 1, 12));
    while (cursor <= end) { const key = cursor.toISOString().slice(0, 7); expenseTrend.push({ key, label: cursor.toLocaleDateString("ru-RU", { month: "short" }).replace(".", ""), amount: minorUnitsToMoney(monthBuckets.get(key) ?? 0n) }); cursor.setUTCMonth(cursor.getUTCMonth() + 1); }
  }
  const historyMonthDates = calendarMonthsInRange(from, to);
  const historyFrom = historyMonthDates[0]!;
  const historyStart = historyFrom < from ? from : historyFrom;
  const historyExpenses = await prisma.transaction.findMany({
    where: { userId, module: FinanceModule.FAMILY, deletedAt: null, type: "EXPENSE", operationDate: { gte: historyStart, lte: to } },
    include: { category: true },
  });
  const historyMonths = historyMonthDates.map((date) => {
    return { key: date.toISOString().slice(0, 7), label: date.toLocaleDateString("ru-RU", { month: "short", year: "2-digit", timeZone: "UTC" }).replace(" г.", "").replace(".", "") };
  });
  const historyByCategory = new Map<string, Map<string, bigint>>();
  for (const item of historyExpenses) {
    const name = item.category?.name ?? "Без категории"; const month = item.operationDate.toISOString().slice(0, 7);
    const categoryMonths = historyByCategory.get(name) ?? new Map<string, bigint>();
    categoryMonths.set(month, (categoryMonths.get(month) ?? 0n) + moneyToMinorUnits(item.amount.toString())); historyByCategory.set(name, categoryMonths);
  }
  const categoryHistory = {
    months: historyMonths,
    rows: [...historyByCategory.entries()].map(([name, categoryMonths]) => {
      const amounts = historyMonths.map((month) => categoryMonths.get(month.key) ?? 0n); const total = amounts.reduce((sum, amount) => sum + amount, 0n);
      return { name, values: amounts.map(minorUnitsToMoney), total: minorUnitsToMoney(total), totalMinor: total };
    }).sort((a, b) => Number(b.totalMinor - a.totalMinor)).map(({ name, values, total }) => ({ name, values, total })),
  };
  return { from, to, income: minorUnitsToMoney(totals.income), expense: minorUnitsToMoney(totals.expense), result: minorUnitsToMoney(totals.balance), expensesByCategory: [...totals.expensesByCategory.entries()].sort((a, b) => Number(b[1] - a[1])).map(([name, amount]) => ({ name, amount: minorUnitsToMoney(amount), percent: totals.expense ? Number(amount * 100n / totals.expense) : 0 })), expenseTrend, categoryHistory };
}

export async function createSavingsGoal(userId: string, input: z.infer<typeof savingsGoalSchema>) {
  return prisma.$transaction(async (database) => { const goal = await database.savingsGoal.create({ data: { userId, name: input.name, targetAmount: input.targetAmount ? decimal(input.targetAmount) : null, targetDate: input.targetDate ? dateFromInput(input.targetDate) : null, note: input.note } }); if (input.initialAmount) { const transaction = await database.transaction.create({ data: { userId, type: "SAVING_IN", amount: decimal(input.initialAmount), operationDate: dateFromInput(todayInputValue()), module: FinanceModule.FAMILY, description: `Начальная сумма: ${goal.name}`, source: "WEB" } }); await database.savingsMovement.create({ data: { goalId: goal.id, transactionId: transaction.id, direction: "SAVING_IN", amount: decimal(input.initialAmount) } }); } return goal; });
}
export async function updateSavingsGoal(userId: string, id: string, input: z.infer<typeof savingsGoalSchema>) { if (!await prisma.savingsGoal.findFirst({ where: { id, userId } })) throw new Error("Цель не найдена."); return prisma.savingsGoal.update({ where: { id }, data: { name: input.name, targetAmount: input.targetAmount ? decimal(input.targetAmount) : null, targetDate: input.targetDate ? dateFromInput(input.targetDate) : null, note: input.note } }); }
export async function setSavingsGoalStatus(userId: string, id: string, status: SavingsGoalStatus) { if (!await prisma.savingsGoal.findFirst({ where: { id, userId } })) throw new Error("Цель не найдена."); return prisma.savingsGoal.update({ where: { id }, data: { status } }); }
export async function createSavingsMovement(userId: string, goalId: string, direction: "SAVING_IN" | "SAVING_OUT", amount: string, operationDate: string, description: string) {
  positiveMoneyInput.parse(amount); dateInput.parse(operationDate); if (!await prisma.savingsGoal.findFirst({ where: { id: goalId, userId, status: { not: "ARCHIVED" } } })) throw new Error("Цель накоплений не найдена.");
  return prisma.$transaction(async (database) => { const transaction = await database.transaction.create({ data: { userId, type: direction, amount: decimal(amount), operationDate: dateFromInput(operationDate), module: FinanceModule.FAMILY, description: description.trim() || null, source: "WEB" } }); return database.savingsMovement.create({ data: { goalId, transactionId: transaction.id, direction, amount: decimal(amount) } }); });
}
export async function updateSavingsMovement(userId: string, id: string, direction: "SAVING_IN" | "SAVING_OUT", amount: string, operationDate: string, description: string) { positiveMoneyInput.parse(amount); dateInput.parse(operationDate); const movement = await prisma.savingsMovement.findFirst({ where: { id, goal: { userId }, transaction: { deletedAt: null } } }); if (!movement) throw new Error("Движение не найдено."); return prisma.$transaction([prisma.savingsMovement.update({ where: { id }, data: { direction, amount: decimal(amount) } }), prisma.transaction.update({ where: { id: movement.transactionId }, data: { type: direction, amount: decimal(amount), operationDate: dateFromInput(operationDate), description: description.trim() || null } })]); }
export async function deleteSavingsMovement(userId: string, id: string) { const movement = await prisma.savingsMovement.findFirst({ where: { id, goal: { userId }, transaction: { deletedAt: null } } }); if (!movement) throw new Error("Движение не найдено."); return prisma.transaction.update({ where: { id: movement.transactionId }, data: { deletedAt: new Date() } }); }
export async function getSavingsGoals(userId: string, includeInactive = false) { const goals = await prisma.savingsGoal.findMany({ where: { userId, ...(includeInactive ? {} : { status: "ACTIVE" }) }, include: { movements: { include: { transaction: true }, orderBy: { createdAt: "desc" } } }, orderBy: { createdAt: "asc" } }); return goals.map((goal) => ({ ...goal, currentAmount: goal.movements.filter((item) => !item.transaction.deletedAt).reduce((total, item) => total + (item.direction === "SAVING_IN" ? moneyToMinorUnits(item.amount.toString()) : -moneyToMinorUnits(item.amount.toString())), 0n) })); }

export async function createRecurringPayment(userId: string, input: z.infer<typeof recurringPaymentSchema>) { if (input.categoryId) await assertFamilyCategory(userId, input.categoryId, "EXPENSE"); await assertFamilyAccount(userId, input.accountId); return prisma.recurringPayment.create({ data: { userId, name: input.name, amount: decimal(input.amount), categoryId: input.categoryId, familyAccountId: input.accountId, frequency: input.frequency, nextDueDate: dateFromInput(input.nextDueDate), endDate: input.endDate ? dateFromInput(input.endDate) : null, note: input.note } }); }
export async function getRecurringPayments(userId: string, includeInactive = false) { return prisma.recurringPayment.findMany({ where: { userId, archivedAt: null, ...(includeInactive ? {} : { isActive: true }) }, include: { category: true, familyAccount: true }, orderBy: { nextDueDate: "asc" } }); }
export async function getRecurringPaymentProgress(userId: string, from: Date, to: Date) {
  const today = dateFromInput(todayInputValue());
  const payments = await prisma.recurringPayment.findMany({ where: { userId, archivedAt: null }, include: { transactions: { where: { deletedAt: null, operationDate: { gte: from, lte: to } } } } });
  let paid = 0n; let remaining = 0n; let overdue = 0n; let paidCount = 0; let remainingCount = 0; let overdueCount = 0;
  for (const payment of payments) {
    for (const transaction of payment.transactions) { paid += moneyToMinorUnits(transaction.amount.toString()); paidCount += 1; }
    if (!payment.isActive) continue;
    const occurrences = recurringOccurrences(payment.nextDueDate, payment.endDate, payment.frequency, from, to, today);
    const amount = moneyToMinorUnits(payment.amount.toString());
    overdue += amount * BigInt(occurrences.overdue.length); overdueCount += occurrences.overdue.length;
    remaining += amount * BigInt(occurrences.scheduled.length); remainingCount += occurrences.scheduled.length;
  }
  const planned = paid + remaining + overdue;
  return { planned: minorUnitsToMoney(planned), paid: minorUnitsToMoney(paid), remaining: minorUnitsToMoney(remaining), overdue: minorUnitsToMoney(overdue), paidCount, remainingCount, overdueCount, percent: planned > 0n ? Number(paid * 100n / planned) : 0 };
}
export async function getRecurringPayment(userId: string, id: string) { const item = await prisma.recurringPayment.findFirst({ where: { id, userId, archivedAt: null }, include: { category: true, familyAccount: true } }); if (!item) throw new Error("Обязательный платёж не найден."); return item; }
export async function updateRecurringPayment(userId: string, id: string, input: z.infer<typeof recurringPaymentSchema>) { const current = await getRecurringPayment(userId, id); if (input.categoryId) await assertFamilyCategory(userId, input.categoryId, "EXPENSE"); await assertFamilyAccount(userId, input.accountId); return prisma.recurringPayment.update({ where: { id: current.id }, data: { name: input.name, amount: decimal(input.amount), categoryId: input.categoryId, familyAccountId: input.accountId, frequency: input.frequency, nextDueDate: dateFromInput(input.nextDueDate), endDate: input.endDate ? dateFromInput(input.endDate) : null, note: input.note } }); }
export async function toggleRecurringPayment(userId: string, id: string, isActive: boolean) { const current = await getRecurringPayment(userId, id); return prisma.recurringPayment.update({ where: { id: current.id }, data: { isActive } }); }
export async function archiveRecurringPayment(userId: string, id: string) { const current = await getRecurringPayment(userId, id); return prisma.recurringPayment.update({ where: { id: current.id }, data: { isActive: false, archivedAt: new Date() } }); }
export async function payRecurringPayment(userId: string, id: string) {
  return prisma.$transaction(async (database) => { const payment = await database.recurringPayment.findFirst({ where: { id, userId, isActive: true, archivedAt: null } }); if (!payment) throw new Error("Обязательный платёж не найден."); const dueDate = payment.nextDueDate; const nextDate = nextRecurringDate(dueDate, payment.frequency); const remainsActive = !payment.endDate || nextDate <= payment.endDate; const claimed = await database.recurringPayment.updateMany({ where: { id, userId, isActive: true, nextDueDate: dueDate }, data: { nextDueDate: nextDate, isActive: remainsActive } }); if (claimed.count !== 1) throw new Error("Этот платёж уже обработан."); return database.transaction.upsert({ where: { recurringPaymentId_operationDate: { recurringPaymentId: id, operationDate: dueDate } }, update: {}, create: { userId, type: "EXPENSE", amount: payment.amount, operationDate: dueDate, module: FinanceModule.FAMILY, categoryId: payment.categoryId, familyAccountId: payment.familyAccountId, description: payment.name, recurringPaymentId: payment.id, source: "WEB" } }); });
}
