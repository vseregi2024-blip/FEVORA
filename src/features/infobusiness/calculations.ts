import { minorUnitsToMoney, moneyToMinorUnits } from "../../lib/money";

export type InfoSaleValue = { productId: string; amount: string; seats: number; operationDate: string; deleted?: boolean };
export type InfoExpenseValue = { productId: string | null; categoryId: string; categoryName: string; serviceName?: string | null; amount: string; operationDate: string; deleted?: boolean };

const total = (values: Array<{ amount: string; deleted?: boolean }>) => minorUnitsToMoney(values.filter((value) => !value.deleted).reduce((sum, value) => sum + moneyToMinorUnits(value.amount), 0n));

export function infoProductResult(productId: string, sales: InfoSaleValue[], expenses: InfoExpenseValue[]) {
  const income = total(sales.filter((sale) => sale.productId === productId));
  const expense = total(expenses.filter((expense) => expense.productId === productId));
  return { sales: sales.filter((sale) => sale.productId === productId && !sale.deleted).reduce((sum, sale) => sum + sale.seats, 0), income, expense, profit: minorUnitsToMoney(moneyToMinorUnits(income) - moneyToMinorUnits(expense)) };
}

export function infoOverallResult(sales: InfoSaleValue[], expenses: InfoExpenseValue[]) {
  const income = total(sales); const expense = total(expenses);
  return { income, expense, profit: minorUnitsToMoney(moneyToMinorUnits(income) - moneyToMinorUnits(expense)) };
}

export function groupInfoExpenses(expenses: InfoExpenseValue[], key: "category" | "service") {
  const rows = new Map<string, bigint>();
  for (const expense of expenses.filter((item) => !item.deleted)) {
    const name = key === "category" ? expense.categoryName : expense.serviceName;
    if (!name) continue;
    rows.set(name, (rows.get(name) ?? 0n) + moneyToMinorUnits(expense.amount));
  }
  return Array.from(rows.entries()).map(([name, amount]) => ({ name, amount: minorUnitsToMoney(amount) }));
}

export function filterInfoOperations<T extends { operationDate: string; productId: string | null }>(operations: T[], filters: { from?: string; to?: string; productId?: string }) {
  return operations.filter((operation) => (!filters.from || operation.operationDate >= filters.from) && (!filters.to || operation.operationDate <= filters.to) && (!filters.productId || operation.productId === filters.productId));
}
