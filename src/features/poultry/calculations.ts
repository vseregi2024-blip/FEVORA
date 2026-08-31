import { moneyToMinorUnits, minorUnitsToMoney } from "../../lib/money";

export function poultryAgeDays(startDate: Date, today: Date) {
  return Math.max(0, Math.floor((Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) - Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate())) / 86_400_000));
}

export function hatchRate(setQuantity: number, hatchedQuantity: number) {
  return setQuantity === 0 ? 0 : Math.round((hatchedQuantity / setQuantity) * 10_000) / 100;
}

export function remainingQuantity(currentQuantity: number, movement: "ADD" | "SALE" | "MORTALITY" | "FAMILY_USE" | "TRANSFER" | "ADJUSTMENT", quantity: number) {
  const result = movement === "ADD" || movement === "ADJUSTMENT" ? currentQuantity + quantity : currentQuantity - quantity;
  if (result < 0) throw new Error("Недостатньо птиці в партії.");
  return result;
}

export function movementDelta(type: "ADD" | "SALE" | "MORTALITY" | "FAMILY_USE" | "TRANSFER" | "ADJUSTMENT", quantity: number, adjustmentDelta?: number) {
  if (type === "ADJUSTMENT") return adjustmentDelta ?? quantity;
  return type === "ADD" ? quantity : -quantity;
}

export function flockQuantity(startingQuantity: number, deltas: number[]) {
  const quantity = deltas.reduce((total, delta) => total + delta, startingQuantity);
  if (quantity < 0) throw new Error("Недостатньо птиці в групі.");
  return quantity;
}

export function remainingBags(availableBags: number, usedBags: number) {
  const result = availableBags - usedBags;
  if (result < 0) throw new Error("На складі недостатньо мішків.");
  return result;
}

export type FeedUnitValue = "KG" | "BAG" | "HOUSEHOLD";

export function feedQuantityToKg(quantity: number, unit: FeedUnitValue, options: { bagSizeKg?: number | null; householdUnitKg?: number | null }) {
  if (!Number.isFinite(quantity) || quantity <= 0) throw new Error("Кількість корму має бути більшою за нуль.");
  if (unit === "KG") return quantity;
  const coefficient = unit === "BAG" ? options.bagSizeKg : options.householdUnitKg;
  if (!coefficient || coefficient <= 0) throw new Error(unit === "BAG" ? "Вкажіть вагу мішка." : "Спочатку відкалібруйте побутову одиницю.");
  return Math.round(quantity * coefficient * 1000) / 1000;
}

export function transferProductionCost(accumulatedCost: number, liveQuantity: number, transferQuantity: number) {
  if (liveQuantity <= 0 || transferQuantity <= 0 || transferQuantity > liveQuantity) throw new Error("Перевірте кількість для переведення.");
  return Math.round((accumulatedCost / liveQuantity) * transferQuantity * 100) / 100;
}

export function approximateFeedConsumptionKg(rates: Array<{ dailyKg: number; effectiveFrom: Date }>, from: Date, to: Date) {
  const sorted = [...rates].sort((a, b) => a.effectiveFrom.getTime() - b.effectiveFrom.getTime());
  let total = 0;
  for (const [index, rate] of sorted.entries()) {
    const start = new Date(Math.max(rate.effectiveFrom.getTime(), from.getTime()));
    const next = sorted[index + 1]?.effectiveFrom;
    const end = new Date(Math.min(to.getTime(), next ? next.getTime() - 86_400_000 : to.getTime()));
    if (end < start) continue;
    const days = Math.floor((Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()) - Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())) / 86_400_000) + 1;
    total += days * rate.dailyKg;
  }
  return Math.round(total * 1000) / 1000;
}

export function reconciliationDelta(calculatedQuantity: number, actualQuantity: number) {
  return Math.round((actualQuantity - calculatedQuantity) * 1000) / 1000;
}

export function saleHeadcountDelta(type: "LIVE_BIRD" | "CARCASS" | "EGGS" | "OTHER", quantity: number | null | undefined, slaughterAlreadyRecorded = false) {
  if (!quantity || type === "EGGS" || type === "OTHER" || (type === "CARCASS" && slaughterAlreadyRecorded)) return 0;
  return -quantity;
}

export function aggregateEggCollections(items: Array<{ operationDate: Date; quantity: number }>) {
  const totals = new Map<string, number>();
  for (const item of items) {
    const key = item.operationDate.toISOString().slice(0, 10);
    totals.set(key, (totals.get(key) ?? 0) + item.quantity);
  }
  return [...totals.entries()].map(([date, quantity]) => ({ date, quantity }));
}

export function acquisitionCosts(source: "PURCHASE" | "GIFT" | "OTHER" | "INCUBATION", cashPaid: number, managementValue: number) {
  const cashExpense = source === "PURCHASE" ? cashPaid : 0;
  return { cashExpense, productionCost: source === "PURCHASE" ? cashPaid : managementValue };
}

export function incubationEggCosts(source: "OWN" | "PURCHASED" | "GIFTED", cashPaid: number, managementValue: number) {
  const cashExpense = source === "PURCHASED" ? cashPaid : 0;
  return { cashExpense, productionCost: source === "PURCHASED" ? cashPaid : managementValue };
}

export function isWithinDateRange(value: Date, from: Date, to: Date) {
  return value >= from && value <= to;
}

export function saleTotal(quantity?: number | null, weightKg?: string | null, price?: string | null, explicitTotal?: string | null) {
  if (explicitTotal) return explicitTotal;
  if (!price || (!quantity && !weightKg)) throw new Error("Вкажіть ціну та кількість або вагу.");
  const multiplier = weightKg ?? String(quantity);
  return (Number(multiplier.replace(",", ".")) * Number(price.replace(",", "."))).toFixed(2);
}

export function poultryReport(items: Array<{ type: "INCOME" | "EXPENSE"; amount: string; categoryName?: string | null }>) {
  let income = 0n;
  let expense = 0n;
  const expensesByCategory = new Map<string, bigint>();
  for (const item of items) {
    const amount = moneyToMinorUnits(item.amount);
    if (item.type === "INCOME") income += amount;
    else { expense += amount; expensesByCategory.set(item.categoryName ?? "Без категорії", (expensesByCategory.get(item.categoryName ?? "Без категорії") ?? 0n) + amount); }
  }
  return { income: minorUnitsToMoney(income), expense: minorUnitsToMoney(expense), result: minorUnitsToMoney(income - expense), expensesByCategory: [...expensesByCategory.entries()].map(([name, amount]) => ({ name, amount: minorUnitsToMoney(amount) })) };
}
