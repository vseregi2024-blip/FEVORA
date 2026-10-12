import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const cabinet = readFileSync(new URL("../src/components/cosmetology-cabinet.tsx", import.meta.url), "utf8");
const cabinetPage = readFileSync(new URL("../src/app/(private)/cosmetology/page.tsx", import.meta.url), "utf8");
const completionForm = readFileSync(new URL("../src/components/complete-cosmetology-visit-form.tsx", import.meta.url), "utf8");
const visitPage = readFileSync(new URL("../src/app/(private)/cosmetology/visits/[id]/page.tsx", import.meta.url), "utf8");
const inventoryPage = readFileSync(new URL("../src/app/(private)/cosmetology/inventory/page.tsx", import.meta.url), "utf8");
const purchaseForm = readFileSync(new URL("../src/components/cosmetology-purchase-form.tsx", import.meta.url), "utf8");

describe("cosmetology UI uses the accepted shared money presentation", () => {
  it("shows the real daily procurement reservation and derived free amount in the cabinet", () => {
    expect(cabinet).toContain("todayProcurement");
    expect(cabinet).toContain("todayFree");
    expect(cabinet).not.toContain("На закупку <strong>—</strong>");
    expect(cabinetPage).toContain("prisma.moneyLedgerEntry.aggregate");
    expect(cabinetPage).toContain("todayIncome.sub(todayProcurement)");
  });

  it("passes active shared wallets into procedure completion and calculates free money in the form", () => {
    expect(completionForm).toContain("wallets = []");
    expect(completionForm).toContain("Свободно:");
    expect(completionForm).toContain("procurementExceedsPayment");
    expect(visitPage).toContain("wallets={money.wallets.map");
    expect(completionForm).toContain('name="procurementEnvelopeId"');
    expect(visitPage).toContain("procurementEnvelopes={money.procurementEnvelopes.map");
    expect(visitPage).toContain("defaultProcurementEnvelopeId={money.procurementEnvelope?.id");
  });

  it("keeps the procurement-envelope fallback only for a missing envelope and exposes item history", () => {
    expect(purchaseForm).toContain("envelopeId && envelopeName ? <option");
    expect(inventoryPage).toContain("История закупок и цен");
  });

  it("uses the current Imperia analytics route instead of the legacy finance route", () => {
    expect(cabinet).not.toContain("/finance?module=COSMETOLOGY");
    expect(cabinet).toContain("/analytics?module=COSMETOLOGY");
  });

  it("uses the same appointment and transaction event types as the full calendar", () => {
    expect(cabinetPage).toContain("getCalendarTransactions");
    expect(cabinet).toContain("financialEvents");
    expect(cabinet).toContain('addEventType(appointment.date, "APPOINTMENT")');
    expect(cabinet).toContain("cosmetology-cabinet-event-dots");
  });
});
