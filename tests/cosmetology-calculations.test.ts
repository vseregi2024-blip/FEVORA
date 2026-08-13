import { describe, expect, it } from "vitest";

import { allocateLots, periodResult, procedureProfit, unitCost } from "../src/features/cosmetology/calculations";

describe("cosmetology calculations", () => {
  it("calculates unit cost for a botox vial", () => expect(unitCost(5000, 100)).toBe(50));
  it("calculates unit cost for millilitres", () => expect(unitCost(2400, 2)).toBe(1200));
  it("accepts free inventory adjustments", () => expect(unitCost(0, 3)).toBe(0));
  it("rejects zero purchase quantity", () => expect(() => unitCost(10, 0)).toThrow());
  it("rejects negative purchase amount", () => expect(() => unitCost(-1, 1)).toThrow());
  it("uses one available lot", () => expect(allocateLots([{ availableQuantity: 100, unitCost: 50 }], 35)).toEqual({ allocations: [{ lotIndex: 0, quantity: 35, cost: 1750 }], cost: 1750 }));
  it("uses partial lots in FIFO order", () => expect(allocateLots([{ availableQuantity: 20, unitCost: 40 }, { availableQuantity: 80, unitCost: 50 }], 35)).toEqual({ allocations: [{ lotIndex: 0, quantity: 20, cost: 800 }, { lotIndex: 1, quantity: 15, cost: 750 }], cost: 1550 }));
  it("skips empty lots", () => expect(allocateLots([{ availableQuantity: 0, unitCost: 10 }, { availableQuantity: 2, unitCost: 20 }], 2).cost).toBe(40));
  it("keeps fractional material quantity", () => expect(allocateLots([{ availableQuantity: 2, unitCost: 1200 }], 0.5).cost).toBe(600));
  it("rejects unavailable stock", () => expect(() => allocateLots([{ availableQuantity: 2, unitCost: 10 }], 3)).toThrow("Недостаточно"));
  it("rejects zero usage", () => expect(() => allocateLots([], 0)).toThrow());
  it("does not double-count purchase cash as procedure cost", () => expect(procedureProfit(5200, 1750)).toBe(3450));
  it("allows a zero-price consultation", () => expect(procedureProfit(0, 0)).toBe(0));
  it("calculates negative procedure profit", () => expect(procedureProfit(1000, 1200)).toBe(-200));
  it("subtracts operational expense once from period result", () => expect(periodResult(10000, 3000, 1500)).toBe(5500));
  it("does not treat a cash purchase as a second operating expense", () => expect(periodResult(5200, 1750, 0)).toBe(3450));
  it("handles zero activity", () => expect(periodResult(0, 0, 0)).toBe(0));
  it("rounds decimal material costs to cents", () => expect(allocateLots([{ availableQuantity: 3, unitCost: 333.3333 }], 1).cost).toBe(333.33));
});
