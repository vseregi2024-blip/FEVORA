import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const capital = readFileSync(new URL("../src/app/(private)/capital/page.tsx", import.meta.url), "utf8");
const money = readFileSync(new URL("../src/app/(private)/money/page.tsx", import.meta.url), "utf8");
const home = readFileSync(new URL("../src/components/imperia-home.tsx", import.meta.url), "utf8");
const safe = readFileSync(new URL("../src/app/(private)/safe/page.tsx", import.meta.url), "utf8");
const moneyServer = readFileSync(new URL("../src/server/money.ts", import.meta.url), "utf8");
const transfers = readFileSync(new URL("../src/app/(private)/money/transfer/page.tsx", import.meta.url), "utf8");

describe("capital and safe have separate responsibilities", () => {
  it("makes capital a wallet-based overview without project balances or transfers", () => {
    expect(capital).toContain("getMoneyOverview");
    expect(capital).toContain("MoneyAccountKind.WALLET");
    expect(capital).toContain("MoneyAccountKind.ENVELOPE");
    expect(capital).toContain("Вклад направлений");
    expect(capital).toContain('href={`/analytics?${analytics.toString()}`}');
    expect(capital).not.toContain("Баланс проектов");
    expect(capital).not.toContain("Внутренние переводы");
    expect(capital).not.toContain("Доступно семье");
  });

  it("routes home capital to the dedicated overview and retires the mixed money page", () => {
    expect(home).toContain('href="/capital"');
    expect(home).toContain('href="/money/envelopes"');
    expect(money).toContain('redirect("/safe")');
  });

  it("uses a shared money account for new Safe operation rows and keeps physical transfer UI", () => {
    expect(safe).toContain("getSafeOverview");
    expect(safe).toContain("MoneyAccountKind.WALLET");
    expect(safe).not.toContain("recentTransactions");
    expect(moneyServer).toContain("moneyAccount: { select: { name: true } }");
    expect(transfers).toContain('label="Кошельки"');
    expect(transfers).toContain('label="Конверты"');
    expect(transfers).not.toContain("Между проектами");
  });
});
