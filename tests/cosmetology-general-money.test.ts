import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const schema = readFileSync(new URL("../prisma/schema.prisma", import.meta.url), "utf8");
const server = readFileSync(new URL("../src/server/cosmetology.ts", import.meta.url), "utf8");
const purchasePage = readFileSync(new URL("../src/components/cosmetology-purchase-form.tsx", import.meta.url), "utf8");

describe("cosmetology uses the shared money core", () => {
  it("links transactions to physical wallets and ledger entries", () => {
    expect(schema).toContain("moneyAccountId");
    expect(schema).toContain("MoneyLedgerEntryTransaction");
    expect(server).toContain("recordGeneralWalletPayment");
    expect(server).toContain("MoneyLedgerEntryType.INCOME");
    expect(server).toContain("MoneyLedgerEntryType.EXPENSE");
  });

  it("reserves procedure income without an expense and purchases consume one transaction", () => {
    expect(server).toContain("procurementAmount");
    expect(server).toContain("procurementEnvelopeId");
    expect(server).toContain("Выберите активный конверт для резерва на препараты.");
    expect(server).not.toContain('project: { code: FinanceModule.COSMETOLOGY }, name: { contains: "закуп"');
    expect(server).toContain("await db.cosmetologyExpense.create");
    expect(server).not.toContain("await createVisitUsages(");
    expect(server).toContain("В конверте резерва недостаточно средств.");
  });

  it("uses general wallets and the shared procurement envelope in the purchase UI", () => {
    expect(purchasePage).toContain("Кошелёк оплаты");
    expect(purchasePage).toContain("procurementEnvelopeId");
    expect(purchasePage).not.toContain('name="wallet"');
  });
});
