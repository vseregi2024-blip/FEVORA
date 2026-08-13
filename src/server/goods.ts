import "server-only";

import { FinanceModule, Prisma, ProductInventoryMovementType, ProductUnit } from "@prisma/client";
import { z } from "zod";

import { allocationCost, fifoAllocate, tradeProfit } from "@/features/goods/calculations";
import { periodStart } from "@/features/family/calculations";
import { dateFromInput, todayInputValue } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

const money = z.string().trim().regex(/^\d+(?:[.,]\d{1,2})?$/);
const positiveInteger = z.coerce.number().int().positive();
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const optional = z.string().trim().max(500).nullable();
const decimal = (value: string) => new Prisma.Decimal(value.replace(",", "."));

export const productSchema = z.object({ name: z.string().trim().min(1).max(120), categoryId: z.string().cuid().nullable(), brand: z.string().trim().max(80).nullable(), unit: z.nativeEnum(ProductUnit), openingQuantity: z.coerce.number().int().nonnegative(), openingUnitCost: money.nullable(), openingDate: date, defaultSalePrice: money.nullable(), comment: optional }).superRefine((value, context) => {
  if (value.openingQuantity > 0 && !value.openingUnitCost) context.addIssue({ code: z.ZodIssueCode.custom, path: ["openingUnitCost"], message: "Укажите закупочную цену для стартового остатка." });
});
export const productCategorySchema = z.object({ name: z.string().trim().min(1).max(80) });
export const purchaseSchema = z.object({ productId: z.string().cuid(), quantity: positiveInteger, unitPurchasePrice: money, deliveryAmount: money.nullable(), deliveryInCost: z.boolean(), supplier: z.string().trim().max(120).nullable(), operationDate: date, comment: optional });
export const saleSchema = z.object({ productId: z.string().cuid(), quantity: positiveInteger, unitSalePrice: money, totalAmount: money.nullable(), buyer: z.string().trim().max(120).nullable(), operationDate: date, comment: optional });
export const inventoryChangeSchema = z.object({ productId: z.string().cuid(), quantity: z.coerce.number().int().refine((value) => value !== 0, "Укажите изменение количества."), operationDate: date, comment: z.string().trim().min(1).max(500), type: z.enum(["WRITE_OFF", "ADJUSTMENT"]) });
export const goodsExpenseSchema = z.object({ categoryId: z.string().cuid(), amount: money, operationDate: date, description: z.string().trim().min(1).max(500) });

export const formValue = (formData: FormData, name: string) => { const value = formData.get(name); return typeof value === "string" && value.trim() ? value.trim() : null; };

async function goodsCategory(userId: string, name: string, kind: "INCOME" | "EXPENSE") {
  const category = await prisma.category.findFirst({ where: { module: FinanceModule.GOODS, name, isArchived: false, OR: [{ userId }, { userId: null }] } });
  if (!category || (category.kind !== kind && category.kind !== "BOTH")) throw new Error("Системная категория Товарки не найдена.");
  return category;
}

export async function getGoodsCategories(userId: string) { return prisma.productCategory.findMany({ where: { isArchived: false, OR: [{ userId }, { userId: null }] }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }); }
export async function getGoodsExpenseCategories(userId: string) { return prisma.category.findMany({ where: { module: FinanceModule.GOODS, isArchived: false, OR: [{ userId }, { userId: null }] }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }); }

export async function createProduct(userId: string, input: z.infer<typeof productSchema>) {
  if (input.categoryId && !await prisma.productCategory.findFirst({ where: { id: input.categoryId, OR: [{ userId }, { userId: null }], isArchived: false } })) throw new Error("Категория недоступна.");
  const { openingQuantity, openingUnitCost, openingDate, defaultSalePrice, ...productInput } = input;
  return prisma.$transaction(async (db) => {
    const product = await db.product.create({ data: { userId, ...productInput, currentQuantity: openingQuantity, defaultSalePrice: defaultSalePrice ? decimal(defaultSalePrice) : null } });
    if (openingQuantity > 0 && openingUnitCost) {
      const receivedDate = dateFromInput(openingDate);
      const movement = await db.productInventoryMovement.create({ data: { userId, productId: product.id, type: "ADJUSTMENT", quantity: openingQuantity, operationDate: receivedDate, comment: "Стартовый остаток" } });
      await db.productInventoryLot.create({ data: { userId, productId: product.id, adjustmentMovementId: movement.id, initialQuantity: openingQuantity, availableQuantity: openingQuantity, unitCost: decimal(openingUnitCost), receivedDate, comment: "Стартовый остаток" } });
    }
    return product;
  });
}

export async function createProductCategory(userId: string, input: z.infer<typeof productCategorySchema>) {
  const exists = await prisma.productCategory.findFirst({ where: { userId, name: { equals: input.name, mode: "insensitive" } } });
  if (exists) throw new Error("Такая категория уже существует.");
  return prisma.productCategory.create({ data: { userId, name: input.name } });
}

export async function createProductPurchase(userId: string, input: z.infer<typeof purchaseSchema>) {
  const product = await prisma.product.findFirst({ where: { id: input.productId, userId, deletedAt: null, status: "ACTIVE" } });
  if (!product) throw new Error("Товар не найден.");
  const purchaseValue = decimal(input.unitPurchasePrice).mul(input.quantity);
  const delivery = decimal(input.deliveryAmount ?? "0");
  const total = input.deliveryInCost ? purchaseValue.add(delivery) : purchaseValue;
  const unitCost = total.div(input.quantity);
  const category = await goodsCategory(userId, "Закупка товара", "EXPENSE");
  return prisma.$transaction(async (db) => {
    const expense = await db.transaction.create({ data: { userId, type: "EXPENSE", amount: total, operationDate: dateFromInput(input.operationDate), module: FinanceModule.GOODS, categoryId: category.id, description: `Закупка: ${product.name}`, source: "WEB" } });
    const purchase = await db.productPurchase.create({ data: { userId, productId: product.id, quantity: input.quantity, unitPurchasePrice: decimal(input.unitPurchasePrice), deliveryAmount: delivery, deliveryInCost: input.deliveryInCost, totalAmount: total, supplier: input.supplier, operationDate: dateFromInput(input.operationDate), comment: input.comment, expenseTransactionId: expense.id } });
    const lot = await db.productInventoryLot.create({ data: { userId, productId: product.id, purchaseId: purchase.id, initialQuantity: input.quantity, availableQuantity: input.quantity, unitCost, receivedDate: dateFromInput(input.operationDate), comment: input.comment } });
    await db.productInventoryMovement.create({ data: { userId, productId: product.id, type: "PURCHASE", quantity: input.quantity, operationDate: dateFromInput(input.operationDate), comment: input.comment, purchaseId: purchase.id } });
    await db.product.update({ where: { id: product.id }, data: { currentQuantity: { increment: input.quantity } } });
    if (!input.deliveryInCost && delivery.gt(0)) {
      const deliveryCategory = await db.category.findFirst({ where: { module: FinanceModule.GOODS, name: "Доставка", isArchived: false, OR: [{ userId }, { userId: null }] } });
      if (!deliveryCategory) throw new Error("Системная категория доставки не найдена.");
      const deliveryTransaction = await db.transaction.create({ data: { userId, type: "EXPENSE", amount: delivery, operationDate: dateFromInput(input.operationDate), module: FinanceModule.GOODS, categoryId: deliveryCategory.id, description: `Доставка: ${product.name}`, source: "WEB" } });
      await db.goodsOperationalExpense.create({ data: { userId, transactionId: deliveryTransaction.id, purchaseId: purchase.id } });
    }
    return { purchase, lot };
  });
}

async function allocateInventory(db: Prisma.TransactionClient, userId: string, productId: string, quantity: number, movementId: string, operationDate: Date, saleId?: string) {
  const lots = await db.productInventoryLot.findMany({ where: { userId, productId, deletedAt: null, receivedDate: { lte: operationDate }, availableQuantity: { gt: 0 } }, orderBy: [{ receivedDate: "asc" }, { createdAt: "asc" }] });
  const allocations = fifoAllocate(lots.map((lot) => ({ id: lot.id, availableQuantity: lot.availableQuantity, unitCost: lot.unitCost.toString() })), quantity);
  for (const allocation of allocations) {
    await db.productInventoryLot.update({ where: { id: allocation.lotId }, data: { availableQuantity: { decrement: allocation.quantity } } });
    await db.productInventoryAllocation.create({ data: { lotId: allocation.lotId, movementId, saleId, quantity: allocation.quantity, unitCost: decimal(allocation.unitCost), totalCost: decimal(allocation.totalCost) } });
  }
  return allocations;
}

export async function createProductSale(userId: string, input: z.infer<typeof saleSchema>) {
  const product = await prisma.product.findFirst({ where: { id: input.productId, userId, deletedAt: null, status: "ACTIVE" } });
  if (!product || product.currentQuantity < input.quantity) throw new Error("Недостаточно товара на складе.");
  const total = input.totalAmount ? decimal(input.totalAmount) : decimal(input.unitSalePrice).mul(input.quantity);
  const category = await goodsCategory(userId, "Продажа товара", "INCOME");
  return prisma.$transaction(async (db) => {
    const income = await db.transaction.create({ data: { userId, type: "INCOME", amount: total, operationDate: dateFromInput(input.operationDate), module: FinanceModule.GOODS, categoryId: category.id, description: `Продажа: ${product.name}`, source: "WEB" } });
    const sale = await db.productSale.create({ data: { userId, productId: product.id, quantity: input.quantity, unitSalePrice: decimal(input.unitSalePrice), totalAmount: total, costOfGoods: new Prisma.Decimal(0), profitAmount: new Prisma.Decimal(0), buyer: input.buyer, operationDate: dateFromInput(input.operationDate), comment: input.comment, incomeTransactionId: income.id } });
    const movement = await db.productInventoryMovement.create({ data: { userId, productId: product.id, type: "SALE", quantity: -input.quantity, operationDate: dateFromInput(input.operationDate), comment: input.comment, saleId: sale.id } });
    const allocations = await allocateInventory(db, userId, product.id, input.quantity, movement.id, dateFromInput(input.operationDate), sale.id);
    const cost = decimal(allocationCost(allocations));
    await db.productSale.update({ where: { id: sale.id }, data: { costOfGoods: cost, profitAmount: decimal(tradeProfit(total.toString(), cost.toString())) } });
    await db.product.update({ where: { id: product.id }, data: { currentQuantity: { decrement: input.quantity } } });
    return sale;
  });
}

export async function createInventoryChange(userId: string, input: z.infer<typeof inventoryChangeSchema>) {
  if (input.type === "WRITE_OFF" && input.quantity > 0) throw new Error("Списание должно уменьшать остаток.");
  const product = await prisma.product.findFirst({ where: { id: input.productId, userId, deletedAt: null } });
  if (!product || product.currentQuantity + input.quantity < 0) throw new Error("Недостаточно товара на складе.");
  return prisma.$transaction(async (db) => {
    const movement = await db.productInventoryMovement.create({ data: { userId, productId: product.id, type: input.type as ProductInventoryMovementType, quantity: input.quantity, operationDate: dateFromInput(input.operationDate), comment: input.comment } });
    if (input.quantity < 0) await allocateInventory(db, userId, product.id, -input.quantity, movement.id, dateFromInput(input.operationDate));
    if (input.quantity > 0) await db.productInventoryLot.create({ data: { userId, productId: product.id, adjustmentMovementId: movement.id, initialQuantity: input.quantity, availableQuantity: input.quantity, unitCost: new Prisma.Decimal(0), receivedDate: dateFromInput(input.operationDate), comment: input.comment } });
    await db.product.update({ where: { id: product.id }, data: { currentQuantity: { increment: input.quantity } } });
    return movement;
  });
}

export async function createGoodsOperationalExpense(userId: string, input: z.infer<typeof goodsExpenseSchema>) {
  const category = await prisma.category.findFirst({ where: { id: input.categoryId, module: FinanceModule.GOODS, isArchived: false, OR: [{ userId }, { userId: null }] } });
  if (!category || (category.kind !== "EXPENSE" && category.kind !== "BOTH")) throw new Error("Категория недоступна.");
  return prisma.$transaction(async (db) => { const transaction = await db.transaction.create({ data: { userId, type: "EXPENSE", amount: decimal(input.amount), operationDate: dateFromInput(input.operationDate), module: FinanceModule.GOODS, categoryId: category.id, description: input.description, source: "WEB" } }); return db.goodsOperationalExpense.create({ data: { userId, transactionId: transaction.id } }); });
}

export async function updateProductSale(userId: string, id: string, input: z.infer<typeof saleSchema>) {
  const category = await goodsCategory(userId, "Продажа товара", "INCOME");
  return prisma.$transaction(async (db) => {
    const sale = await db.productSale.findFirst({ where: { id, userId, deletedAt: null }, include: { inventoryMovement: { include: { allocations: { where: { deletedAt: null } } } } } });
    if (!sale?.inventoryMovement) throw new Error("Продажа не найдена.");

    for (const allocation of sale.inventoryMovement.allocations) {
      await db.productInventoryLot.update({ where: { id: allocation.lotId }, data: { availableQuantity: { increment: allocation.quantity } } });
    }
    await db.productInventoryAllocation.updateMany({ where: { movementId: sale.inventoryMovement.id, deletedAt: null }, data: { deletedAt: new Date() } });
    await db.product.update({ where: { id: sale.productId }, data: { currentQuantity: { increment: sale.quantity } } });

    const product = await db.product.findFirst({ where: { id: input.productId, userId, deletedAt: null, status: "ACTIVE" } });
    if (!product || product.currentQuantity < input.quantity) throw new Error("Недостаточно товара на складе.");
    const operationDate = dateFromInput(input.operationDate);
    const total = input.totalAmount ? decimal(input.totalAmount) : decimal(input.unitSalePrice).mul(input.quantity);

    await db.transaction.update({ where: { id: sale.incomeTransactionId }, data: { amount: total, operationDate, categoryId: category.id, description: `Продажа: ${product.name}` } });
    await db.productSale.update({ where: { id: sale.id }, data: { productId: product.id, quantity: input.quantity, unitSalePrice: decimal(input.unitSalePrice), totalAmount: total, buyer: input.buyer, operationDate, comment: input.comment } });
    await db.productInventoryMovement.update({ where: { id: sale.inventoryMovement.id }, data: { productId: product.id, quantity: -input.quantity, operationDate, comment: input.comment } });
    const allocations = await allocateInventory(db, userId, product.id, input.quantity, sale.inventoryMovement.id, operationDate, sale.id);
    const cost = decimal(allocationCost(allocations));
    await db.productSale.update({ where: { id: sale.id }, data: { costOfGoods: cost, profitAmount: decimal(tradeProfit(total.toString(), cost.toString())) } });
    await db.product.update({ where: { id: product.id }, data: { currentQuantity: { decrement: input.quantity } } });
    return sale.id;
  });
}

export async function deleteProductSale(userId: string, id: string) {
  return prisma.$transaction(async (db) => {
    const sale = await db.productSale.findFirst({ where: { id, userId, deletedAt: null }, include: { inventoryMovement: { include: { allocations: true } } } });
    if (!sale || !sale.inventoryMovement) throw new Error("Продажа не найдена.");
    for (const allocation of sale.inventoryMovement.allocations.filter((item) => !item.deletedAt)) await db.productInventoryLot.update({ where: { id: allocation.lotId }, data: { availableQuantity: { increment: allocation.quantity } } });
    await db.productInventoryAllocation.updateMany({ where: { movementId: sale.inventoryMovement.id, deletedAt: null }, data: { deletedAt: new Date() } });
    await db.productInventoryMovement.update({ where: { id: sale.inventoryMovement.id }, data: { deletedAt: new Date() } });
    await db.transaction.update({ where: { id: sale.incomeTransactionId }, data: { deletedAt: new Date() } });
    await db.product.update({ where: { id: sale.productId }, data: { currentQuantity: { increment: sale.quantity } } });
    return db.productSale.update({ where: { id }, data: { deletedAt: new Date() } });
  });
}

export async function updateProductPurchase(userId: string, id: string, input: z.infer<typeof purchaseSchema>) {
  const category = await goodsCategory(userId, "Закупка товара", "EXPENSE");
  return prisma.$transaction(async (db) => {
    const purchase = await db.productPurchase.findFirst({ where: { id, userId, deletedAt: null }, include: { deliveryExpense: true, inventoryLot: { include: { allocations: { where: { deletedAt: null } } } } } });
    if (!purchase?.inventoryLot) throw new Error("Закупка не найдена.");
    if (purchase.inventoryLot.availableQuantity !== purchase.inventoryLot.initialQuantity || purchase.inventoryLot.allocations.length) {
      throw new Error("Закупку нельзя изменить: часть партии уже использована в продаже или списании.");
    }
    const product = await db.product.findFirst({ where: { id: input.productId, userId, deletedAt: null, status: "ACTIVE" } });
    if (!product) throw new Error("Товар не найден.");
    const purchaseValue = decimal(input.unitPurchasePrice).mul(input.quantity);
    const delivery = decimal(input.deliveryAmount ?? "0");
    const total = input.deliveryInCost ? purchaseValue.add(delivery) : purchaseValue;
    const operationDate = dateFromInput(input.operationDate);
    const unitCost = total.div(input.quantity);

    await db.transaction.update({ where: { id: purchase.expenseTransactionId }, data: { amount: total, operationDate, categoryId: category.id, description: `Закупка: ${product.name}` } });
    if (purchase.deliveryExpense && (input.deliveryInCost || delivery.eq(0))) {
      await db.transaction.update({ where: { id: purchase.deliveryExpense.transactionId }, data: { deletedAt: new Date() } });
    } else if (purchase.deliveryExpense) {
      await db.transaction.update({ where: { id: purchase.deliveryExpense.transactionId }, data: { amount: delivery, operationDate, deletedAt: null, description: `Доставка: ${product.name}` } });
    } else if (!input.deliveryInCost && delivery.gt(0)) {
      const deliveryCategory = await db.category.findFirst({ where: { module: FinanceModule.GOODS, name: "Доставка", isArchived: false, OR: [{ userId }, { userId: null }] } });
      if (!deliveryCategory) throw new Error("Системная категория доставки не найдена.");
      const transaction = await db.transaction.create({ data: { userId, type: "EXPENSE", amount: delivery, operationDate, module: FinanceModule.GOODS, categoryId: deliveryCategory.id, description: `Доставка: ${product.name}`, source: "WEB" } });
      await db.goodsOperationalExpense.create({ data: { userId, transactionId: transaction.id, purchaseId: purchase.id } });
    }
    await db.product.update({ where: { id: purchase.productId }, data: { currentQuantity: { decrement: purchase.quantity } } });
    await db.product.update({ where: { id: product.id }, data: { currentQuantity: { increment: input.quantity } } });
    await db.productInventoryLot.update({ where: { id: purchase.inventoryLot.id }, data: { productId: product.id, initialQuantity: input.quantity, availableQuantity: input.quantity, unitCost, receivedDate: operationDate, comment: input.comment } });
    await db.productInventoryMovement.update({ where: { purchaseId: purchase.id }, data: { productId: product.id, quantity: input.quantity, operationDate, comment: input.comment } });
    return db.productPurchase.update({ where: { id: purchase.id }, data: { productId: product.id, quantity: input.quantity, unitPurchasePrice: decimal(input.unitPurchasePrice), deliveryAmount: delivery, deliveryInCost: input.deliveryInCost, totalAmount: total, supplier: input.supplier, operationDate, comment: input.comment } });
  });
}

export async function deleteProductPurchase(userId: string, id: string) {
  return prisma.$transaction(async (db) => {
    const purchase = await db.productPurchase.findFirst({ where: { id, userId, deletedAt: null }, include: { deliveryExpense: true, inventoryLot: { include: { allocations: { where: { deletedAt: null } } } } } });
    if (!purchase?.inventoryLot) throw new Error("Закупка не найдена.");
    if (purchase.inventoryLot.availableQuantity !== purchase.inventoryLot.initialQuantity || purchase.inventoryLot.allocations.length) {
      throw new Error("Эту закупку нельзя удалить: часть партии уже использована в продаже или списании.");
    }
    const deletedAt = new Date();
    await db.productInventoryMovement.updateMany({ where: { purchaseId: purchase.id, deletedAt: null }, data: { deletedAt } });
    await db.productInventoryLot.update({ where: { id: purchase.inventoryLot.id }, data: { deletedAt } });
    await db.transaction.update({ where: { id: purchase.expenseTransactionId }, data: { deletedAt } });
    if (purchase.deliveryExpense) {
      await db.transaction.update({ where: { id: purchase.deliveryExpense.transactionId }, data: { deletedAt } });
    }
    await db.product.update({ where: { id: purchase.productId }, data: { currentQuantity: { decrement: purchase.quantity } } });
    return db.productPurchase.update({ where: { id: purchase.id }, data: { deletedAt } });
  });
}

export async function getGoodsDashboard(userId: string, period: "TODAY" | "WEEK" | "MONTH" | "YEAR" = "MONTH") {
  const from = periodStart(period, dateFromInput(todayInputValue()));
  const [products, purchases, sales, transactions, movements] = await Promise.all([
    prisma.product.findMany({ where: { userId, deletedAt: null }, include: { category: true, inventoryLots: { where: { deletedAt: null } } }, orderBy: { name: "asc" } }),
    prisma.productPurchase.findMany({ where: { userId, deletedAt: null }, include: { product: true, inventoryLot: true }, orderBy: { operationDate: "desc" } }),
    prisma.productSale.findMany({ where: { userId, deletedAt: null }, include: { product: { include: { category: true } } }, orderBy: { operationDate: "desc" } }),
    prisma.transaction.findMany({ where: { userId, module: FinanceModule.GOODS, deletedAt: null, operationDate: { gte: from } }, include: { category: true } }),
    prisma.productInventoryMovement.findMany({ where: { userId, type: "WRITE_OFF", deletedAt: null, operationDate: { gte: from } }, include: { allocations: { where: { deletedAt: null } } } }),
  ]);
  const income = transactions.filter((item) => item.type === "INCOME").reduce((sum, item) => sum.add(item.amount), new Prisma.Decimal(0));
  const expense = transactions.filter((item) => item.type === "EXPENSE").reduce((sum, item) => sum.add(item.amount), new Prisma.Decimal(0));
  const activeSales = sales.filter((sale) => sale.operationDate >= from);
  const costOfGoods = activeSales.reduce((sum, sale) => sum.add(sale.costOfGoods), new Prisma.Decimal(0));
  const profit = activeSales.reduce((sum, sale) => sum.add(sale.profitAmount), new Prisma.Decimal(0));
  const writeOffCost = movements.reduce((sum, movement) => sum.add(movement.allocations.reduce((cost, allocation) => cost.add(allocation.totalCost), new Prisma.Decimal(0))), new Prisma.Decimal(0));
  return { products, purchases, sales, report: { income: income.toString(), expense: expense.toString(), cashResult: income.sub(expense).toString(), costOfGoods: costOfGoods.toString(), profit: profit.toString(), writeOffCost: writeOffCost.toString() } };
}

export async function getGoodsProductReport(userId: string, period: "TODAY" | "WEEK" | "MONTH" | "YEAR", filters: { productId?: string; categoryId?: string } = {}) {
  const from = periodStart(period, dateFromInput(todayInputValue()));
  const sales = await prisma.productSale.findMany({
    where: { userId, deletedAt: null, operationDate: { gte: from }, ...(filters.productId ? { productId: filters.productId } : {}), ...(filters.categoryId ? { product: { categoryId: filters.categoryId } } : {}) },
    include: { product: { include: { category: true } } },
    orderBy: { operationDate: "desc" },
  });
  const rows = new Map<string, { productId: string; product: string; category: string; quantity: number; revenue: Prisma.Decimal; cost: Prisma.Decimal; profit: Prisma.Decimal }>();
  for (const sale of sales) {
    const row = rows.get(sale.productId) ?? { productId: sale.productId, product: sale.product.name, category: sale.product.category?.name ?? "Без категории", quantity: 0, revenue: new Prisma.Decimal(0), cost: new Prisma.Decimal(0), profit: new Prisma.Decimal(0) };
    row.quantity += sale.quantity;
    row.revenue = row.revenue.add(sale.totalAmount);
    row.cost = row.cost.add(sale.costOfGoods);
    row.profit = row.profit.add(sale.profitAmount);
    rows.set(sale.productId, row);
  }
  return Array.from(rows.values()).map((row) => ({ ...row, revenue: row.revenue.toString(), cost: row.cost.toString(), profit: row.profit.toString() }));
}
