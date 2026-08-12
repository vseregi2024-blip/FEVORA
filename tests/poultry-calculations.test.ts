import { describe, expect, it } from "vitest";

import { hatchRate, poultryAgeDays, poultryReport, remainingBags, remainingQuantity, saleTotal } from "../src/features/poultry/calculations";

describe("Poultry calculations", () => {
  it("calculates a batch age from its start date", () => expect(poultryAgeDays(new Date("2026-08-01T12:00:00Z"), new Date("2026-08-12T12:00:00Z"))).toBe(11));
  it("does not return a negative age", () => expect(poultryAgeDays(new Date("2026-08-13T12:00:00Z"), new Date("2026-08-12T12:00:00Z"))).toBe(0));
  it("updates quantity for mortality and family use without income", () => { expect(remainingQuantity(40, "MORTALITY", 2)).toBe(38); expect(remainingQuantity(38, "FAMILY_USE", 3)).toBe(35); });
  it("updates quantity for a sale", () => expect(remainingQuantity(40, "SALE", 8)).toBe(32));
  it("rejects a sale beyond the current flock", () => expect(() => remainingQuantity(4, "SALE", 5)).toThrow("Недостатньо птиці"));
  it("calculates a weighted sale and respects a confirmed total", () => { expect(saleTotal(null, "2.6", "180", null)).toBe("468.00"); expect(saleTotal(30, null, "8", "250")).toBe("250"); });
  it("decreases feed stock and rejects overuse", () => { expect(remainingBags(5, 1)).toBe(4); expect(() => remainingBags(1, 2)).toThrow("недостатньо мішків"); });
  it("calculates hatch rate", () => expect(hatchRate(30, 26)).toBe(86.67));
  it("keeps exactly one income and expense in a poultry report", () => { const report = poultryReport([{ type: "EXPENSE", amount: "2500.00", categoryName: "Корма" }, { type: "INCOME", amount: "468.00", categoryName: "Продаж продукції" }]); expect(report).toMatchObject({ income: "468.00", expense: "2500.00", result: "-2032.00" }); expect(report.expensesByCategory).toEqual([{ name: "Корма", amount: "2500.00" }]); });
});
