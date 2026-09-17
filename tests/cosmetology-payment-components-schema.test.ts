import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { appointmentSchema, payVisitSchema, paymentComponents } from "../src/server/cosmetology";

const payment = (overrides: Record<string, unknown> = {}) => ({
  cashAmount: "0",
  monoAmount: "0",
  privatAmount: "0",
  otherAmount: "0",
  otherComment: null,
  certificateId: null,
  certificateAmount: "0",
  paymentTotal: "0",
  ...overrides,
});

describe("PAYMENT 2.0 component validation", () => {
  it("accepts each money method and preserves their total", () => {
    expect(paymentComponents(payment({ cashAmount: "100", paymentTotal: "100" })).map((item) => item.method)).toEqual(["CASH"]);
    expect(paymentComponents(payment({ monoAmount: "100", paymentTotal: "100" })).map((item) => item.method)).toEqual(["MONOBANK"]);
    expect(paymentComponents(payment({ privatAmount: "100", paymentTotal: "100" })).map((item) => item.method)).toEqual(["PRIVATBANK"]);
  });

  it("rejects a declared total that does not equal the components", () => {
    const parsed = payVisitSchema.safeParse({ id: "cmtwk2glz0005pl4xaht37vtp", operationDate: "2026-09-11", ...payment({ cashAmount: "100", paymentTotal: "99" }) });
    expect(parsed.success).toBe(false);
  });

  it("rejects a negative component before server writes", () => {
    const parsed = payVisitSchema.safeParse({ id: "cmtwk2glz0005pl4xaht37vtp", operationDate: "2026-09-11", ...payment({ cashAmount: "-1", paymentTotal: "-1" }) });
    expect(parsed.success).toBe(false);
  });

  it("requires a description for OTHER", () => {
    const parsed = payVisitSchema.safeParse({ id: "cmtwk2glz0005pl4xaht37vtp", operationDate: "2026-09-11", ...payment({ otherAmount: "250", paymentTotal: "250" }) });
    expect(parsed.success).toBe(false);
  });

  it("accepts a mixed payment and prepayment", () => {
    const mixed = payVisitSchema.safeParse({ id: "cmtwk2glz0005pl4xaht37vtp", operationDate: "2026-09-11", ...payment({ cashAmount: "2000", monoAmount: "1500", privatAmount: "1500", paymentTotal: "5000" }) });
    expect(mixed.success).toBe(true);
    const prepayment = appointmentSchema.safeParse({ clientId: "cmtvunb6v0001iipe7epcl07t", clientName: null, phone: null, contactValue: null, procedureTemplateId: null, procedureName: "Чистка", plannedAmount: "5000", operationDate: "2026-09-11", scheduledTime: null, durationMinutes: null, comment: null, ...payment({ cashAmount: "1000", paymentTotal: "1000" }) });
    expect(prepayment.success).toBe(true);
  });

  it("accepts CERTIFICATE as a component only when a certificate is selected", () => {
    const withoutCertificate = payVisitSchema.safeParse({ id: "cmtwk2glz0005pl4xaht37vtp", operationDate: "2026-09-11", ...payment({ certificateAmount: "2000", paymentTotal: "2000" }) });
    expect(withoutCertificate.success).toBe(false);
    const mixed = payVisitSchema.safeParse({ id: "cmtwk2glz0005pl4xaht37vtp", operationDate: "2026-09-11", ...payment({ cashAmount: "2000", certificateId: "cmtvunb6v0001iipe7epcl07t", certificateAmount: "3000", paymentTotal: "5000" }) });
    expect(mixed.success).toBe(true);
    expect(paymentComponents(mixed.data!).map((item) => item.method)).toEqual(["CASH", "CERTIFICATE"]);
    expect(paymentComponents(mixed.data!)[1]).toMatchObject({ certificateId: "cmtvunb6v0001iipe7epcl07t", wallet: null });
  });
});
