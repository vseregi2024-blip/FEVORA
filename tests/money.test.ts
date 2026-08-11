import { describe, expect, it } from "vitest";

import { calculateBalance, minorUnitsToMoney, moneyToMinorUnits } from "../src/lib/money";

const balance = (transactions: Parameters<typeof calculateBalance>[1]) => minorUnitsToMoney(calculateBalance("0", transactions));

describe("financial balance", () => {
  it("adds income", () => expect(balance([{ type: "INCOME", amount: "10000" }])).toBe("10000.00"));
  it("subtracts an expense", () => expect(balance([{ type: "INCOME", amount: "10000" }, { type: "EXPENSE", amount: "3500" }])).toBe("6500.00"));
  it("subtracts a movement into savings", () => expect(balance([{ type: "INCOME", amount: "10000" }, { type: "EXPENSE", amount: "3500" }, { type: "SAVING_IN", amount: "1000" }])).toBe("5500.00"));
  it("adds a return from savings", () => expect(balance([{ type: "INCOME", amount: "10000" }, { type: "EXPENSE", amount: "3500" }, { type: "SAVING_IN", amount: "1000" }, { type: "SAVING_OUT", amount: "500" }])).toBe("6000.00"));
  it("restores balance when a deleted expense is absent", () => expect(balance([{ type: "INCOME", amount: "10000" }])).toBe("10000.00"));
  it("changes totals when an operation amount is edited", () => {
    expect(balance([{ type: "INCOME", amount: "10000" }, { type: "EXPENSE", amount: "3500" }])).toBe("6500.00");
    expect(balance([{ type: "INCOME", amount: "10000" }, { type: "EXPENSE", amount: "4000" }])).toBe("6000.00");
  });
  it("uses exact minor units and supports negative adjustments", () => { expect(moneyToMinorUnits("0.10") + moneyToMinorUnits("0.20")).toBe(30n); expect(balance([{ type: "INCOME", amount: "1" }, { type: "ADJUSTMENT", amount: "-0.01" }])).toBe("0.99"); });
});
