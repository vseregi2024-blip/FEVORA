export type FamilyRecord = {
  amount: string;
  categoryName: string | null;
  operationDate: Date;
  type: "INCOME" | "EXPENSE" | "SAVING_IN" | "SAVING_OUT";
  deletedAt?: Date | null;
};

export type FamilyTotals = {
  income: bigint;
  expense: bigint;
  savings: bigint;
  balance: bigint;
  expensesByCategory: Map<string, bigint>;
  incomeByCategory: Map<string, bigint>;
};

const amountToMinorUnits = (amount: string) => {
  const [whole, fraction = ""] = amount.split(".");
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
};

export function calculateFamilyTotals(records: FamilyRecord[]): FamilyTotals {
  const totals: FamilyTotals = { income: 0n, expense: 0n, savings: 0n, balance: 0n, expensesByCategory: new Map(), incomeByCategory: new Map() };

  for (const record of records) {
    if (record.deletedAt) continue;
    const amount = amountToMinorUnits(record.amount);
    const categoryName = record.categoryName ?? "Без категорії";

    if (record.type === "INCOME") {
      totals.income += amount;
      totals.balance += amount;
      totals.incomeByCategory.set(categoryName, (totals.incomeByCategory.get(categoryName) ?? 0n) + amount);
    }
    if (record.type === "EXPENSE") {
      totals.expense += amount;
      totals.balance -= amount;
      totals.expensesByCategory.set(categoryName, (totals.expensesByCategory.get(categoryName) ?? 0n) + amount);
    }
    if (record.type === "SAVING_IN") {
      totals.savings += amount;
      totals.balance -= amount;
    }
    if (record.type === "SAVING_OUT") {
      totals.savings -= amount;
      totals.balance += amount;
    }
  }

  return totals;
}

export function sumSplitReceipt(items: Array<{ amount: string }>): bigint {
  return items.reduce((total, item) => total + amountToMinorUnits(item.amount), 0n);
}

export function periodStart(period: "TODAY" | "WEEK" | "MONTH" | "YEAR", date: Date): Date {
  const result = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12));
  if (period === "WEEK") result.setUTCDate(result.getUTCDate() - 6);
  if (period === "MONTH") result.setUTCDate(1);
  if (period === "YEAR") result.setUTCMonth(0, 1);
  return result;
}

export function nextRecurringDate(date: Date, frequency: "MONTHLY" | "WEEKLY"): Date {
  const result = new Date(date);
  if (frequency === "WEEKLY") result.setUTCDate(result.getUTCDate() + 7);
  else result.setUTCMonth(result.getUTCMonth() + 1);
  return result;
}
