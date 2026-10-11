import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync(new URL("../src/app/(private)/money/[id]/page.tsx", import.meta.url), "utf8");
const actions = readFileSync(new URL("../src/app/(private)/money/actions.ts", import.meta.url), "utf8");
const server = readFileSync(new URL("../src/server/money.ts", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/app/imperia-design-system.css", import.meta.url), "utf8");

describe("Envelope funding and progress", () => {
  it("shows the real saved amount, target, remaining amount and progress", () => {
    for (const label of ["Уже в конверте", "Цель", "Осталось", "Накоплено"]) expect(page).toContain(label);
    expect(page).toContain("calculateMoneyAccountBalance");
    expect(page).toContain("money-envelope-progress-track");
  });

  it("funds an active envelope from an existing wallet without creating income or expense", () => {
    expect(page).toContain("fundMoneyEnvelopeAction");
    expect(page).toContain('name="sourceAccountId"');
    expect(page).toContain('name="targetAccountId"');
    expect(page).toContain("item.availableBalanceMinor > 0n");
    expect(page).toContain("свободно");
    expect(actions).toContain("createInternalAllocation");
    expect(actions).toContain("envelope.kind !== MoneyAccountKind.ENVELOPE");
    expect(actions).not.toMatch(/fundMoneyEnvelopeAction[\s\S]*transaction\.create/);
  });

  it("loads active ledger entries and refreshes every progress surface", () => {
    expect(server).toContain('moneyLedgerEntries: { where: { reversedAt: null }');
    expect(server).toContain("availableBalanceMinor");
    expect(server).toContain("reservedByWallet");
    expect(actions).toContain('"/family"');
    for (const selector of [".money-envelope-funding", ".money-envelope-progress-card", ".money-envelope-add-form"]) expect(css).toContain(selector);
  });
});
