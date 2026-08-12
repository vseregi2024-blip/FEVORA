import { describe, expect, it } from "vitest";

import { calculateFamilyTotals, nextRecurringDate, periodStart, sumSplitReceipt } from "../src/features/family/calculations";
import { minorUnitsToMoney } from "../src/lib/money";

const date = new Date("2026-08-12T12:00:00.000Z");

describe("Family finance calculations", () => {
  it("counts a Family income without mixing it with savings", () => {
    const totals = calculateFamilyTotals([
      { amount: "2500", categoryName: "Продаж особистих речей", operationDate: date, type: "INCOME" },
      { amount: "100000", categoryName: null, operationDate: date, type: "SAVING_IN" },
    ]);
    expect(minorUnitsToMoney(totals.income)).toBe("2500.00");
    expect(minorUnitsToMoney(totals.savings)).toBe("100000.00");
  });

  it("counts a Family expense and reports its category", () => {
    const totals = calculateFamilyTotals([{ amount: "850", categoryName: "Продукти", operationDate: date, type: "EXPENSE" }]);
    expect(minorUnitsToMoney(totals.expense)).toBe("850.00");
    expect(minorUnitsToMoney(totals.expensesByCategory.get("Продукти") ?? 0n)).toBe("850.00");
  });

  it("recalculates totals when an edited expense replaces its old amount", () => {
    const oldTotal = calculateFamilyTotals([{ amount: "9500", categoryName: "Дім", operationDate: date, type: "EXPENSE" }]);
    const editedTotal = calculateFamilyTotals([{ amount: "4000", categoryName: "Дім", operationDate: date, type: "EXPENSE" }]);
    expect(minorUnitsToMoney(oldTotal.balance)).toBe("-9500.00");
    expect(minorUnitsToMoney(editedTotal.balance)).toBe("-4000.00");
  });

  it("excludes a soft-deleted record from reports", () => {
    const totals = calculateFamilyTotals([{ amount: "850", categoryName: "Продукти", operationDate: date, type: "EXPENSE", deletedAt: new Date() }]);
    expect(minorUnitsToMoney(totals.expense)).toBe("0.00");
  });

  it("filters report periods from today through year", () => {
    expect(periodStart("TODAY", date).toISOString()).toBe("2026-08-12T12:00:00.000Z");
    expect(periodStart("WEEK", date).toISOString()).toBe("2026-08-06T12:00:00.000Z");
    expect(periodStart("MONTH", date).toISOString()).toBe("2026-08-01T12:00:00.000Z");
    expect(periodStart("YEAR", date).toISOString()).toBe("2026-01-01T12:00:00.000Z");
  });

  it("keeps split receipt total equal to its category lines", () => {
    expect(minorUnitsToMoney(sumSplitReceipt([{ amount: "650" }, { amount: "280" }, { amount: "300" }]))).toBe("1230.00");
  });

  it("does not double-count a split receipt when only its lines are reported", () => {
    const totals = calculateFamilyTotals([
      { amount: "650", categoryName: "Продукти", operationDate: date, type: "EXPENSE" },
      { amount: "280", categoryName: "Дім", operationDate: date, type: "EXPENSE" },
      { amount: "300", categoryName: "Подарунки", operationDate: date, type: "EXPENSE" },
    ]);
    expect(minorUnitsToMoney(totals.expense)).toBe("1230.00");
  });

  it("does not include a POULTRY business income in Family totals", () => {
    const familyOnlyRecords = [{ amount: "1500", categoryName: "Разовий дохід", operationDate: date, type: "INCOME" as const }];
    expect(minorUnitsToMoney(calculateFamilyTotals(familyOnlyRecords).income)).toBe("1500.00");
  });

  it("advances a recurring monthly payment by one month", () => {
    expect(nextRecurringDate(new Date("2026-08-15T12:00:00.000Z"), "MONTHLY").toISOString()).toBe("2026-09-15T12:00:00.000Z");
  });

  it("advances a recurring weekly payment by seven days", () => {
    expect(nextRecurringDate(date, "WEEKLY").toISOString()).toBe("2026-08-19T12:00:00.000Z");
  });
});
