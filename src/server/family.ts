import "server-only";

import { FinanceModule, Prisma, RecurringFrequency } from "@prisma/client";
import { z } from "zod";

import { dateFromInput, todayInputValue } from "@/lib/dates";
import { minorUnitsToMoney, moneyToMinorUnits } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { calculateFamilyTotals, nextRecurringDate, periodStart } from "@/features/family/calculations";

const moneyInput = z.string().trim().regex(/^\d+(?:[.,]\d{1,2})?$/, "Вкажіть коректну суму.");
const dateInput = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const categoryId = z.string().cuid();

export const familyOperationSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: moneyInput,
  operationDate: dateInput,
  categoryId,
  description: z.string().trim().min(1, "Додайте опис.").max(500),
});

export const splitReceiptSchema = z.object({
  operationDate: dateInput,
  description: z.string().trim().min(1, "Додайте опис чека.").max(500),
  items: z.array(z.object({ categoryId, amount: moneyInput, description: z.string().trim().max(500).optional() })).min(2).max(12),
});

export const recurringPaymentSchema = z.object({
  name: z.string().trim().min(1).max(120),
  amount: moneyInput,
  categoryId: categoryId.nullable(),
  frequency: z.nativeEnum(RecurringFrequency),
  nextDueDate: dateInput,
  note: z.string().trim().max(500).nullable(),
});

export const savingsGoalSchema = z.object({
  name: z.string().trim().min(1).max(120),
  targetAmount: moneyInput.nullable(),
  note: z.string().trim().max(500).nullable(),
});

const familyType = (value: FormDataEntryValue | null) => value === "INCOME" ? "INCOME" : "EXPENSE";
const decimal = (value: string) => new Prisma.Decimal(value.replace(",", "."));

async function assertFamilyCategory(userId: string, selectedCategoryId: string, type: "INCOME" | "EXPENSE") {
  const category = await prisma.category.findFirst({
    where: { id: selectedCategoryId, module: FinanceModule.FAMILY, isArchived: false, OR: [{ userId }, { userId: null }] },
  });
  if (!category || (category.kind !== "BOTH" && category.kind !== type)) throw new Error("Оберіть доступну категорію Family.");
}

export function parseFamilyOperationForm(formData: FormData) {
  const parsed = familyOperationSchema.safeParse({ type: familyType(formData.get("type")), amount: formData.get("amount"), operationDate: formData.get("operationDate"), categoryId: formData.get("categoryId"), description: formData.get("description") });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Перевірте дані.");
  return parsed.data;
}

export async function createFamilyOperation(userId: string, input: z.infer<typeof familyOperationSchema>) {
  await assertFamilyCategory(userId, input.categoryId, input.type);
  return prisma.transaction.create({ data: { userId, type: input.type, amount: decimal(input.amount), operationDate: dateFromInput(input.operationDate), module: FinanceModule.FAMILY, categoryId: input.categoryId, description: input.description, source: "WEB" }, include: { category: true } });
}

export async function updateFamilyOperation(userId: string, id: string, input: z.infer<typeof familyOperationSchema>) {
  const current = await prisma.transaction.findFirst({ where: { id, userId, module: FinanceModule.FAMILY, deletedAt: null } });
  if (!current) throw new Error("Запис Family не знайдено.");
  await assertFamilyCategory(userId, input.categoryId, input.type);
  return prisma.transaction.update({ where: { id }, data: { type: input.type, amount: decimal(input.amount), operationDate: dateFromInput(input.operationDate), categoryId: input.categoryId, description: input.description }, include: { category: true } });
}

export async function softDeleteFamilyOperation(userId: string, id: string) {
  const current = await prisma.transaction.findFirst({ where: { id, userId, module: FinanceModule.FAMILY, deletedAt: null } });
  if (!current) throw new Error("Запис Family не знайдено.");
  return prisma.transaction.update({ where: { id }, data: { deletedAt: new Date() } });
}

export async function createSplitReceipt(userId: string, input: z.infer<typeof splitReceiptSchema>) {
  for (const item of input.items) await assertFamilyCategory(userId, item.categoryId, "EXPENSE");
  return prisma.$transaction(async (database) => {
    const receipt = await database.receipt.create({ data: { userId, description: input.description, operationDate: dateFromInput(input.operationDate) } });
    const transactions = await Promise.all(input.items.map((item) => database.transaction.create({ data: { userId, type: "EXPENSE", amount: decimal(item.amount), operationDate: dateFromInput(input.operationDate), module: FinanceModule.FAMILY, categoryId: item.categoryId, description: item.description || input.description, receiptId: receipt.id, source: "WEB" }, include: { category: true } })));
    return { receipt, transactions };
  });
}

export async function getFamilyCategories(userId: string, type?: "INCOME" | "EXPENSE") {
  return prisma.category.findMany({ where: { module: FinanceModule.FAMILY, isArchived: false, OR: [{ userId }, { userId: null }], ...(type ? { AND: [{ OR: [{ kind: type }, { kind: "BOTH" }] }] } : {}) }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
}

export type FamilyFilters = { from?: string; to?: string; categoryId?: string; type?: "INCOME" | "EXPENSE" };

export async function getFamilyTransactions(userId: string, filters: FamilyFilters = {}) {
  return prisma.transaction.findMany({ where: { userId, module: FinanceModule.FAMILY, deletedAt: null, type: filters.type, categoryId: filters.categoryId, ...(filters.from || filters.to ? { operationDate: { ...(filters.from ? { gte: dateFromInput(filters.from) } : {}), ...(filters.to ? { lte: dateFromInput(filters.to) } : {}) } } : {}) }, include: { category: true, receipt: true }, orderBy: [{ operationDate: "desc" }, { createdAt: "desc" }] });
}

export async function getFamilyReport(userId: string, period: "TODAY" | "WEEK" | "MONTH" | "YEAR" = "MONTH") {
  const from = periodStart(period, dateFromInput(todayInputValue()));
  const [transactions, allSavings] = await Promise.all([
    prisma.transaction.findMany({ where: { userId, module: FinanceModule.FAMILY, deletedAt: null, operationDate: { gte: from } }, include: { category: true } }),
    prisma.savingsMovement.findMany({ where: { goal: { userId }, transaction: { deletedAt: null } }, include: { transaction: true } }),
  ]);
  const totals = calculateFamilyTotals(transactions.map((transaction) => ({ amount: transaction.amount.toString(), categoryName: transaction.category?.name ?? null, operationDate: transaction.operationDate, type: transaction.type as "INCOME" | "EXPENSE" | "SAVING_IN" | "SAVING_OUT" })));
  const savings = allSavings.reduce((total, movement) => total + (movement.direction === "SAVING_IN" ? moneyToMinorUnits(movement.amount.toString()) : -moneyToMinorUnits(movement.amount.toString())), 0n);
  return { from, income: minorUnitsToMoney(totals.income), expense: minorUnitsToMoney(totals.expense), balance: minorUnitsToMoney(totals.balance), savings: minorUnitsToMoney(savings), expensesByCategory: [...totals.expensesByCategory.entries()].map(([name, amount]) => ({ name, amount: minorUnitsToMoney(amount) })), incomeByCategory: [...totals.incomeByCategory.entries()].map(([name, amount]) => ({ name, amount: minorUnitsToMoney(amount) })) };
}

export async function createSavingsGoal(userId: string, input: z.infer<typeof savingsGoalSchema>) {
  return prisma.savingsGoal.create({ data: { userId, name: input.name, targetAmount: input.targetAmount ? decimal(input.targetAmount) : null, note: input.note } });
}

export async function createSavingsMovement(userId: string, goalId: string, direction: "SAVING_IN" | "SAVING_OUT", amount: string, operationDate: string, description: string) {
  const goal = await prisma.savingsGoal.findFirst({ where: { id: goalId, userId, status: "ACTIVE" } });
  if (!goal) throw new Error("Ціль накопичень не знайдено.");
  return prisma.$transaction(async (database) => {
    const transaction = await database.transaction.create({ data: { userId, type: direction, amount: decimal(amount), operationDate: dateFromInput(operationDate), module: FinanceModule.FAMILY, description, source: "WEB" } });
    return database.savingsMovement.create({ data: { goalId, transactionId: transaction.id, direction, amount: decimal(amount) } });
  });
}

export async function getSavingsGoals(userId: string) {
  const goals = await prisma.savingsGoal.findMany({ where: { userId, status: "ACTIVE" }, include: { movements: { include: { transaction: true } } }, orderBy: { createdAt: "asc" } });
  return goals.map((goal) => ({ ...goal, currentAmount: goal.movements.filter((movement) => !movement.transaction.deletedAt).reduce((total, movement) => total + (movement.direction === "SAVING_IN" ? moneyToMinorUnits(movement.amount.toString()) : -moneyToMinorUnits(movement.amount.toString())), 0n) }));
}

export async function createRecurringPayment(userId: string, input: z.infer<typeof recurringPaymentSchema>) {
  if (input.categoryId) await assertFamilyCategory(userId, input.categoryId, "EXPENSE");
  return prisma.recurringPayment.create({ data: { userId, name: input.name, amount: decimal(input.amount), categoryId: input.categoryId, frequency: input.frequency, nextDueDate: dateFromInput(input.nextDueDate), note: input.note } });
}

export async function getRecurringPayments(userId: string) {
  return prisma.recurringPayment.findMany({ where: { userId, isActive: true }, include: { category: true }, orderBy: { nextDueDate: "asc" } });
}

export async function payRecurringPayment(userId: string, id: string) {
  const payment = await prisma.recurringPayment.findFirst({ where: { id, userId, isActive: true } });
  if (!payment) throw new Error("Обов'язковий платіж не знайдено.");
  return prisma.$transaction(async (database) => {
    const transaction = await database.transaction.create({ data: { userId, type: "EXPENSE", amount: payment.amount, operationDate: payment.nextDueDate, module: FinanceModule.FAMILY, categoryId: payment.categoryId, description: payment.name, recurringPaymentId: payment.id, source: "WEB" } });
    await database.recurringPayment.update({ where: { id }, data: { nextDueDate: nextRecurringDate(payment.nextDueDate, payment.frequency) } });
    return transaction;
  });
}
