import "server-only";

import { CategoryKind, CosmetologyBonusRedemptionStatus, CosmetologyCertificateStatus, CosmetologyClientStatus, CosmetologyContactMethod, CosmetologyInventoryMovementType, CosmetologyPaymentMethod, CosmetologyPlanStatus, CosmetologyUnit, CosmetologyVisitStatus, CosmetologyWallet, CosmetologyWalletMovementType, FinanceModule, MoneyAccountKind, MoneyLedgerEntryType, Prisma, TransactionType } from "@prisma/client";
import { z } from "zod";

import { periodStart } from "@/features/family/calculations";
import { dateFromInput, todayInputValue } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { newLoyaltyDeliveryData } from "@/server/loyalty-delivery";
import { BotClientApiError, isLoyaltyBonusRedemptionEnabled, postLoyaltyBonusRedemption } from "@/server/loyalty";

const money = z.string().trim().regex(/^\d+(?:[.,]\d{1,2})?$/);
const positiveMoney = money.refine((value) => new Prisma.Decimal(value.replace(",", ".")).gt(0), "Сумма должна быть больше нуля.");
const quantity = z.string().trim().regex(/^\d+(?:[.,]\d{1,3})?$/).refine((value) => new Prisma.Decimal(value.replace(",", ".")).gt(0));
const nonNegativeMoney = z.string().trim().regex(/^\d+(?:[.,]\d{1,2})?$/);
const nonNegativeBonus = z.string().trim().regex(/^\d+$/);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const optional = z.string().trim().max(500).nullable();
const decimal = (value: string) => new Prisma.Decimal(value.replace(",", "."));
const zero = new Prisma.Decimal(0);

export const cosmeticItemCategories = ["Препараты", "Расходники", "Ботулотоксин", "Филлер", "Биоревитализант", "Мезопрепарат", "PDRN", "Полимолочная кислота", "Коллагеновый стимулятор", "Шприцы", "Иглы", "Канюли", "Перчатки", "Салфетки", "Физраствор", "Прочее"];
export const cosmeticExpenseCategories = ["Аренда кабинета / салона", "Реклама", "Обучение", "Оборудование", "Мебель", "Хозяйственные расходы", "Интернет / связь", "Поездки", "Проживание", "Транспорт", "Прочее"];
export const procedureCategories = ["Ботулинотерапия", "Контурная пластика", "Мезотерапия", "Биоревитализация", "Коллагеностимуляция", "Массаж", "Консультация", "Другое"];
export const clientSources = ["Instagram", "TikTok", "Facebook", "Google", "Сайт", "По рекомендации", "Другое"];
export const clientMarks = ["Тяжёлый клиент", "Очень лояльный", "Высокий средний чек", "Любит акции", "Часто переносит запись", "Часто опаздывает", "Пришёл по рекомендации"];

export const clientSchema = z.object({ lastName: z.string().trim().max(80), firstName: z.string().trim().min(1).max(80), phone: z.string().trim().min(5).max(40), birthDate: date.nullable(), contactMethod: z.nativeEnum(CosmetologyContactMethod), contactValue: z.string().trim().max(300).nullable(), source: z.string().trim().max(80).nullable(), referrerId: z.string().cuid().nullable(), status: z.nativeEnum(CosmetologyClientStatus), specialMarks: z.array(z.string().trim().min(1).max(80)).max(12), notes: optional, allergies: optional, contraindications: optional, medicalNotes: optional });
export const itemSchema = z.object({ name: z.string().trim().min(1).max(120), category: z.string().trim().min(1).max(80), brand: z.string().trim().max(80).nullable(), unit: z.nativeEnum(CosmetologyUnit), minimumQuantity: z.string().trim().regex(/^\d+(?:[.,]\d{1,3})?$/), comment: optional });
export const purchaseSchema = z.object({ itemId: z.string().cuid(), quantity, totalAmount: money, purchaseDate: date, supplier: z.string().trim().max(120).nullable(), moneyAccountId: z.string().cuid(), procurementEnvelopeId: z.string().cuid(), expiryDate: date.nullable(), batchNumber: z.string().trim().max(120).nullable(), comment: optional });
export const inventoryChangeSchema = z.object({ itemId: z.string().cuid(), quantity, operationDate: date, type: z.enum(["WRITE_OFF", "ADJUSTMENT"]), comment: z.string().trim().min(1).max(500) });
export const templateSchema = z.object({ name: z.string().trim().min(1).max(120), category: z.string().trim().min(1).max(80), basePrice: money.nullable(), durationMinutes: z.coerce.number().int().positive().nullable(), comment: optional });
export const templateMaterialSchema = z.object({ templateId: z.string().cuid(), itemId: z.string().cuid(), quantity });
const walletAmounts = z.object({
  moneyAccountId: z.string().trim().min(1).max(120).nullable().default(null),
  procurementAmount: nonNegativeMoney.nullable().default(null),
  cashAmount: nonNegativeMoney.nullable(),
  monoAmount: nonNegativeMoney.nullable(),
  privatAmount: nonNegativeMoney.nullable(),
  otherAmount: nonNegativeMoney.nullable(),
  otherComment: z.string().trim().max(300).nullable(),
  certificateId: z.string().cuid().nullable().default(null),
  certificateAmount: nonNegativeMoney.nullable().default(null),
  bonusAmount: nonNegativeBonus.nullable().default(null),
  paymentRequestKey: z.string().uuid().nullable().default(null),
  paymentTotal: nonNegativeMoney,
});
function validatePaymentComponents(value: z.infer<typeof walletAmounts>, ctx: z.RefinementCtx) {
  const total = [value.cashAmount, value.monoAmount, value.privatAmount, value.otherAmount, value.certificateAmount, value.bonusAmount]
    .reduce((sum, amount) => sum.add(decimal(amount ?? "0")), zero);
  if (!total.eq(decimal(value.paymentTotal))) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["paymentTotal"], message: "Сумма компонентов оплаты не сходится с итогом." });
  if (decimal(value.otherAmount ?? "0").gt(zero) && !value.otherComment) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["otherComment"], message: "Добавьте описание для прочего поступления." });
  if (decimal(value.certificateAmount ?? "0").gt(zero) && !value.certificateId) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["certificateId"], message: "Выберите сертификат." });
  if (decimal(value.bonusAmount ?? "0").gt(zero) && !value.paymentRequestKey) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["paymentRequestKey"], message: "Не удалось подготовить безопасное списание бонусов. Обновите страницу." });
  if (decimal(value.procurementAmount ?? "0").gt(total)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["procurementAmount"], message: "В резерв можно направить не больше полученной оплаты." });
}
export const appointmentSchema = z.object({ clientId: z.string().cuid().nullable(), clientName: z.string().trim().max(160).nullable(), phone: z.string().trim().max(40).nullable(), contactValue: z.string().trim().max(300).nullable(), procedureTemplateId: z.string().cuid().nullable(), procedureName: z.string().trim().max(120).nullable(), plannedAmount: nonNegativeMoney.nullable(), operationDate: date, scheduledTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable(), durationMinutes: z.coerce.number().int().min(15).max(720).multipleOf(15).nullable(), comment: optional }).merge(walletAmounts).superRefine((value, ctx) => { validatePaymentComponents(value, ctx); if (!value.clientId && !value.clientName) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["clientName"], message: "Введите имя или выберите клиента." }); if (!value.procedureTemplateId && !value.procedureName) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["procedureName"], message: "Выберите или введите услугу." }); });
export const visitServiceSchema = z.object({ visitId: z.string().cuid(), serviceId: z.string().cuid().nullable(), templateId: z.string().cuid().nullable(), name: z.string().trim().max(120).nullable(), price: nonNegativeMoney.nullable(), durationMinutes: z.coerce.number().int().min(15).max(720).multipleOf(15).nullable() }).superRefine((value, ctx) => { if (!value.templateId && !value.name) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["name"], message: "Выберите услугу или укажите её название." }); });
export const completeVisitSchema = z.object({ id: z.string().cuid(), paymentAmount: nonNegativeMoney, operationDate: date, comment: optional }).merge(walletAmounts).superRefine(validatePaymentComponents);
export const payVisitSchema = z.object({ id: z.string().cuid(), operationDate: date }).merge(walletAmounts).superRefine(validatePaymentComponents);
export const certificateSchema = z.object({ certificateNumber: z.string().trim().min(3).max(80), initialAmount: positiveMoney, currency: z.literal("UAH").default("UAH"), clientId: z.string().cuid().nullable(), issuedAt: date, expiresAt: date.nullable(), comment: optional }).superRefine((value, ctx) => { if (value.expiresAt && value.expiresAt < value.issuedAt) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["expiresAt"], message: "Срок действия не может быть раньше даты выдачи." }); });
export const expenseSchema = z.object({ categoryId: z.string().cuid().nullable(), newCategoryName: z.string().trim().min(1).max(80).nullable(), amount: money, wallet: z.nativeEnum(CosmetologyWallet), operationDate: date, description: z.string().trim().min(1).max(500), comment: optional }).refine((value) => Boolean(value.categoryId || value.newCategoryName), { path: ["categoryId"], message: "Выберите категорию." });
export const planSchema = z.object({ clientId: z.string().cuid(), title: z.string().trim().min(1).max(160), plannedDate: date.nullable(), status: z.nativeEnum(CosmetologyPlanStatus), note: optional });
export const formValue = (formData: FormData, name: string) => { const value = formData.get(name); return typeof value === "string" && value.trim() ? value.trim() : null; };

function phoneLastFour(phone: string) { const digits = phone.replace(/\D/g, ""); if (digits.length < 4) throw new Error("Введите корректный номер телефона."); return digits.slice(-4); }
export type PaymentComponentInput = { method: CosmetologyPaymentMethod; wallet: CosmetologyWallet | null; amount: Prisma.Decimal; comment: string | null; certificateId: string | null };
export function paymentComponents(input: z.input<typeof walletAmounts>): PaymentComponentInput[] {
  return [
    { method: CosmetologyPaymentMethod.CASH, wallet: CosmetologyWallet.CASH, amount: decimal(input.cashAmount ?? "0"), comment: null, certificateId: null },
    { method: CosmetologyPaymentMethod.MONOBANK, wallet: CosmetologyWallet.MONO, amount: decimal(input.monoAmount ?? "0"), comment: null, certificateId: null },
    { method: CosmetologyPaymentMethod.PRIVATBANK, wallet: CosmetologyWallet.PRIVAT, amount: decimal(input.privatAmount ?? "0"), comment: null, certificateId: null },
    { method: CosmetologyPaymentMethod.OTHER, wallet: CosmetologyWallet.OTHER, amount: decimal(input.otherAmount ?? "0"), comment: input.otherComment, certificateId: null },
    { method: CosmetologyPaymentMethod.CERTIFICATE, wallet: null, amount: decimal(input.certificateAmount ?? "0"), comment: null, certificateId: input.certificateId ?? null },
    { method: CosmetologyPaymentMethod.BONUS, wallet: null, amount: decimal(input.bonusAmount ?? "0"), comment: null, certificateId: null },
  ].filter((item) => item.amount.gt(zero));
}

async function expireCertificates(db: Prisma.TransactionClient, userId: string) {
  await db.cosmetologyCertificate.updateMany({ where: { userId, status: CosmetologyCertificateStatus.ACTIVE, expiresAt: { lt: dateFromInput(todayInputValue()) } }, data: { status: CosmetologyCertificateStatus.EXPIRED } });
}

async function consumeCertificate(db: Prisma.TransactionClient, userId: string, certificateId: string, amount: Prisma.Decimal) {
  await expireCertificates(db, userId);
  const today = dateFromInput(todayInputValue());
  const claimed = await db.cosmetologyCertificate.updateMany({ where: { id: certificateId, userId, status: CosmetologyCertificateStatus.ACTIVE, remainingAmount: { gte: amount }, OR: [{ expiresAt: null }, { expiresAt: { gte: today } }] }, data: { remainingAmount: { decrement: amount } } });
  if (claimed.count !== 1) {
    const certificate = await db.cosmetologyCertificate.findFirst({ where: { id: certificateId, userId } });
    if (!certificate) throw new Error("Сертификат не найден.");
    if (certificate.status === CosmetologyCertificateStatus.CANCELLED) throw new Error("Сертификат отменён.");
    if (certificate.status === CosmetologyCertificateStatus.FULLY_USED || certificate.remainingAmount.lte(zero)) throw new Error("Сертификат уже использован полностью.");
    if (certificate.status === CosmetologyCertificateStatus.EXPIRED || (certificate.expiresAt && certificate.expiresAt < today)) throw new Error("Сертификат просрочен.");
    throw new Error("На сертификате недостаточно остатка.");
  }
  const certificate = await db.cosmetologyCertificate.findUniqueOrThrow({ where: { id: certificateId } });
  if (certificate.remainingAmount.eq(zero)) await db.cosmetologyCertificate.update({ where: { id: certificateId }, data: { status: CosmetologyCertificateStatus.FULLY_USED } });
}

async function recordPayment(db: Prisma.TransactionClient, userId: string, visitId: string, operationDate: Date, items: PaymentComponentInput[], type: CosmetologyWalletMovementType, description: string) {
  if (!items.length) return null;
  const payment = await db.cosmetologyPayment.upsert({
    where: { visitId },
    create: { userId, visitId, currency: "UAH" },
    update: {},
  });
  const monetaryItems = items.filter((item) => item.wallet !== null);
  const monetaryTotal = monetaryItems.reduce((sum, item) => sum.add(item.amount), zero);
  const transaction = monetaryItems.length ? await db.transaction.create({ data: { userId, type: TransactionType.INCOME, amount: monetaryTotal, operationDate, module: FinanceModule.COSMETOLOGY, description, source: "WEB", cosmetologyPaymentId: payment.id } }) : null;
  let bonusComponentId: string | null = null;
  for (const item of items) {
    if (item.certificateId) await consumeCertificate(db, userId, item.certificateId, item.amount);
    const component = await db.cosmetologyPaymentComponent.create({
      data: { paymentId: payment.id, method: item.method, amount: item.amount, operationDate, comment: item.comment, certificateId: item.certificateId, transactionId: transaction?.id ?? null },
    });
    if (item.method === CosmetologyPaymentMethod.BONUS) bonusComponentId = component.id;
    if (item.wallet) await db.cosmetologyWalletMovement.create({ data: { userId, visitId, wallet: item.wallet, type, amount: item.amount, operationDate, description: item.comment ? `${description}: ${item.comment}` : description, paymentComponentId: component.id } });
  }
  return { transactionId: transaction?.id ?? null, paymentId: payment.id, monetaryAmount: monetaryTotal, bonusComponentId };
}

async function recordGeneralWalletPayment(db: Prisma.TransactionClient, userId: string, visitId: string, operationDate: Date, amount: Prisma.Decimal, moneyAccountId: string, procurementAmount: Prisma.Decimal, description: string) {
  const wallet = await db.moneyAccount.findFirst({ where: { userId, kind: MoneyAccountKind.WALLET, isActive: true, OR: [{ id: moneyAccountId }, { name: moneyAccountId }] } });
  if (!wallet) throw new Error("Выберите активный общий кошелёк.");
  if (wallet.currency !== "UAH") throw new Error("Для оплаты процедуры сейчас доступен только кошелёк в UAH.");
  const payment = await db.cosmetologyPayment.upsert({ where: { visitId }, create: { userId, visitId, currency: "UAH" }, update: {} });
  const category = await db.category.upsert({ where: { userId_module_name: { userId, module: FinanceModule.COSMETOLOGY, name: "Процедуры" } }, create: { userId, module: FinanceModule.COSMETOLOGY, name: "Процедуры", kind: CategoryKind.INCOME }, update: { isArchived: false, kind: CategoryKind.INCOME } });
  const transaction = await db.transaction.create({ data: { userId, type: TransactionType.INCOME, amount, operationDate, module: FinanceModule.COSMETOLOGY, categoryId: category.id, moneyAccountId: wallet.id, description, source: "WEB", cosmetologyPaymentId: payment.id } });
  await db.moneyLedgerEntry.create({ data: { userId, projectId: wallet.projectId, accountId: wallet.id, transactionId: transaction.id, type: MoneyLedgerEntryType.INCOME, amount, currency: wallet.currency, operationDate } });
  await db.cosmetologyPaymentComponent.create({ data: { paymentId: payment.id, method: CosmetologyPaymentMethod.OTHER, amount, operationDate, comment: wallet.name, transactionId: transaction.id } });
  if (procurementAmount.gt(zero)) {
    const envelope = await db.moneyAccount.findFirst({ where: { userId, kind: MoneyAccountKind.ENVELOPE, isActive: true, project: { code: FinanceModule.COSMETOLOGY }, name: { contains: "закуп", mode: "insensitive" } } });
    if (!envelope) throw new Error("Не найден общий конверт «На закупку».");
    await db.moneyLedgerEntry.create({ data: { userId, projectId: envelope.projectId, accountId: envelope.id, transactionId: transaction.id, type: MoneyLedgerEntryType.ADJUSTMENT, amount: procurementAmount, currency: envelope.currency, operationDate } });
  }
  return { transactionId: transaction.id, paymentId: payment.id, monetaryAmount: amount, bonusComponentId: null };
}
async function monetaryPaymentTotal(db: Prisma.TransactionClient, visitId: string) {
  const total = await db.cosmetologyPaymentComponent.aggregate({ where: { payment: { visitId }, method: { in: [CosmetologyPaymentMethod.CASH, CosmetologyPaymentMethod.MONOBANK, CosmetologyPaymentMethod.PRIVATBANK, CosmetologyPaymentMethod.OTHER] } }, _sum: { amount: true } });
  return total._sum.amount ?? zero;
}
async function ownedClient(userId: string, id: string) { const client = await prisma.cosmetologyClient.findFirst({ where: { id, userId, deletedAt: null } }); if (!client) throw new Error("Клиент не найден."); return client; }
async function ownedItem(userId: string, id: string) { const item = await prisma.cosmetologyInventoryItem.findFirst({ where: { id, userId, deletedAt: null } }); if (!item) throw new Error("Препарат или расходник не найден."); return item; }
async function ownedTemplate(userId: string, id: string) { const template = await prisma.cosmetologyProcedureTemplate.findFirst({ where: { id, userId, deletedAt: null } }); if (!template) throw new Error("Услуга недоступна."); return template; }
async function ensureCategories(userId: string) { if (!await prisma.cosmetologyExpenseCategory.count({ where: { userId } })) await prisma.cosmetologyExpenseCategory.createMany({ data: cosmeticExpenseCategories.map((name, sortOrder) => ({ userId, name, sortOrder })), skipDuplicates: true }); }

export async function createCosmetologyClient(userId: string, input: z.infer<typeof clientSchema>) { if (input.referrerId) await ownedClient(userId, input.referrerId); return prisma.cosmetologyClient.create({ data: { userId, ...input, displayName: `${input.firstName} ${input.lastName}`.trim(), phoneLastFour: phoneLastFour(input.phone), birthDate: input.birthDate ? dateFromInput(input.birthDate) : null } }); }
export async function updateCosmetologyClient(userId: string, id: string, input: z.infer<typeof clientSchema>) { await ownedClient(userId, id); if (input.referrerId) await ownedClient(userId, input.referrerId); if (input.referrerId === id) throw new Error("Клиент не может рекомендовать сам себя."); return prisma.cosmetologyClient.update({ where: { id }, data: { ...input, displayName: `${input.firstName} ${input.lastName}`.trim(), phoneLastFour: phoneLastFour(input.phone), birthDate: input.birthDate ? dateFromInput(input.birthDate) : null } }); }
export async function getCosmetologyClients(userId: string, query = "") { return prisma.cosmetologyClient.findMany({ where: { userId, deletedAt: null, ...(query ? { OR: [{ displayName: { contains: query, mode: "insensitive" } }, { lastName: { contains: query, mode: "insensitive" } }, { firstName: { contains: query, mode: "insensitive" } }, { phone: { contains: query } }, { contactValue: { contains: query, mode: "insensitive" } }, { phoneLastFour: { equals: query.replace(/\D/g, "").slice(-4) } }] } : {}) }, orderBy: [{ displayName: "asc" }, { lastName: "asc" }] }); }

export async function createCosmetologyCertificate(userId: string, input: z.infer<typeof certificateSchema>) {
  if (input.clientId) await ownedClient(userId, input.clientId);
  const expiresAt = input.expiresAt ? dateFromInput(input.expiresAt) : null;
  const status = expiresAt && expiresAt < dateFromInput(todayInputValue()) ? CosmetologyCertificateStatus.EXPIRED : CosmetologyCertificateStatus.ACTIVE;
  try {
    return await prisma.cosmetologyCertificate.create({ data: { userId, clientId: input.clientId, certificateNumber: input.certificateNumber.toUpperCase(), initialAmount: decimal(input.initialAmount), remainingAmount: decimal(input.initialAmount), currency: input.currency, issuedAt: dateFromInput(input.issuedAt), expiresAt, status, comment: input.comment } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new Error("Сертификат с таким номером уже существует.");
    throw error;
  }
}

export async function getCosmetologyCertificates(userId: string, query = "") {
  await expireCertificates(prisma, userId);
  return prisma.cosmetologyCertificate.findMany({ where: { userId, ...(query ? { certificateNumber: { contains: query.trim(), mode: "insensitive" } } : {}) }, include: { client: { select: { id: true, displayName: true, firstName: true, lastName: true } }, _count: { select: { components: true } } }, orderBy: [{ status: "asc" }, { createdAt: "desc" }] });
}

export async function getAvailableCosmetologyCertificates(userId: string) {
  await expireCertificates(prisma, userId);
  return prisma.cosmetologyCertificate.findMany({ where: { userId, status: CosmetologyCertificateStatus.ACTIVE, remainingAmount: { gt: zero }, OR: [{ expiresAt: null }, { expiresAt: { gte: dateFromInput(todayInputValue()) } }] }, orderBy: { certificateNumber: "asc" } });
}

export async function getCosmetologyCertificate(userId: string, id: string) {
  await expireCertificates(prisma, userId);
  const certificate = await prisma.cosmetologyCertificate.findFirst({ where: { id, userId }, include: { client: true, components: { include: { payment: { include: { visit: { include: { client: true } } } } }, orderBy: [{ operationDate: "desc" }, { createdAt: "desc" }] } } });
  if (!certificate) throw new Error("Сертификат не найден.");
  return certificate;
}

export async function cancelCosmetologyCertificate(userId: string, id: string) {
  await expireCertificates(prisma, userId);
  const certificate = await prisma.cosmetologyCertificate.findFirst({ where: { id, userId } });
  if (!certificate) throw new Error("Сертификат не найден.");
  if (certificate.status !== CosmetologyCertificateStatus.ACTIVE) throw new Error("Можно отменить только активный сертификат.");
  return prisma.cosmetologyCertificate.update({ where: { id }, data: { status: CosmetologyCertificateStatus.CANCELLED } });
}

export async function createCosmetologyItem(userId: string, input: z.infer<typeof itemSchema>) { const exists = await prisma.cosmetologyInventoryItem.findFirst({ where: { userId, name: { equals: input.name, mode: "insensitive" }, deletedAt: null } }); if (exists) throw new Error("Позиция с таким названием уже есть."); return prisma.cosmetologyInventoryItem.create({ data: { userId, ...input, minimumQuantity: decimal(input.minimumQuantity) } }); }
export async function createCosmetologyPurchase(userId: string, input: z.infer<typeof purchaseSchema>) { const item = await ownedItem(userId, input.itemId); const amount = decimal(input.totalAmount); const received = decimal(input.quantity); const unitCost = amount.div(received); const operationDate = dateFromInput(input.purchaseDate); return prisma.$transaction(async (db) => { const [wallet, envelope] = await Promise.all([db.moneyAccount.findFirst({ where: { id: input.moneyAccountId, userId, kind: MoneyAccountKind.WALLET, isActive: true } }), db.moneyAccount.findFirst({ where: { id: input.procurementEnvelopeId, userId, kind: MoneyAccountKind.ENVELOPE, isActive: true, project: { code: FinanceModule.COSMETOLOGY }, name: { contains: "закуп", mode: "insensitive" } } })]); if (!wallet) throw new Error("Выберите активный общий кошелёк оплаты."); if (!envelope) throw new Error("Выберите конверт «На закупку»."); const envelopeTotals = await db.moneyLedgerEntry.aggregate({ where: { accountId: envelope.id, reversedAt: null }, _sum: { amount: true } }); const reserve = envelope.openingBalance.add(envelopeTotals._sum.amount ?? zero); if (reserve.lt(amount)) throw new Error("В конверте «На закупку» недостаточно средств."); const category = await db.cosmetologyExpenseCategory.upsert({ where: { userId_name: { userId, name: "Закупка препаратов" } }, create: { userId, name: "Закупка препаратов" }, update: { isArchived: false } }); const expense = await db.transaction.create({ data: { userId, type: TransactionType.EXPENSE, amount, operationDate, module: FinanceModule.COSMETOLOGY, moneyAccountId: wallet.id, description: `Закупка: ${item.name}`, source: "WEB" } }); await db.moneyLedgerEntry.createMany({ data: [{ userId, projectId: wallet.projectId, accountId: wallet.id, transactionId: expense.id, type: MoneyLedgerEntryType.EXPENSE, amount: amount.neg(), currency: wallet.currency, operationDate }, { userId, projectId: envelope.projectId, accountId: envelope.id, transactionId: expense.id, type: MoneyLedgerEntryType.ADJUSTMENT, amount: amount.neg(), currency: envelope.currency, operationDate }] }); const lot = await db.cosmetologyInventoryLot.create({ data: { userId, itemId: item.id, initialQuantity: received, availableQuantity: received, totalAmount: amount, unitCost, purchaseDate: operationDate, expiryDate: input.expiryDate ? dateFromInput(input.expiryDate) : null, batchNumber: input.batchNumber, supplier: input.supplier, comment: input.comment, expenseTransactionId: expense.id } }); await db.cosmetologyExpense.create({ data: { userId, transactionId: expense.id, categoryId: category.id, comment: input.comment } }); await db.cosmetologyInventoryMovement.create({ data: { userId, itemId: item.id, lotId: lot.id, type: "PURCHASE", quantity: received, operationDate, comment: input.comment } }); await db.cosmetologyInventoryItem.update({ where: { id: item.id }, data: { currentQuantity: { increment: received } } }); return lot; }); }

async function allocateUsage(db: Prisma.TransactionClient, userId: string, itemId: string, quantityValue: Prisma.Decimal, operationDate: Date, visitId: string, comment: string | null) { const item = await db.cosmetologyInventoryItem.findFirst({ where: { id: itemId, userId, deletedAt: null } }); if (!item) throw new Error("Материал недоступен."); if (item.currentQuantity.lt(quantityValue)) throw new Error(`Недостаточно остатка: ${item.name}.`); const lots = await db.cosmetologyInventoryLot.findMany({ where: { userId, itemId, deletedAt: null, availableQuantity: { gt: zero } }, orderBy: [{ expiryDate: "asc" }, { purchaseDate: "asc" }] }); let remaining = quantityValue; let cost = zero; for (const lot of lots) { if (remaining.lte(zero)) break; const used = Prisma.Decimal.min(lot.availableQuantity, remaining); const totalCost = used.mul(lot.unitCost); await db.cosmetologyProcedureMaterialUsage.create({ data: { visitId, itemId, lotId: lot.id, quantity: used, unitCost: lot.unitCost, totalCost } }); await db.cosmetologyInventoryMovement.create({ data: { userId, itemId, lotId: lot.id, visitId, type: "PROCEDURE_USE", quantity: used.neg(), operationDate, comment } }); await db.cosmetologyInventoryLot.update({ where: { id: lot.id }, data: { availableQuantity: { decrement: used } } }); cost = cost.add(totalCost); remaining = remaining.sub(used); }
  if (remaining.gt(zero)) throw new Error("Недостаточно доступных партий материала.");
  await db.cosmetologyInventoryItem.update({ where: { id: itemId }, data: { currentQuantity: { decrement: quantityValue } } }); return cost;
}

async function syncVisitServiceSummary(db: Prisma.TransactionClient, visitId: string) { const services = await db.cosmetologyVisitService.findMany({ where: { visitId }, orderBy: { sortOrder: "asc" } }); if (!services.length) throw new Error("Добавьте хотя бы одну услугу."); const plannedAmount = services.reduce((sum, service) => sum.add(service.price), zero); const durations = services.map((service) => service.durationMinutes).filter((duration): duration is number => duration !== null); return db.cosmetologyVisit.update({ where: { id: visitId }, data: { procedureTemplateId: services[0].templateId, procedureName: services.map((service) => service.name).join(" + "), plannedAmount, durationMinutes: durations.length ? durations.reduce((sum, duration) => sum + duration, 0) : null } });
}

async function createVisitUsages(db: Prisma.TransactionClient, userId: string, visitId: string, input: { itemId?: string | null; usageQuantity?: string | null; comment: string | null }, operationDate: Date) { const usages = new Map<string, Prisma.Decimal>(); if (input.itemId && input.usageQuantity) usages.set(input.itemId, decimal(input.usageQuantity)); const services = await db.cosmetologyVisitService.findMany({ where: { visitId }, orderBy: { sortOrder: "asc" } }); const templateIds = [...new Set(services.map((service) => service.templateId).filter((id): id is string => Boolean(id)))]; const templates = templateIds.length ? await db.cosmetologyProcedureTemplate.findMany({ where: { id: { in: templateIds }, userId, deletedAt: null }, include: { materials: true } }) : []; if (templates.length !== templates.length) throw new Error("Одна из техкарт недоступна."); for (const template of templates) for (const material of template.materials) usages.set(material.itemId, (usages.get(material.itemId) ?? zero).add(material.quantity));
  let cost = zero; for (const [itemId, quantityValue] of usages) cost = cost.add(await allocateUsage(db, userId, itemId, quantityValue, operationDate, visitId, input.comment)); return cost;
}

export async function createCosmetologyAppointment(userId: string, input: z.infer<typeof appointmentSchema>) { return prisma.$transaction(async (db) => { let clientId = input.clientId; if (clientId) await ownedClient(userId, clientId); else { const existing = await db.cosmetologyClient.findFirst({ where: { userId, deletedAt: null, displayName: { equals: input.clientName!, mode: "insensitive" } } }); if (existing) clientId = existing.id; else { const parts = input.clientName!.split(/\s+/); const firstName = parts.shift()!; const lastName = parts.join(" ") || "Клиент"; const client = await db.cosmetologyClient.create({ data: { userId, firstName, lastName, displayName: input.clientName, phone: input.phone || "Не указан", phoneLastFour: input.phone ? phoneLastFour(input.phone) : "0000", contactMethod: input.contactValue ? "INSTAGRAM" : "PHONE", contactValue: input.contactValue } }); clientId = client.id; } } const template = input.procedureTemplateId ? await db.cosmetologyProcedureTemplate.findFirst({ where: { id: input.procedureTemplateId, userId, deletedAt: null } }) : null; if (input.procedureTemplateId && !template) throw new Error("Услуга недоступна."); const plannedAmount = input.plannedAmount ? decimal(input.plannedAmount) : template?.basePrice ?? zero; const operationDate = dateFromInput(input.operationDate); const procedureName = template?.name ?? input.procedureName!; const durationMinutes = input.durationMinutes ?? template?.durationMinutes ?? null; const prepayment = paymentComponents(input); const paidAmount = prepayment.reduce((sum, item) => sum.add(item.amount), zero); if (plannedAmount.gt(zero) && paidAmount.gt(plannedAmount)) throw new Error("Предоплата не может быть больше плановой стоимости процедуры."); const visit = await db.cosmetologyVisit.create({ data: { userId, clientId: clientId!, procedureTemplateId: input.procedureTemplateId, procedureName, operationDate, scheduledTime: input.scheduledTime, durationMinutes, plannedAmount, paymentAmount: zero, status: CosmetologyVisitStatus.SCHEDULED, comment: input.comment, services: { create: { templateId: template?.id ?? null, name: procedureName, price: plannedAmount, durationMinutes, sortOrder: 0 } } } }); if (prepayment.length) { const receipt = await recordPayment(db, userId, visit.id, operationDate, prepayment, CosmetologyWalletMovementType.PREPAYMENT, `Предоплата: ${visit.procedureName}`); return db.cosmetologyVisit.update({ where: { id: visit.id }, data: { paidAmount, incomeTransactionId: receipt?.transactionId ?? null } }); } return visit; }); }

export async function addCosmetologyVisitService(userId: string, input: z.infer<typeof visitServiceSchema>) { return prisma.$transaction(async (db) => { const visit = await db.cosmetologyVisit.findFirst({ where: { id: input.visitId, userId, deletedAt: null, status: CosmetologyVisitStatus.SCHEDULED }, include: { services: true } }); if (!visit) throw new Error("Изменять можно только активную запись."); const template = input.templateId ? await ownedTemplate(userId, input.templateId) : null; const service = await db.cosmetologyVisitService.create({ data: { visitId: visit.id, templateId: template?.id ?? null, name: input.name || template!.name, price: input.price ? decimal(input.price) : template?.basePrice ?? zero, durationMinutes: input.durationMinutes ?? template?.durationMinutes ?? null, sortOrder: visit.services.length } }); await syncVisitServiceSummary(db, visit.id); return service; }); }
export async function updateCosmetologyVisitService(userId: string, input: z.infer<typeof visitServiceSchema>) { return prisma.$transaction(async (db) => { if (!input.serviceId) throw new Error("Услуга не найдена."); const service = await db.cosmetologyVisitService.findFirst({ where: { id: input.serviceId, visitId: input.visitId, visit: { userId, deletedAt: null, status: CosmetologyVisitStatus.SCHEDULED } } }); if (!service) throw new Error("Изменять можно только активную запись."); const template = input.templateId ? await ownedTemplate(userId, input.templateId) : null; const updated = await db.cosmetologyVisitService.update({ where: { id: service.id }, data: { templateId: template?.id ?? null, name: input.name || template?.name || service.name, price: input.price ? decimal(input.price) : template?.basePrice ?? service.price, durationMinutes: input.durationMinutes ?? template?.durationMinutes ?? service.durationMinutes } }); await syncVisitServiceSummary(db, input.visitId); return updated; }); }
export async function removeCosmetologyVisitService(userId: string, visitId: string, serviceId: string) { return prisma.$transaction(async (db) => { const service = await db.cosmetologyVisitService.findFirst({ where: { id: serviceId, visitId, visit: { userId, deletedAt: null, status: CosmetologyVisitStatus.SCHEDULED } } }); if (!service) throw new Error("Изменять можно только активную запись."); const count = await db.cosmetologyVisitService.count({ where: { visitId } }); if (count < 2) throw new Error("В записи должна остаться хотя бы одна услуга."); await db.cosmetologyVisitService.delete({ where: { id: serviceId } }); await syncVisitServiceSummary(db, visitId); }); }
async function completeCosmetologyVisitWithoutBonus(userId: string, input: z.infer<typeof completeVisitSchema>) { return prisma.$transaction(async (db) => { const visit = await db.cosmetologyVisit.findFirst({ where: { id: input.id, userId, deletedAt: null, status: CosmetologyVisitStatus.SCHEDULED }, include: { client: { select: { loyaltyClientId: true } }, services: { orderBy: { sortOrder: "asc" } }, payment: { include: { components: true } } } }); if (!visit) throw new Error("Закрыть можно только активную запись."); if (!visit.services.length) throw new Error("Добавьте хотя бы одну услугу."); const operationDate = dateFromInput(input.operationDate); const finalAmount = decimal(input.paymentAmount); const received = paymentComponents(input); const newlyPaid = received.reduce((sum, item) => sum.add(item.amount), zero); const paidAmount = visit.paidAmount.add(newlyPaid); if (paidAmount.gt(finalAmount)) throw new Error("Оплата не может быть больше итоговой суммы. Сначала оформите возврат предоплаты."); const procedureName = visit.services.map((service) => service.name).join(" + "); const receipt = input.moneyAccountId && newlyPaid.gt(zero) ? await recordGeneralWalletPayment(db, userId, visit.id, operationDate, newlyPaid, input.moneyAccountId, decimal(input.procurementAmount ?? "0"), `Оплата процедуры: ${procedureName}`) : await recordPayment(db, userId, visit.id, operationDate, received, CosmetologyWalletMovementType.SETTLEMENT, `Оплата процедуры: ${procedureName}`); const completed = await db.cosmetologyVisit.update({ where: { id: visit.id }, data: { procedureTemplateId: visit.services[0].templateId, procedureName, operationDate, plannedAmount: finalAmount, paymentAmount: finalAmount, paidAmount, comment: input.comment, incomeTransactionId: visit.incomeTransactionId ?? receipt?.transactionId ?? null, costAmount: zero, profitAmount: finalAmount, status: CosmetologyVisitStatus.COMPLETED } }); const monetaryPaid = await monetaryPaymentTotal(db, visit.id); if (visit.client.loyaltyClientId && finalAmount.gt(zero) && paidAmount.eq(finalAmount) && monetaryPaid.gt(zero)) await db.cosmetologyLoyaltyDelivery.create({ data: newLoyaltyDeliveryData(visit.id, visit.client.loyaltyClientId, monetaryPaid.toFixed(2)) }); return completed; }); }

async function completeCosmetologyVisitWithBonus(userId: string, input: z.infer<typeof completeVisitSchema>) {
  if (!isLoyaltyBonusRedemptionEnabled()) throw new Error("Списание бонусов в программе лояльности пока отключено.");
  await prisma.$transaction(async (db) => {
    const visit = await db.cosmetologyVisit.findFirst({ where: { id: input.id, userId, deletedAt: null, status: CosmetologyVisitStatus.SCHEDULED }, include: { client: { select: { loyaltyClientId: true } }, services: { orderBy: { sortOrder: "asc" } } } });
    if (!visit) throw new Error("Закрыть можно только активную запись.");
    if (!visit.services.length) throw new Error("Добавьте хотя бы одну услугу.");
    if (!visit.client.loyaltyClientId || !/^\d+$/.test(visit.client.loyaltyClientId)) throw new Error("Клиент не подключён к Beauty Bonus Club.");
    const operationDate = dateFromInput(input.operationDate); const finalAmount = decimal(input.paymentAmount); const received = paymentComponents(input); const newlyPaid = received.reduce((sum, item) => sum.add(item.amount), zero); const paidAmount = visit.paidAmount.add(newlyPaid);
    if (paidAmount.gt(finalAmount)) throw new Error("Оплата не может быть больше итоговой суммы. Сначала оформите возврат предоплаты.");
    const procedureName = visit.services.map((service) => service.name).join(" + ");
    await db.cosmetologyVisit.update({ where: { id: visit.id }, data: { procedureTemplateId: visit.services[0].templateId, procedureName, operationDate, plannedAmount: finalAmount, paymentAmount: finalAmount, comment: input.comment, costAmount: zero, profitAmount: finalAmount, status: CosmetologyVisitStatus.COMPLETED } });
  });
  const redemption = await prepareBonusRedemption(userId, input);
  return continueBonusRedemption(userId, redemption.id);
}

export async function completeCosmetologyVisit(userId: string, input: z.infer<typeof completeVisitSchema>) {
  if (decimal(input.bonusAmount ?? "0").gt(zero)) return completeCosmetologyVisitWithBonus(userId, input);
  return completeCosmetologyVisitWithoutBonus(userId, input);
}
const monetaryPaymentMethods: CosmetologyPaymentMethod[] = [CosmetologyPaymentMethod.CASH, CosmetologyPaymentMethod.MONOBANK, CosmetologyPaymentMethod.PRIVATBANK, CosmetologyPaymentMethod.OTHER];
const bonusSnapshotSchema = z.object({
  operationDate: date,
  paidBefore: nonNegativeMoney,
  total: nonNegativeMoney,
  components: z.array(z.object({ method: z.nativeEnum(CosmetologyPaymentMethod), amount: nonNegativeMoney, comment: z.string().nullable(), certificateId: z.string().cuid().nullable() })).min(1),
});
type BonusSnapshot = z.infer<typeof bonusSnapshotSchema>;

function snapshotPayment(input: z.input<typeof payVisitSchema>, paidBefore: Prisma.Decimal): BonusSnapshot {
  return {
    operationDate: input.operationDate,
    paidBefore: paidBefore.toFixed(2),
    total: input.paymentTotal,
    components: paymentComponents(input).map((item) => ({ method: item.method, amount: item.amount.toFixed(2), comment: item.comment, certificateId: item.certificateId })),
  };
}

function snapshotComponents(snapshot: BonusSnapshot): PaymentComponentInput[] {
  return snapshot.components.map((item) => ({
    method: item.method,
    wallet: item.method === CosmetologyPaymentMethod.CASH ? CosmetologyWallet.CASH : item.method === CosmetologyPaymentMethod.MONOBANK ? CosmetologyWallet.MONO : item.method === CosmetologyPaymentMethod.PRIVATBANK ? CosmetologyWallet.PRIVAT : item.method === CosmetologyPaymentMethod.OTHER ? CosmetologyWallet.OTHER : null,
    amount: decimal(item.amount),
    comment: item.comment,
    certificateId: item.certificateId,
  }));
}

function externalBonusRedemptionId(visitId: string, requestKey: string) {
  return `fevora:visit:${visitId}:bonus-redemption:${requestKey}`;
}

function bonusRedemptionErrorCode(error: unknown) {
  if (!(error instanceof BotClientApiError)) return "UNAVAILABLE";
  return error.code;
}

function isFinalBonusRedemptionError(code: string) {
  return ["CONFLICT", "INSUFFICIENT_BONUS", "NOT_FOUND", "VALIDATION", "UNAUTHORIZED", "INVALID_RESPONSE"].includes(code);
}

async function prepareBonusRedemption(userId: string, input: z.input<typeof payVisitSchema>) {
  const bonusAmount = decimal(input.bonusAmount ?? "0");
  const requestKey = input.paymentRequestKey;
  if (bonusAmount.lte(zero) || !requestKey) throw new Error("Укажите корректную сумму бонусов.");
  return prisma.$transaction(async (db) => {
    const visit = await db.cosmetologyVisit.findFirst({ where: { id: input.id, userId, deletedAt: null, status: CosmetologyVisitStatus.COMPLETED }, include: { client: { select: { loyaltyClientId: true } } } });
    if (!visit) throw new Error("Оплатить можно только завершённую процедуру.");
    if (!visit.client.loyaltyClientId || !/^\d+$/.test(visit.client.loyaltyClientId)) throw new Error("Клиент не подключён к Beauty Bonus Club.");
    const remaining = visit.paymentAmount.sub(visit.paidAmount);
    const total = decimal(input.paymentTotal);
    if (total.lte(zero)) throw new Error("Укажите сумму оплаты.");
    if (total.gt(remaining)) throw new Error(`Оплата не может быть больше остатка ${remaining.toFixed(2)} грн.`);
    const existing = await db.cosmetologyBonusRedemption.findFirst({ where: { visitId: visit.id, requestKey } });
    if (existing) return existing;
    const unresolved = await db.cosmetologyBonusRedemption.findFirst({ where: { visitId: visit.id, status: { in: [CosmetologyBonusRedemptionStatus.PENDING, CosmetologyBonusRedemptionStatus.SENDING, CosmetologyBonusRedemptionStatus.REMOTE_CONFIRMED, CosmetologyBonusRedemptionStatus.FAILED_RETRYABLE] } } });
    if (unresolved) throw new Error("Предыдущее списание бонусов ещё не завершено. Повторите его из карточки процедуры.");
    const payment = await db.cosmetologyPayment.upsert({ where: { visitId: visit.id }, create: { userId, visitId: visit.id, currency: "UAH" }, update: {} });
    return db.cosmetologyBonusRedemption.create({ data: {
      userId,
      visitId: visit.id,
      paymentId: payment.id,
      requestKey,
      externalEventId: externalBonusRedemptionId(visit.id, requestKey),
      loyaltyClientId: visit.client.loyaltyClientId,
      bonusAmount,
      currency: "UAH",
      paymentSnapshot: snapshotPayment(input, visit.paidAmount),
    } });
  });
}

async function applyConfirmedBonusRedemption(userId: string, redemptionId: string) {
  return prisma.$transaction(async (db) => {
    const redemption = await db.cosmetologyBonusRedemption.findFirst({ where: { id: redemptionId, userId, status: CosmetologyBonusRedemptionStatus.REMOTE_CONFIRMED } });
    if (!redemption) throw new Error("Списание бонусов уже применяется другим запросом или недоступно.");
    const lock = await db.cosmetologyBonusRedemption.updateMany({ where: { id: redemption.id, status: CosmetologyBonusRedemptionStatus.REMOTE_CONFIRMED }, data: { status: CosmetologyBonusRedemptionStatus.SENDING } });
    if (lock.count !== 1) throw new Error("Списание бонусов уже применяется другим запросом.");
    const snapshot = bonusSnapshotSchema.parse(redemption.paymentSnapshot);
    const visit = await db.cosmetologyVisit.findFirst({ where: { id: redemption.visitId, userId, deletedAt: null, status: CosmetologyVisitStatus.COMPLETED }, include: { client: { select: { loyaltyClientId: true } }, loyaltyDelivery: true } });
    if (!visit || visit.client.loyaltyClientId !== redemption.loyaltyClientId) throw new Error("Данные процедуры изменились. Бонусы уже списаны, обратитесь к администратору.");
    const items = snapshotComponents(snapshot);
    const total = items.reduce((sum, item) => sum.add(item.amount), zero);
    if (total.lte(zero) || !total.eq(decimal(snapshot.total)) || !items.some((item) => item.method === CosmetologyPaymentMethod.BONUS && item.amount.eq(redemption.bonusAmount))) throw new Error("Сохранённые данные списания бонусов некорректны.");
    const claim = await db.cosmetologyVisit.updateMany({ where: { id: visit.id, userId, paidAmount: decimal(snapshot.paidBefore) }, data: { paidAmount: { increment: total } } });
    if (claim.count !== 1) throw new Error("Оплата процедуры изменилась. Бонусы уже списаны, повторите завершение оплаты после проверки.");
    const receipt = await recordPayment(db, userId, visit.id, dateFromInput(snapshot.operationDate), items, CosmetologyWalletMovementType.DEBT_PAYMENT, `Оплата процедуры: ${visit.procedureName}`);
    if (!receipt?.bonusComponentId) throw new Error("Не удалось связать списание бонусов с оплатой.");
    if (!visit.incomeTransactionId && receipt.transactionId) await db.cosmetologyVisit.update({ where: { id: visit.id }, data: { incomeTransactionId: receipt.transactionId } });
    const paidAmount = visit.paidAmount.add(total);
    const monetaryPaid = await monetaryPaymentTotal(db, visit.id);
    if (paidAmount.eq(visit.paymentAmount) && visit.client.loyaltyClientId && !visit.loyaltyDelivery && monetaryPaid.gt(zero)) await db.cosmetologyLoyaltyDelivery.create({ data: newLoyaltyDeliveryData(visit.id, visit.client.loyaltyClientId, monetaryPaid.toFixed(2)) });
    await db.cosmetologyBonusRedemption.update({ where: { id: redemption.id }, data: { status: CosmetologyBonusRedemptionStatus.APPLIED, paymentComponentId: receipt.bonusComponentId, lastErrorCode: null } });
    return db.cosmetologyVisit.findUniqueOrThrow({ where: { id: visit.id } });
  });
}

async function continueBonusRedemption(userId: string, redemptionId: string) {
  let redemption = await prisma.cosmetologyBonusRedemption.findFirst({ where: { id: redemptionId, userId } });
  if (!redemption) throw new Error("Списание бонусов не найдено.");
  if (redemption.status === CosmetologyBonusRedemptionStatus.APPLIED) return prisma.cosmetologyVisit.findUniqueOrThrow({ where: { id: redemption.visitId } });
  if (redemption.status === CosmetologyBonusRedemptionStatus.REMOTE_CONFIRMED) return applyConfirmedBonusRedemption(userId, redemption.id);
  if (redemption.status === CosmetologyBonusRedemptionStatus.CONFLICT || redemption.status === CosmetologyBonusRedemptionStatus.FAILED_FINAL) throw new Error("Это списание бонусов нельзя повторить автоматически.");
  const now = new Date();
  const staleBefore = new Date(now.getTime() - 2 * 60 * 1000);
  const claimed = await prisma.cosmetologyBonusRedemption.updateMany({ where: { id: redemption.id, userId, OR: [{ status: { in: [CosmetologyBonusRedemptionStatus.PENDING, CosmetologyBonusRedemptionStatus.FAILED_RETRYABLE] } }, { status: CosmetologyBonusRedemptionStatus.SENDING, lastAttemptAt: { lt: staleBefore } }] }, data: { status: CosmetologyBonusRedemptionStatus.SENDING, attemptCount: { increment: 1 }, lastAttemptAt: now, lastErrorCode: null } });
  if (claimed.count !== 1) throw new Error("Списание бонусов уже выполняется другим запросом.");
  redemption = await prisma.cosmetologyBonusRedemption.findUniqueOrThrow({ where: { id: redemption.id } });
  try {
    const response = await postLoyaltyBonusRedemption({ external_event_id: redemption.externalEventId, client_id: Number(redemption.loyaltyClientId), amount: Number(redemption.bonusAmount), currency: "UAH", source: "FEVORA", reference: { visit_id: redemption.visitId, payment_id: redemption.paymentId } });
    if (response.externalEventId !== redemption.externalEventId || response.clientId !== redemption.loyaltyClientId || response.currency !== redemption.currency || response.amountRedeemed !== Number(redemption.bonusAmount)) throw new BotClientApiError("INVALID_RESPONSE");
    await prisma.cosmetologyBonusRedemption.update({ where: { id: redemption.id }, data: { status: CosmetologyBonusRedemptionStatus.REMOTE_CONFIRMED, remoteRedemptionId: response.redemptionId, balanceBefore: response.balanceBefore, balanceAfter: response.balanceAfter, confirmedAt: new Date(), lastErrorCode: null } });
  } catch (error) {
    const code = bonusRedemptionErrorCode(error);
    await prisma.cosmetologyBonusRedemption.update({ where: { id: redemption.id }, data: { status: code === "CONFLICT" ? CosmetologyBonusRedemptionStatus.CONFLICT : isFinalBonusRedemptionError(code) ? CosmetologyBonusRedemptionStatus.FAILED_FINAL : CosmetologyBonusRedemptionStatus.FAILED_RETRYABLE, lastErrorCode: code } });
    throw error;
  }
  return applyConfirmedBonusRedemption(userId, redemption.id);
}

export async function retryCosmetologyBonusRedemption(userId: string, redemptionId: string) {
  return continueBonusRedemption(userId, redemptionId);
}

async function payCosmetologyVisitWithoutBonus(userId: string, input: z.input<typeof payVisitSchema>) { return prisma.$transaction(async (db) => {
  const visit = await db.cosmetologyVisit.findFirst({ where: { id: input.id, userId, deletedAt: null, status: CosmetologyVisitStatus.COMPLETED }, include: { client: { select: { loyaltyClientId: true } }, loyaltyDelivery: true } });
  if (!visit) throw new Error("Оплатить можно только завершённую процедуру.");
  const remaining = visit.paymentAmount.sub(visit.paidAmount);
  if (remaining.lte(zero)) throw new Error("Процедура уже оплачена полностью.");
  const received = paymentComponents(input);
  const payment = received.reduce((sum, item) => sum.add(item.amount), zero);
  if (payment.lte(zero)) throw new Error("Укажите сумму оплаты деньгами или сертификатом.");
  if (payment.gt(remaining)) throw new Error(`Оплата не может быть больше остатка ${remaining.toFixed(2)} грн.`);

  const claimed = await db.cosmetologyVisit.updateMany({ where: { id: visit.id, userId, deletedAt: null, status: CosmetologyVisitStatus.COMPLETED, paidAmount: visit.paidAmount }, data: { paidAmount: { increment: payment } } });
  if (claimed.count !== 1) throw new Error("Оплата уже изменена другим запросом. Обновите страницу.");

  const operationDate = dateFromInput(input.operationDate);
  const receipt = await recordPayment(db, userId, visit.id, operationDate, received, CosmetologyWalletMovementType.DEBT_PAYMENT, `Оплата процедуры: ${visit.procedureName}`);
  const paidAmount = visit.paidAmount.add(payment);
  if (!visit.incomeTransactionId && receipt) await db.cosmetologyVisit.update({ where: { id: visit.id }, data: { incomeTransactionId: receipt.transactionId } });

  const monetaryPaid = await monetaryPaymentTotal(db, visit.id);
  if (paidAmount.eq(visit.paymentAmount) && visit.client.loyaltyClientId && !visit.loyaltyDelivery && monetaryPaid.gt(zero)) {
    await db.cosmetologyLoyaltyDelivery.create({ data: newLoyaltyDeliveryData(visit.id, visit.client.loyaltyClientId, monetaryPaid.toFixed(2)) });
  }
  return db.cosmetologyVisit.findUniqueOrThrow({ where: { id: visit.id } });
}); }

export async function payCosmetologyVisit(userId: string, input: z.input<typeof payVisitSchema>) {
  if (decimal(input.bonusAmount ?? "0").gt(zero)) {
    const redemption = await prepareBonusRedemption(userId, input);
    return continueBonusRedemption(userId, redemption.id);
  }
  return payCosmetologyVisitWithoutBonus(userId, input);
}
export async function softDeleteCosmetologyVisit(userId: string, id: string) { return prisma.$transaction(async (db) => { const visit = await db.cosmetologyVisit.findFirst({ where: { id, userId, deletedAt: null }, include: { usages: { where: { deletedAt: null } }, walletMovements: { where: { deletedAt: null } }, payment: { include: { transactions: true, components: { select: { method: true } } } } } }); if (!visit) throw new Error("Запись не найдена."); if (visit.payment?.components.some((component) => component.method === CosmetologyPaymentMethod.CERTIFICATE || component.method === CosmetologyPaymentMethod.BONUS)) throw new Error("Процедуру с сертификатом или списанными бонусами нельзя удалить до реализации возврата."); const deletedAt = new Date(); for (const usage of visit.usages) { await db.cosmetologyInventoryLot.update({ where: { id: usage.lotId }, data: { availableQuantity: { increment: usage.quantity } } }); await db.cosmetologyInventoryItem.update({ where: { id: usage.itemId }, data: { currentQuantity: { increment: usage.quantity } } }); } await db.cosmetologyProcedureMaterialUsage.updateMany({ where: { visitId: id, deletedAt: null }, data: { deletedAt } }); await db.cosmetologyInventoryMovement.updateMany({ where: { visitId: id, deletedAt: null }, data: { deletedAt } }); await db.cosmetologyWalletMovement.updateMany({ where: { visitId: id, deletedAt: null }, data: { deletedAt } }); const transactionIds = [...visit.walletMovements.map((item) => item.transactionId), ...(visit.payment?.transactions.map((item) => item.id) ?? [])].filter((item): item is string => Boolean(item)); if (transactionIds.length) await db.transaction.updateMany({ where: { id: { in: transactionIds }, userId, deletedAt: null }, data: { deletedAt } }); return db.cosmetologyVisit.update({ where: { id }, data: { deletedAt, status: CosmetologyVisitStatus.CANCELLED } }); }); }

export async function createCosmetologyTemplate(userId: string, input: z.infer<typeof templateSchema>) { return prisma.cosmetologyProcedureTemplate.create({ data: { userId, ...input, basePrice: input.basePrice ? decimal(input.basePrice) : null } }); }
export async function addTemplateMaterial(userId: string, input: z.infer<typeof templateMaterialSchema>) { await ownedItem(userId, input.itemId); const template = await prisma.cosmetologyProcedureTemplate.findFirst({ where: { id: input.templateId, userId, deletedAt: null } }); if (!template) throw new Error("Процедура не найдена."); return prisma.cosmetologyProcedureMaterialTemplate.upsert({ where: { templateId_itemId: { templateId: input.templateId, itemId: input.itemId } }, create: { templateId: input.templateId, itemId: input.itemId, quantity: decimal(input.quantity) }, update: { quantity: decimal(input.quantity) } }); }
export async function createInventoryChange(userId: string, input: z.infer<typeof inventoryChangeSchema>) {
  const item = await ownedItem(userId, input.itemId);
  const quantityValue = decimal(input.quantity);
  if (input.type === "WRITE_OFF" && item.currentQuantity.lt(quantityValue)) throw new Error("Нельзя списать больше остатка.");
  const operationDate = dateFromInput(input.operationDate);
  return prisma.$transaction(async (db) => {
    if (input.type === "WRITE_OFF") {
      const lots = await db.cosmetologyInventoryLot.findMany({ where: { userId, itemId: item.id, deletedAt: null, availableQuantity: { gt: zero } }, orderBy: [{ expiryDate: "asc" }, { purchaseDate: "asc" }] });
      let remaining = quantityValue;
      for (const lot of lots) {
        if (remaining.lte(zero)) break;
        const used = Prisma.Decimal.min(lot.availableQuantity, remaining);
        await db.cosmetologyInventoryLot.update({ where: { id: lot.id }, data: { availableQuantity: { decrement: used } } });
        await db.cosmetologyInventoryMovement.create({ data: { userId, itemId: item.id, lotId: lot.id, type: CosmetologyInventoryMovementType.WRITE_OFF, quantity: used.neg(), operationDate, comment: input.comment } });
        remaining = remaining.sub(used);
      }
      if (remaining.gt(zero)) throw new Error("Недостаточно доступных партий для списания.");
      await db.cosmetologyInventoryItem.update({ where: { id: item.id }, data: { currentQuantity: { decrement: quantityValue } } });
      return { itemId: item.id };
    }
    const lot = await db.cosmetologyInventoryLot.create({ data: { userId, itemId: item.id, initialQuantity: quantityValue, availableQuantity: quantityValue, totalAmount: zero, unitCost: zero, purchaseDate: operationDate, comment: input.comment } });
    const movement = await db.cosmetologyInventoryMovement.create({ data: { userId, itemId: item.id, lotId: lot.id, type: CosmetologyInventoryMovementType.ADJUSTMENT, quantity: quantityValue, operationDate, comment: input.comment } });
    await db.cosmetologyInventoryItem.update({ where: { id: item.id }, data: { currentQuantity: { increment: quantityValue } } });
    return movement;
  });
}

export async function getCosmetologyExpenseCategories(userId: string) { await ensureCategories(userId); return prisma.cosmetologyExpenseCategory.findMany({ where: { userId, isArchived: false }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }); }
export async function createCosmetologyExpense(userId: string, input: z.infer<typeof expenseSchema>) { await ensureCategories(userId); let category = input.categoryId ? await prisma.cosmetologyExpenseCategory.findFirst({ where: { id: input.categoryId, userId, isArchived: false } }) : null; if (input.newCategoryName) { const existing = await prisma.cosmetologyExpenseCategory.findFirst({ where: { userId, name: { equals: input.newCategoryName, mode: "insensitive" } } }); category = existing?.isArchived ? await prisma.cosmetologyExpenseCategory.update({ where: { id: existing.id }, data: { isArchived: false } }) : existing ?? await prisma.cosmetologyExpenseCategory.create({ data: { userId, name: input.newCategoryName } }); } if (!category) throw new Error("Категория недоступна."); return prisma.$transaction(async (db) => { const amount = decimal(input.amount); const operationDate = dateFromInput(input.operationDate); const transaction = await db.transaction.create({ data: { userId, type: TransactionType.EXPENSE, amount, operationDate, module: FinanceModule.COSMETOLOGY, description: input.description, source: "WEB" } }); await db.cosmetologyWalletMovement.create({ data: { userId, wallet: input.wallet, type: CosmetologyWalletMovementType.EXPENSE, amount: amount.neg(), operationDate, description: input.description, transactionId: transaction.id } }); return db.cosmetologyExpense.create({ data: { userId, transactionId: transaction.id, categoryId: category!.id, comment: input.comment } }); }); }
export async function createTreatmentPlanItem(userId: string, input: z.infer<typeof planSchema>) { await ownedClient(userId, input.clientId); return prisma.cosmetologyTreatmentPlanItem.create({ data: { userId, ...input, plannedDate: input.plannedDate ? dateFromInput(input.plannedDate) : null } }); }

export async function getCosmetologyClient(userId: string, id: string) { const client = await prisma.cosmetologyClient.findFirst({ where: { id, userId, deletedAt: null }, include: { referrer: { select: { id: true, displayName: true, firstName: true, lastName: true } }, referrals: { where: { deletedAt: null }, select: { id: true, displayName: true, firstName: true, lastName: true }, orderBy: { createdAt: "desc" } }, visits: { where: { deletedAt: null }, include: { usages: { where: { deletedAt: null }, include: { item: true } } }, orderBy: { operationDate: "desc" } }, planItems: { where: { deletedAt: null }, orderBy: { plannedDate: "asc" } } } }); if (!client) throw new Error("Клиент не найден."); const paid = client.visits.reduce((sum, visit) => sum.add(visit.paidAmount), zero); return { ...client, summary: { visits: client.visits.length, referrals: client.referrals.length, paid: paid.toString(), average: client.visits.length ? paid.div(client.visits.length).toString() : "0.00", lastVisit: client.visits[0]?.operationDate ?? null } }; }
export async function getCosmetologyVisit(userId: string, id: string) {
  const visit = await prisma.cosmetologyVisit.findFirst({
    where: { id, userId, deletedAt: null },
    include: {
      client: true,
      services: { include: { template: { include: { materials: { include: { item: true } } } } }, orderBy: { sortOrder: "asc" } },
      usages: { where: { deletedAt: null }, include: { item: true, lot: true } },
      incomeTransaction: true,
      loyaltyDelivery: true,
      bonusRedemptions: { include: { paymentComponent: true }, orderBy: { createdAt: "desc" } },
      payment: { include: { components: { include: { transaction: true, certificate: true }, orderBy: [{ operationDate: "asc" }, { createdAt: "asc" }] } } },
    }
  });
  if (!visit) throw new Error("Визит не найден.");
  return visit;
}
export async function getCosmetologyAppointments(userId: string) { return prisma.cosmetologyVisit.findMany({ where: { userId, deletedAt: null }, include: { client: true, procedureTemplate: true }, orderBy: [{ operationDate: "asc" }, { scheduledTime: "asc" }] }); }
export async function getCosmetologyMoneyOptions(userId: string) {
  const accounts = await prisma.moneyAccount.findMany({ where: { userId, isActive: true, OR: [{ kind: MoneyAccountKind.WALLET }, { kind: MoneyAccountKind.ENVELOPE, project: { code: FinanceModule.COSMETOLOGY }, name: { contains: "закуп", mode: "insensitive" } }] }, include: { project: true }, orderBy: [{ kind: "asc" }, { name: "asc" }] });
  return { wallets: accounts.filter((account) => account.kind === MoneyAccountKind.WALLET), procurementEnvelope: accounts.find((account) => account.kind === MoneyAccountKind.ENVELOPE) ?? null };
}
export async function getCosmetologyProcurementReserveHistory(userId: string) {
  const envelope = await prisma.moneyAccount.findFirst({ where: { userId, kind: MoneyAccountKind.ENVELOPE, isActive: true, project: { code: FinanceModule.COSMETOLOGY }, name: { contains: "закуп", mode: "insensitive" } } });
  if (!envelope) return { envelope: null, entries: [] };
  const entries = await prisma.moneyLedgerEntry.findMany({ where: { accountId: envelope.id, reversedAt: null }, include: { transaction: { include: { cosmetologyVisit: true, cosmetologyLot: { include: { item: true } } } } }, orderBy: [{ operationDate: "desc" }, { createdAt: "desc" }] });
  return { envelope, entries };
}
export async function getCosmetologyInventoryItemHistory(userId: string, id: string) {
  const item = await prisma.cosmetologyInventoryItem.findFirst({ where: { id, userId, deletedAt: null }, include: { lots: { where: { deletedAt: null }, orderBy: { purchaseDate: "desc" } } } });
  if (!item) throw new Error("Препарат не найден.");
  return item;
}
export async function getCosmetologyOperations(userId: string) { const [appointments, movements, items] = await Promise.all([getCosmetologyAppointments(userId), prisma.cosmetologyWalletMovement.findMany({ where: { userId, deletedAt: null }, select: { wallet: true, amount: true } }), prisma.cosmetologyInventoryItem.findMany({ where: { userId, deletedAt: null }, orderBy: { name: "asc" } })]); const balances = Object.fromEntries(Object.values(CosmetologyWallet).map((wallet) => [wallet, "0.00"])) as Record<CosmetologyWallet, string>; for (const movement of movements) balances[movement.wallet] = new Prisma.Decimal(balances[movement.wallet]).add(movement.amount).toFixed(2); const debts = appointments.filter((item) => item.status === CosmetologyVisitStatus.COMPLETED && item.paymentAmount.gt(item.paidAmount)); return { appointments, balances, debts, lowStock: items.filter((item) => item.currentQuantity.lte(item.minimumQuantity)) }; }
export async function getCosmetologyDashboard(userId: string, period: "TODAY" | "WEEK" | "MONTH" | "YEAR" = "MONTH") {
  await ensureCategories(userId);
  const from = periodStart(period, dateFromInput(todayInputValue()));
  const [items, clients, templates, visits, paymentComponents, lots, expenses, categories] = await Promise.all([
    prisma.cosmetologyInventoryItem.findMany({ where: { userId, deletedAt: null }, include: { lots: { where: { deletedAt: null } } }, orderBy: { name: "asc" } }),
    prisma.cosmetologyClient.findMany({ where: { userId, deletedAt: null }, orderBy: [{ lastName: "asc" }, { firstName: "asc" }] }),
    prisma.cosmetologyProcedureTemplate.findMany({ where: { userId, deletedAt: null, isArchived: false }, include: { materials: { include: { item: true } } }, orderBy: { name: "asc" } }),
    prisma.cosmetologyVisit.findMany({ where: { userId, deletedAt: null, status: CosmetologyVisitStatus.COMPLETED, operationDate: { gte: from } }, include: { client: true, procedureTemplate: true, usages: { where: { deletedAt: null }, include: { item: true } } }, orderBy: { operationDate: "desc" } }),
    prisma.cosmetologyPaymentComponent.findMany({ where: { operationDate: { gte: from }, method: { in: monetaryPaymentMethods }, payment: { userId, visit: { deletedAt: null } }, transaction: { is: { deletedAt: null } } }, include: { payment: { include: { visit: { include: { client: true } } } } }, orderBy: [{ operationDate: "desc" }, { createdAt: "desc" }] }),
    prisma.cosmetologyInventoryLot.findMany({ where: { userId, deletedAt: null }, include: { item: true }, orderBy: { purchaseDate: "desc" } }),
    prisma.cosmetologyExpense.findMany({ where: { userId, deletedAt: null, transaction: { deletedAt: null, operationDate: { gte: from } } }, include: { transaction: { include: { cosmetologyLot: true } }, category: true }, orderBy: { transaction: { operationDate: "desc" } } }),
    getCosmetologyExpenseCategories(userId),
  ]);
  const income = paymentComponents.reduce((sum, component) => sum.add(component.amount), zero);
  const cost = visits.reduce((sum, visit) => sum.add(visit.costAmount), zero);
  const operationalExpense = expenses.filter((expense) => !expense.transaction.cosmetologyLot).reduce((sum, expense) => sum.add(expense.transaction.amount), zero);
  const purchaseExpense = lots.filter((lot) => lot.purchaseDate >= from).reduce((sum, lot) => sum.add(lot.totalAmount), zero);
  return { items, clients, templates, visits, paymentComponents, lots, expenses, categories, report: { income: income.toString(), cost: cost.toString(), operationalExpense: operationalExpense.toString(), cashExpense: purchaseExpense.add(operationalExpense).toString(), procedureProfit: income.sub(cost).toString(), result: income.sub(cost).sub(operationalExpense).toString() } };
}

export const cashReportSchema = z.object({
  from: date,
  to: date,
  method: z.enum(["ALL", "CASH", "MONOBANK", "PRIVATBANK", "OTHER"]),
}).refine((value) => value.from <= value.to, { path: ["to"], message: "Дата окончания не может быть раньше даты начала." });

export async function getCosmetologyCashReport(userId: string, input: z.infer<typeof cashReportSchema>) {
  const parsed = cashReportSchema.parse(input);
  const from = dateFromInput(parsed.from);
  const toExclusive = dateFromInput(parsed.to);
  toExclusive.setUTCDate(toExclusive.getUTCDate() + 1);
  const [components, certificateComponents, bonusComponents] = await Promise.all([prisma.cosmetologyPaymentComponent.findMany({
    where: {
      operationDate: { gte: from, lt: toExclusive },
      method: parsed.method === "ALL" ? { in: monetaryPaymentMethods } : parsed.method,
      payment: { userId, visit: { deletedAt: null } },
      transaction: { is: { deletedAt: null } },
    },
    include: { payment: { include: { visit: { include: { client: true } } } } },
    orderBy: [{ operationDate: "desc" }, { createdAt: "desc" }],
  }), prisma.cosmetologyPaymentComponent.findMany({ where: { operationDate: { gte: from, lt: toExclusive }, method: CosmetologyPaymentMethod.CERTIFICATE, payment: { userId, visit: { deletedAt: null } } } }), prisma.cosmetologyPaymentComponent.findMany({ where: { operationDate: { gte: from, lt: toExclusive }, method: CosmetologyPaymentMethod.BONUS, payment: { userId, visit: { deletedAt: null } } } })]);
  const totals = Object.fromEntries(monetaryPaymentMethods.map((method) => [method, zero])) as Record<"CASH" | "MONOBANK" | "PRIVATBANK" | "OTHER", Prisma.Decimal>;
  for (const component of components) { const method = component.method as "CASH" | "MONOBANK" | "PRIVATBANK" | "OTHER"; totals[method] = totals[method].add(component.amount); }
  const total = Object.values(totals).reduce((sum, amount) => sum.add(amount), zero);
  const componentTotal = components.reduce((sum, component) => sum.add(component.amount), zero);
  return {
    from: parsed.from,
    to: parsed.to,
    method: parsed.method,
    components,
    totals: Object.fromEntries(Object.entries(totals).map(([method, amount]) => [method, amount.toFixed(2)])) as Record<"CASH" | "MONOBANK" | "PRIVATBANK" | "OTHER", string>,
    total: total.toFixed(2),
    certificateTotal: certificateComponents.reduce((sum, component) => sum.add(component.amount), zero).toFixed(2),
    bonusTotal: (bonusComponents ?? []).reduce((sum, component) => sum.add(component.amount), zero).toFixed(2),
    balanced: total.eq(componentTotal),
  };
}
