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

export function remainingBags(availableBags: number, usedBags: number) {
  const result = availableBags - usedBags;
  if (result < 0) throw new Error("На складі недостатньо мішків.");
  return result;
}

export function saleTotal(quantity?: number | null, weightKg?: string | null, price?: string | null, explicitTotal?: string | null) {
  if (explicitTotal) return explicitTotal;
  if (!price || (!quantity && !weightKg)) throw new Error("Вкажіть ціну та кількість або вагу.");
  const multiplier = weightKg ?? String(quantity);
  return (Number(multiplier) * Number(price)).toFixed(2);
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
