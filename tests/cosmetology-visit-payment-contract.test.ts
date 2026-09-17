import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const server = readFileSync(new URL("../src/server/cosmetology.ts", import.meta.url), "utf8");
const form = readFileSync(new URL("../src/components/cosmetology-visit-payment-form.tsx", import.meta.url), "utf8");
const components = readFileSync(new URL("../src/components/cosmetology-payment-components-fields.tsx", import.meta.url), "utf8");
const page = readFileSync(new URL("../src/app/(private)/cosmetology/visits/[id]/page.tsx", import.meta.url), "utf8");

describe("cosmetology visit payment UI contract", () => {
  it("offers cash and both cards under one Pay action", () => {
    expect(form).toContain("Оплатить");
    expect(components).toContain('name="cashAmount"');
    expect(components).toContain('name="monoAmount"');
    expect(components).toContain('name="privatAmount"');
    expect(components).toContain('name="otherAmount"');
    expect(form).toContain("CosmetologyPaymentComponentsFields");
  });

  it("shows actual paid and remaining amounts", () => {
    expect(page).toContain("Оплачено");
    expect(page).toContain("Осталось");
    expect(page).toContain("CosmetologyVisitPaymentForm");
  });

  it("uses an atomic paidAmount claim and debt-payment ledger entries", () => {
    expect(server).toContain("CosmetologyWalletMovementType.DEBT_PAYMENT");
    expect(server).toMatch(/updateMany\(\{ where: \{ id: visit\.id[\s\S]*paidAmount: visit\.paidAmount/);
    expect(server).toContain("payment.gt(remaining)");
    expect(server).toContain("paidAmount.eq(visit.paymentAmount)");
  });
});
