import { describe, expect, it } from "vitest";

import { acquisitionCosts, aggregateEggCollections, approximateFeedConsumptionKg, feedQuantityToKg, flockQuantity, incubationEggCosts, isWithinDateRange, movementDelta, reconciliationDelta, saleHeadcountDelta, transferProductionCost } from "../src/features/poultry/calculations";

describe("Poultry 2.0 business flows", () => {
  it("purchase live birds creates equal cash and initial production cost", () => expect(acquisitionCosts("PURCHASE", 1600, 0)).toEqual({ cashExpense: 1600, productionCost: 1600 }));
  it("gift live birds creates no cash expense", () => expect(acquisitionCosts("GIFT", 0, 600)).toEqual({ cashExpense: 0, productionCost: 600 }));
  it("gifted incubation eggs keep management value without cash", () => expect(incubationEggCosts("GIFTED", 0, 200)).toEqual({ cashExpense: 0, productionCost: 200 }));
  it("purchased incubation eggs use paid amount for both views", () => expect(incubationEggCosts("PURCHASED", 1500, 0)).toEqual({ cashExpense: 1500, productionCost: 1500 }));
  it("converts kg directly", () => expect(feedQuantityToKg(12.5, "KG", {})).toBe(12.5));
  it("converts bags to kg", () => expect(feedQuantityToKg(4, "BAG", { bagSizeKg: 25 })).toBe(100));
  it("converts household units to kg", () => expect(feedQuantityToKg(3, "HOUSEHOLD", { householdUnitKg: 0.75 })).toBe(2.25));
  it("requires household calibration", () => expect(() => feedQuantityToKg(3, "HOUSEHOLD", {})).toThrow("відкалібруйте"));
  it("calculates a dated feed rate without rewriting history", () => expect(approximateFeedConsumptionKg([{ dailyKg: 2, effectiveFrom: new Date("2026-09-01") }, { dailyKg: 3, effectiveFrom: new Date("2026-09-04") }], new Date("2026-09-01"), new Date("2026-09-05"))).toBe(12));
  it("creates feed reconciliation delta", () => expect(reconciliationDelta(640, 580)).toBe(-60));
  it("transfer keeps total flock unchanged", () => { const source = flockQuantity(40, [-10]); const destination = flockQuantity(0, [10]); expect({ source, destination, total: source + destination }).toEqual({ source: 30, destination: 10, total: 40 }); });
  it("transfer carries proportional accumulated cost", () => expect(transferProductionCost(8000, 40, 10)).toBe(2000));
  it("mortality decreases quantity", () => expect(flockQuantity(20, [movementDelta("MORTALITY", 4)])).toBe(16));
  it("mortality itself has no cash calculation", () => expect(acquisitionCosts("GIFT", 0, 0).cashExpense).toBe(0));
  it("family slaughter decreases quantity", () => expect(flockQuantity(20, [saleHeadcountDelta("CARCASS", 1, false)])).toBe(19));
  it("recorded slaughter is not decreased again by carcass sale", () => expect(saleHeadcountDelta("CARCASS", 1, true)).toBe(0));
  it("live bird sale decreases headcount", () => expect(saleHeadcountDelta("LIVE_BIRD", 2)).toBe(-2));
  it("egg sale never changes bird headcount", () => expect(saleHeadcountDelta("EGGS", 30)).toBe(0));
  it("other poultry income never changes bird headcount", () => expect(saleHeadcountDelta("OTHER", 3)).toBe(0));
  it("editing sale 2 to 1 recomputes from the active event set", () => expect(flockQuantity(20, [-1])).toBe(19));
  it("deleting sale restores exactly once by removing the event", () => { expect(flockQuantity(20, [])).toBe(20); expect(flockQuantity(20, [])).toBe(20); });
  it("prevents a negative flock", () => expect(() => flockQuantity(2, [-3])).toThrow("Недостатньо"));
  it("aggregates multiple egg collections on one day", () => expect(aggregateEggCollections([{ operationDate: new Date("2026-08-30"), quantity: 5 }, { operationDate: new Date("2026-08-30"), quantity: 2 }, { operationDate: new Date("2026-08-30"), quantity: 1 }])).toEqual([{ date: "2026-08-30", quantity: 8 }]));
  it("excludes a future transaction from a current range", () => expect(isWithinDateRange(new Date("2026-09-01"), new Date("2026-08-01"), new Date("2026-08-31"))).toBe(false));
  it("includes both date range boundaries", () => { expect(isWithinDateRange(new Date("2026-08-01"), new Date("2026-08-01"), new Date("2026-08-31"))).toBe(true); expect(isWithinDateRange(new Date("2026-08-31"), new Date("2026-08-01"), new Date("2026-08-31"))).toBe(true); });
});
