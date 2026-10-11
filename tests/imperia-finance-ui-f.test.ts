import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const moneyPage = readFileSync(new URL("../src/app/(private)/money/page.tsx", import.meta.url), "utf8");
const capitalPage = readFileSync(new URL("../src/app/(private)/capital/page.tsx", import.meta.url), "utf8");
const home = readFileSync(new URL("../src/components/imperia-home.tsx", import.meta.url), "utf8");
const safePage = readFileSync(new URL("../src/app/(private)/safe/page.tsx", import.meta.url), "utf8");
const moneyServer = readFileSync(new URL("../src/server/money.ts", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/app/imperia-design-system.css", import.meta.url), "utf8");
const navigation = readFileSync(new URL("../src/components/mobile-bottom-navigation.tsx", import.meta.url), "utf8");

describe("FEVORA IMPERIA UI-F Capital / Safe separation", () => {
  it("keeps financial workspace and transfer services available to real operations", () => {
    for (const source of ["getMoneyWorkspace", "getMoneyOverview", "getMoneyProjects", "getInternalTransfer"]) expect(moneyServer).toContain(source);
    expect(moneyServer).toContain("summarizeProjectMoney");
    expect(moneyServer).toContain("calculateMoneyAccountBalance");
  });

  it("shows capital as a consolidated overview, without the legacy project-transfer dashboard", () => {
    for (const label of ["Общий капитал", "Всего денег", "В конвертах", "Свободно", "Доходы", "Расходы", "Финансовый результат", "Вклад направлений", "Открыть аналитику"]) expect(capitalPage).toContain(label);
    for (const direction of ["COSMETOLOGY", "POULTRY", "FAMILY", "INFOBUSINESS", "GOODS"]) expect(capitalPage).toContain(direction);
    for (const legacyLabel of ["Баланс проектов", "Внутренние переводы", "Доступно семье"]) expect(capitalPage).not.toContain(legacyLabel);
  });

  it("routes the former mixed money entrypoint and home cards to their focused screens", () => {
    expect(moneyPage).toContain('redirect("/safe")');
    expect(home).toContain('href="/capital"');
    expect(home).toContain('href="/money/envelopes"');
    expect(safePage).toContain("getSafeOverview");
    expect(safePage).toContain("MoneyAccountKind.WALLET");
    expect(safePage).not.toContain("recentTransactions");
    expect(navigation).toContain('["/safe", "Сейф", "cash"]');
  });

  it("uses isolated responsive styles for the new capital page", () => {
    for (const selector of [".imperia-capital-page", ".imperia-capital-total", ".imperia-capital-distribution", ".imperia-capital-directions"]) expect(css).toContain(selector);
  });
});
