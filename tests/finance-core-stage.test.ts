import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { calculateMoneyAccountBalance, summarizeProjectMoney } from "../src/features/money/calculations";

const familyService = readFileSync(join(process.cwd(), "src/server/family.ts"), "utf8");
const moneyService = readFileSync(join(process.cwd(), "src/server/money.ts"), "utf8");

describe("financial-core controlled scenarios (isolated calculations)", () => {
  it("A — poultry income of 160 increases cash and capital once", () => {
    const cash = calculateMoneyAccountBalance({ openingBalance: "1000", entries: [{ amount: "160" }] });
    const mono = calculateMoneyAccountBalance({ openingBalance: "5000", entries: [] });
    const summary = summarizeProjectMoney([{ kind: "WALLET", openingBalance: "1000", entries: [{ amount: "160" }] }, { kind: "WALLET", openingBalance: "5000", entries: [] }]);
    expect(cash).toBe(116_000n); expect(mono).toBe(500_000n); expect(summary).toEqual({ total: 616_000n, allocated: 0n, free: 616_000n });
  });

  it("B — allocation of 160 is not income or expense and keeps capital at 6,160", () => {
    const summary = summarizeProjectMoney([{ kind: "WALLET", openingBalance: "1000", entries: [{ amount: "160" }] }, { kind: "WALLET", openingBalance: "5000", entries: [] }, { kind: "ENVELOPE", openingBalance: "0", entries: [{ amount: "160" }] }]);
    expect(summary).toEqual({ total: 616_000n, allocated: 16_000n, free: 600_000n });
  });

  it("C — a 500 wallet-to-wallet transfer preserves capital", () => {
    const cash = calculateMoneyAccountBalance({ openingBalance: "1000", entries: [{ amount: "160" }, { amount: "500" }] });
    const mono = calculateMoneyAccountBalance({ openingBalance: "5000", entries: [{ amount: "-500" }] });
    const summary = summarizeProjectMoney([{ kind: "WALLET", openingBalance: "1000", entries: [{ amount: "160" }, { amount: "500" }] }, { kind: "WALLET", openingBalance: "5000", entries: [{ amount: "-500" }] }]);
    expect(cash).toBe(166_000n); expect(mono).toBe(450_000n); expect(summary.total).toBe(616_000n);
  });

  it("D — an envelope target is metadata and never creates a financial transaction", () => {
    expect(moneyService).toContain("targetAmount");
    expect(moneyService).not.toMatch(/createMoneyAccount[\s\S]{0,1800}transaction\.create/);
  });

  it("E — creating a future mandatory payment is only a reminder", () => {
    const recurringCreation = familyService.slice(familyService.indexOf("export async function createRecurringPayment"), familyService.indexOf("export async function getRecurringPayments"));
    expect(recurringCreation).not.toContain("transaction.create");
  });

  it("removes Goal and SavingsMovement from the active financial model", () => {
    expect(familyService).not.toContain("SavingsGoal");
    expect(familyService).not.toContain("SavingsMovement");
  });
});
