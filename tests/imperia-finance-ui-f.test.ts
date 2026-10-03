import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync(new URL("../src/app/(private)/money/page.tsx", import.meta.url), "utf8");
const finance = readFileSync(new URL("../src/components/imperia-finance.tsx", import.meta.url), "utf8");
const moneyServer = readFileSync(new URL("../src/server/money.ts", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/app/imperia-design-system.css", import.meta.url), "utf8");
const navigation = readFileSync(new URL("../src/components/mobile-bottom-navigation.tsx", import.meta.url), "utf8");

describe("FEVORA IMPERIA UI-F Finance / Projects", () => {
  it("keeps the existing money workspace and calculation sources", () => {
    for (const source of ["getMoneyWorkspace", "getMoneyOverview", "getMoneyProjects", "getInternalTransfer"]) expect(page).toContain(source);
    expect(moneyServer).toContain("summarizeProjectMoney");
    expect(moneyServer).toContain("calculateMoneyAccountBalance");
  });

  it("shows the approved finance structure", () => {
    for (const label of ["Общий капитал", "Кошельки", "Конверты", "Внутренние переводы", "Баланс проектов"]) expect(finance).toContain(label);
    for (const project of ["Семья", "Птицеводство", "Товарка", "Инфобизнес", "Косметология"]) expect(finance).toContain(project);
  });

  it("preserves account, transfer, history and project navigation", () => {
    for (const href of ["/money/transfer?project=", "/money/new?project=", "/money/${account.id}", "/finance?module=", "/projects"]) expect(finance).toContain(href);
    expect(navigation).toContain('["/safe", "Сейф", "cash"]');
  });

  it("uses isolated UI-F responsive styles", () => {
    for (const selector of [".imperia-finance-capital", ".imperia-finance-projects", ".imperia-finance-metrics", ".imperia-projects-page"]) expect(css).toContain(selector);
  });
});
