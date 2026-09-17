import "server-only";

import { FinanceModule, MoneyAccountKind, MoneyAccountType, Prisma } from "@prisma/client";
import { z } from "zod";

import { calculateMoneyAccountBalance, summarizeProjectMoney, validateInternalAllocation, validateTransferCancellation } from "@/features/money/calculations";
import { minorUnitsToMoney, moneyToMinorUnits } from "@/lib/money";
import { prisma } from "@/lib/prisma";

export const moneyProjects = [
  { code: FinanceModule.FAMILY, name: "Семья", sortOrder: 10 },
  { code: FinanceModule.POULTRY, name: "Птицеводство", sortOrder: 20 },
  { code: FinanceModule.GOODS, name: "Товарка", sortOrder: 30 },
  { code: FinanceModule.INFOBUSINESS, name: "Инфобизнес", sortOrder: 40 },
  { code: FinanceModule.COSMETOLOGY, name: "Косметология", sortOrder: 50 },
] as const;

const currencySchema = z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/, "Валюта должна состоять из трёх букв.");
const optionalMoney = z.preprocess((value) => value === "" || value == null ? undefined : value, z.coerce.number().nonnegative().max(999999999999).optional());
const optionalDate = z.preprocess((value) => value === "" || value == null ? undefined : value, z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional());

export const moneyAccountSchema = z.object({
  projectCode: z.nativeEnum(FinanceModule).refine((code) => code !== FinanceModule.GENERAL),
  kind: z.nativeEnum(MoneyAccountKind),
  name: z.string().trim().min(1, "Введите название.").max(80),
  type: z.nativeEnum(MoneyAccountType).default(MoneyAccountType.OTHER),
  currency: currencySchema.default("UAH"),
  openingBalance: z.coerce.number().nonnegative().max(999999999999).default(0),
  targetAmount: optionalMoney,
  targetDate: optionalDate,
  note: z.string().trim().max(500).optional().nullable(),
  isPrimary: z.coerce.boolean().default(false),
});

export const internalAllocationSchema = z.object({
  sourceAccountId: z.string().min(1),
  targetAccountId: z.string().min(1),
  amount: z.coerce.number().positive("Введите сумму больше нуля.").max(999999999999),
  operationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  comment: z.string().trim().max(500).optional().nullable(),
  idempotencyKey: z.string().trim().min(8).max(100),
});

type AllocationInput = z.output<typeof internalAllocationSchema>;

function dateOnly(value?: string) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

async function ensureProjects(userId: string) {
  await prisma.$transaction(moneyProjects.map((project) => prisma.project.upsert({
    where: { userId_code: { userId, code: project.code } },
    update: {},
    create: { userId, ...project },
  })));
}

export async function getMoneyProjects(userId: string) {
  await ensureProjects(userId);
  return prisma.project.findMany({ where: { userId, isActive: true, code: { not: FinanceModule.GENERAL } }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
}

export async function getMoneyWorkspace(userId: string, projectCode: FinanceModule) {
  await ensureProjects(userId);
  const project = await prisma.project.findUniqueOrThrow({ where: { userId_code: { userId, code: projectCode } } });
  const accounts = await prisma.moneyAccount.findMany({
    where: { userId, projectId: project.id },
    include: { moneyLedgerEntries: { where: { reversedAt: null }, select: { amount: true, reversedAt: true }, orderBy: { operationDate: "asc" } } },
    orderBy: [{ isActive: "desc" }, { kind: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
  });
  const withBalances = accounts.map((account) => ({
    ...account,
    balanceMinor: calculateMoneyAccountBalance({ openingBalance: account.openingBalance.toString(), entries: account.moneyLedgerEntries.map((entry) => ({ amount: entry.amount.toString(), reversedAt: entry.reversedAt })) }),
  }));
  const currencies = [...new Set(withBalances.map((account) => account.currency))];
  const summaries = currencies.map((currency) => ({ currency, ...summarizeProjectMoney(withBalances.filter((account) => account.currency === currency).map((account) => ({ kind: account.kind, openingBalance: account.openingBalance.toString(), entries: account.moneyLedgerEntries.map((entry) => ({ amount: entry.amount.toString(), reversedAt: entry.reversedAt })) }))) }));
  const transfers = await prisma.internalTransfer.findMany({
    where: { userId, status: "POSTED", OR: [{ sourceAccount: { projectId: project.id } }, { targetAccount: { projectId: project.id } }] },
    include: { sourceAccount: { include: { project: true } }, targetAccount: { include: { project: true } } },
  });
  const transferCurrencies = [...new Set([...summaries.map((summary) => summary.currency), ...transfers.flatMap((transfer) => [transfer.sourceCurrency, transfer.targetCurrency])])];
  const transferSummary = transferCurrencies.map((currency) => ({
    currency,
    incoming: transfers.filter((transfer) => transfer.sourceAccount.projectId !== project.id && transfer.targetAccount.projectId === project.id && transfer.targetCurrency === currency).reduce((sum, transfer) => sum + moneyToMinorUnits(transfer.targetAmount.toString()), 0n),
    outgoing: transfers.filter((transfer) => transfer.sourceAccount.projectId === project.id && transfer.targetAccount.projectId !== project.id && transfer.sourceCurrency === currency).reduce((sum, transfer) => sum + moneyToMinorUnits(transfer.sourceAmount.toString()), 0n),
  }));
  const legacyOperations = await prisma.transaction.groupBy({
    by: ["currency", "type"],
    where: { userId, module: projectCode, deletedAt: null },
    _sum: { amount: true },
  });
  const legacyCurrencies = [...new Set(legacyOperations.map((item) => item.currency))];
  const legacySummary = legacyCurrencies.map((currency) => {
    const amount = (type: "INCOME" | "EXPENSE" | "SAVING_IN" | "SAVING_OUT") => moneyToMinorUnits(legacyOperations.find((item) => item.currency === currency && item.type === type)?._sum.amount?.toString() ?? "0");
    const income = amount("INCOME");
    const expense = amount("EXPENSE");
    return { currency, income, expense, result: income - expense, savings: amount("SAVING_IN") - amount("SAVING_OUT") };
  });
  return { project, accounts: withBalances, summaries, transferSummary, legacySummary };
}

export async function getMoneyOverview(userId: string) {
  await ensureProjects(userId);
  const accounts = await prisma.moneyAccount.findMany({
    where: { userId },
    include: { project: true, moneyLedgerEntries: { where: { reversedAt: null }, select: { amount: true, reversedAt: true } } },
    orderBy: [{ project: { sortOrder: "asc" } }, { kind: "asc" }, { sortOrder: "asc" }],
  });
  const withBalances = accounts.map((account) => ({ ...account, balanceMinor: calculateMoneyAccountBalance({ openingBalance: account.openingBalance.toString(), entries: account.moneyLedgerEntries.map((entry) => ({ amount: entry.amount.toString(), reversedAt: entry.reversedAt })) }) }));
  const currencies = [...new Set(withBalances.map((account) => account.currency))];
  return {
    accounts: withBalances,
    summaries: currencies.map((currency) => ({ currency, total: withBalances.filter((account) => account.currency === currency).reduce((sum, account) => sum + account.balanceMinor, 0n) })),
  };
}

export async function getMoneyTransferWorkspace(userId: string) {
  const [projects, overview] = await Promise.all([getMoneyProjects(userId), getMoneyOverview(userId)]);
  return { projects, accounts: overview.accounts.filter((account) => account.isActive), summaries: overview.summaries };
}

export async function getInternalTransferHistory(userId: string) {
  return prisma.internalTransfer.findMany({
    where: { userId },
    include: { sourceAccount: { include: { project: true } }, targetAccount: { include: { project: true } } },
    orderBy: [{ operationDate: "desc" }, { createdAt: "desc" }],
  });
}

export async function getInternalTransfer(userId: string, id: string) {
  return prisma.internalTransfer.findFirstOrThrow({
    where: { id, userId },
    include: { sourceAccount: { include: { project: true } }, targetAccount: { include: { project: true } } },
  });
}

export async function getMoneyAccount(userId: string, id: string) {
  return prisma.moneyAccount.findFirstOrThrow({ where: { id, userId }, include: { project: true, _count: { select: { moneyLedgerEntries: true, outgoingTransfers: true, incomingTransfers: true } } } });
}

export async function createMoneyAccount(userId: string, raw: unknown) {
  const input = moneyAccountSchema.parse(raw);
  await ensureProjects(userId);
  const project = await prisma.project.findUniqueOrThrow({ where: { userId_code: { userId, code: input.projectCode } } });
  return prisma.$transaction(async (tx) => {
    if (input.isPrimary && input.kind === MoneyAccountKind.WALLET) await tx.moneyAccount.updateMany({ where: { userId, projectId: project.id, isPrimary: true }, data: { isPrimary: false } });
    const last = await tx.moneyAccount.aggregate({ where: { userId, projectId: project.id, kind: input.kind }, _max: { sortOrder: true } });
    return tx.moneyAccount.create({ data: {
      userId, projectId: project.id, name: input.name, kind: input.kind,
      type: input.kind === MoneyAccountKind.WALLET ? input.type : MoneyAccountType.OTHER,
      currency: input.currency,
      openingBalance: input.kind === MoneyAccountKind.WALLET ? input.openingBalance : 0,
      targetAmount: input.kind === MoneyAccountKind.ENVELOPE ? input.targetAmount : null,
      targetDate: input.kind === MoneyAccountKind.ENVELOPE ? dateOnly(input.targetDate) : null,
      note: input.note || null,
      isPrimary: input.kind === MoneyAccountKind.WALLET && input.isPrimary,
      sortOrder: (last._max.sortOrder ?? -1) + 1,
    } });
  });
}

export async function updateMoneyAccount(userId: string, id: string, raw: unknown) {
  const input = moneyAccountSchema.parse(raw);
  const existing = await getMoneyAccount(userId, id);
  if (existing.project.code !== input.projectCode || existing.kind !== input.kind) throw new Error("Проект и вид счёта изменить нельзя.");
  return prisma.$transaction(async (tx) => {
    if (input.isPrimary && input.kind === MoneyAccountKind.WALLET) await tx.moneyAccount.updateMany({ where: { userId, projectId: existing.projectId, isPrimary: true, id: { not: id } }, data: { isPrimary: false } });
    return tx.moneyAccount.update({ where: { id }, data: {
      name: input.name,
      type: input.kind === MoneyAccountKind.WALLET ? input.type : MoneyAccountType.OTHER,
      currency: input.currency,
      openingBalance: input.kind === MoneyAccountKind.WALLET ? input.openingBalance : 0,
      targetAmount: input.kind === MoneyAccountKind.ENVELOPE ? input.targetAmount : null,
      targetDate: input.kind === MoneyAccountKind.ENVELOPE ? dateOnly(input.targetDate) : null,
      note: input.note || null,
      isPrimary: input.kind === MoneyAccountKind.WALLET && input.isPrimary,
    } });
  });
}

export async function setMoneyAccountActive(userId: string, id: string, isActive: boolean) {
  const account = await getMoneyAccount(userId, id);
  if (!isActive) return prisma.moneyAccount.update({ where: { id: account.id }, data: { isActive: false, isPrimary: false } });
  return prisma.moneyAccount.update({ where: { id: account.id }, data: { isActive: true } });
}

export async function deleteUnusedMoneyAccount(userId: string, id: string) {
  const account = await getMoneyAccount(userId, id);
  const hasHistory = account._count.moneyLedgerEntries + account._count.outgoingTransfers + account._count.incomingTransfers > 0;
  if (hasHistory || moneyToMinorUnits(account.openingBalance.toString()) !== 0n) throw new Error("Счёт с остатком или историей можно только архивировать.");
  return prisma.moneyAccount.delete({ where: { id: account.id } });
}

async function postAllocationOnce(userId: string, input: AllocationInput) {
  return prisma.$transaction(async (tx) => {
    const duplicate = await tx.internalTransfer.findUnique({ where: { userId_idempotencyKey: { userId, idempotencyKey: input.idempotencyKey } } });
    if (duplicate) return duplicate;
    const accounts = await tx.moneyAccount.findMany({ where: { userId, id: { in: [input.sourceAccountId, input.targetAccountId] } }, include: { project: true, moneyLedgerEntries: { where: { reversedAt: null }, select: { amount: true, reversedAt: true } } } });
    const source = accounts.find((account) => account.id === input.sourceAccountId);
    const target = accounts.find((account) => account.id === input.targetAccountId);
    if (!source || !target) throw new Error("Выберите два разных счёта.");
    const amountMinor = moneyToMinorUnits(String(input.amount));
    const balance = calculateMoneyAccountBalance({ openingBalance: source.openingBalance.toString(), entries: source.moneyLedgerEntries.map((entry) => ({ amount: entry.amount.toString(), reversedAt: entry.reversedAt })) });
    validateInternalAllocation({ id: source.id, projectId: source.projectId, kind: source.kind, currency: source.currency, isActive: source.isActive, balanceMinor: balance }, { id: target.id, projectId: target.projectId, kind: target.kind, currency: target.currency, isActive: target.isActive, balanceMinor: 0n }, amountMinor);
    const amount = minorUnitsToMoney(amountMinor);
    const transfer = await tx.internalTransfer.create({ data: {
      userId, sourceAccountId: source.id, targetAccountId: target.id,
      sourceAmount: amount, targetAmount: amount, sourceCurrency: source.currency, targetCurrency: target.currency,
      operationDate: dateOnly(input.operationDate)!, comment: input.comment || null, idempotencyKey: input.idempotencyKey,
    } });
    await tx.moneyLedgerEntry.createMany({ data: [
      { userId, projectId: source.projectId, accountId: source.id, transferId: transfer.id, type: "TRANSFER", amount: `-${amount}`, currency: source.currency, operationDate: dateOnly(input.operationDate)! },
      { userId, projectId: target.projectId, accountId: target.id, transferId: transfer.id, type: "TRANSFER", amount, currency: target.currency, operationDate: dateOnly(input.operationDate)! },
    ] });
    return transfer;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function createInternalAllocation(userId: string, raw: unknown) {
  const input = internalAllocationSchema.parse(raw);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try { return await postAllocationOnce(userId, input); }
    catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return prisma.internalTransfer.findUniqueOrThrow({ where: { userId_idempotencyKey: { userId, idempotencyKey: input.idempotencyKey } } });
      }
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2034" || attempt === 2) throw error;
    }
  }
  throw new Error("Не удалось сохранить распределение. Повторите попытку.");
}

async function cancelTransferOnce(userId: string, transferId: string) {
  return prisma.$transaction(async (tx) => {
    const transfer = await tx.internalTransfer.findFirstOrThrow({
      where: { id: transferId, userId },
      include: {
        targetAccount: { include: { moneyLedgerEntries: { where: { reversedAt: null }, select: { amount: true, reversedAt: true } } } },
        moneyLedgerEntries: { where: { reversedAt: null } },
      },
    });
    if (transfer.status === "CANCELLED") return transfer;
    if (transfer.moneyLedgerEntries.length !== 2) throw new Error("Перевод имеет неполную историю и требует ручной проверки.");
    const targetBalance = calculateMoneyAccountBalance({ openingBalance: transfer.targetAccount.openingBalance.toString(), entries: transfer.targetAccount.moneyLedgerEntries.map((entry) => ({ amount: entry.amount.toString(), reversedAt: entry.reversedAt })) });
    validateTransferCancellation(targetBalance, moneyToMinorUnits(transfer.targetAmount.toString()));
    const cancelledAt = new Date();
    const reversed = await tx.moneyLedgerEntry.updateMany({ where: { transferId: transfer.id, reversedAt: null }, data: { reversedAt: cancelledAt } });
    if (reversed.count !== 2) throw new Error("Не удалось полностью отменить перевод.");
    return tx.internalTransfer.update({ where: { id: transfer.id }, data: { status: "CANCELLED", cancelledAt } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}

export async function cancelInternalTransfer(userId: string, transferId: string) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try { return await cancelTransferOnce(userId, transferId); }
    catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2034" || attempt === 2) throw error;
    }
  }
  throw new Error("Не удалось отменить перевод. Повторите попытку.");
}
