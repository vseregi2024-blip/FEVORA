import { describe, expect, it } from "vitest";

import { allocationCost, fifoAllocate, tradeProfit } from "../src/features/goods/calculations";

describe("Goods FIFO calculations", () => {
  const lots = [
    { id: "first", availableQuantity: 10, unitCost: "500.00" },
    { id: "second", availableQuantity: 10, unitCost: "550.00" },
  ];

  it("takes a sale from the earliest lot first", () => expect(fifoAllocate(lots, 6)).toEqual([{ lotId: "first", quantity: 6, unitCost: "500.00", totalCost: "3000.00" }]));
  it("spreads a sale over two lots", () => expect(fifoAllocate(lots, 12)).toEqual([{ lotId: "first", quantity: 10, unitCost: "500.00", totalCost: "5000.00" }, { lotId: "second", quantity: 2, unitCost: "550.00", totalCost: "1100.00" }]));
  it("calculates the required FIFO cost of 12 items", () => expect(allocationCost(fifoAllocate(lots, 12))).toBe("6100.00"));
  it("calculates gross trade profit", () => expect(tradeProfit("9000.00", "6100.00")).toBe("2900.00"));
  it("keeps kopecks exact", () => expect(allocationCost([{ totalCost: "0.10" }, { totalCost: "0.20" }])).toBe("0.30"));
  it("accepts a comma in a lot cost", () => expect(fifoAllocate([{ id: "one", availableQuantity: 2, unitCost: "25,50" }], 2)[0].totalCost).toBe("51.00"));
  it("does not allocate an empty lot", () => expect(fifoAllocate([{ id: "empty", availableQuantity: 0, unitCost: "10" }, { id: "stock", availableQuantity: 1, unitCost: "12" }], 1)[0].lotId).toBe("stock"));
  it("rejects a quantity of zero", () => expect(() => fifoAllocate(lots, 0)).toThrow("Количество должно быть больше нуля."));
  it("rejects a fractional quantity", () => expect(() => fifoAllocate(lots, 1.5)).toThrow("Количество должно быть больше нуля."));
  it("rejects a sale that exceeds stock", () => expect(() => fifoAllocate(lots, 21)).toThrow("Недостаточно товара на складе."));
  it("allows a sale equal to all stock", () => expect(allocationCost(fifoAllocate(lots, 20))).toBe("10500.00"));
  it("handles a negative profit", () => expect(tradeProfit("100.00", "120.00")).toBe("-20.00"));
});
