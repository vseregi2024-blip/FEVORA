import { describe, expect, it } from "vitest";

import { allocateLoyaltyServiceAmounts, assessLoyaltyPayment, buildLoyaltyPaymentPayload, loyaltyExternalEventId, type LoyaltyPaymentCandidate } from "../src/features/loyalty/payment";

const candidate = (overrides: Partial<LoyaltyPaymentCandidate> = {}): LoyaltyPaymentCandidate => ({
  id: "visit-123",
  status: "COMPLETED",
  deletedAt: null,
  paymentAmount: "5000.00",
  paidAmount: "5000.00",
  monetaryPaidAmount: "5000.00",
  operationDate: new Date("2026-09-11T00:00:00.000Z"),
  procedureName: "Botox + Biorevitalization",
  loyaltyClientId: "42",
  currency: "UAH",
  services: [{ name: "Botox", price: "2000.00" }, { name: "Biorevitalization", price: "3000.00" }],
  ...overrides,
});

describe("F3 loyalty payment rules", () => {
  it("prepares only a completed and fully paid visit", () => {
    expect(assessLoyaltyPayment(candidate())).toBe("READY");
    expect(assessLoyaltyPayment(candidate({ status: "SCHEDULED" }))).toBe("NOT_COMPLETED");
    expect(assessLoyaltyPayment(candidate({ paidAmount: "0.00" }))).toBe("NOT_FULLY_PAID");
    expect(assessLoyaltyPayment(candidate({ paidAmount: "1000.00" }))).toBe("NOT_FULLY_PAID");
  });

  it("does not prepare a payment without loyaltyClientId", () => {
    expect(assessLoyaltyPayment(candidate({ loyaltyClientId: null }))).toBe("NO_LOYALTY_CLIENT");
  });

  it("uses one stable event ID for every retry", () => {
    expect(loyaltyExternalEventId("abc")).toBe("fevora:appointment:abc:final");
    expect(buildLoyaltyPaymentPayload(candidate()).external_event_id).toBe(buildLoyaltyPaymentPayload(candidate()).external_event_id);
  });

  it("uses the actually paid discounted amount", () => {
    const payload = buildLoyaltyPaymentPayload(candidate({ paymentAmount: "4500.00", paidAmount: "4500.00", monetaryPaidAmount: "4500.00" }));
    expect(payload.amount).toBe(4500);
    expect(payload.services.reduce((sum, service) => sum + service.amount, 0)).toBe(4500);
    expect(payload.services).toEqual([{ name: "Botox", amount: 1800 }, { name: "Biorevitalization", amount: 2700 }]);
  });

  it("keeps multiple services inside one payment event", () => {
    const payload = buildLoyaltyPaymentPayload(candidate());
    expect(payload.external_source).toBe("FEVORA");
    expect(payload.services).toHaveLength(2);
    expect(payload.amount).toBe(5000);
  });

  it("allocates rounding deterministically and preserves the exact total", () => {
    const services = allocateLoyaltyServiceAmounts([{ name: "A", price: "1.00" }, { name: "B", price: "1.00" }, { name: "C", price: "1.00" }], "1.00", "Fallback");
    expect(services).toEqual([{ name: "A", amount: 0.33 }, { name: "B", amount: 0.33 }, { name: "C", amount: 0.34 }]);
  });

  it("does not put cost or profit into the API payload", () => {
    const payload = buildLoyaltyPaymentPayload(candidate());
    expect(payload).not.toHaveProperty("cost");
    expect(payload).not.toHaveProperty("profit");
    expect(payload).not.toHaveProperty("bonus_percent");
  });
});
