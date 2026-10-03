import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync(new URL("../src/app/(private)/cosmetology/cash/page.tsx", import.meta.url), "utf8");
const cash = readFileSync(new URL("../src/components/imperia-cash.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/app/imperia-design-system.css", import.meta.url), "utf8");
const server = readFileSync(new URL("../src/server/cosmetology.ts", import.meta.url), "utf8");

describe("FEVORA IMPERIA UI-E Cash", () => {
  it("redirects the old local cash address to the unified Safe", () => {
    expect(page).toContain('redirect("/safe")');
    expect(server).toContain("monetaryPaymentMethods");
  });

  it("shows every monetary method and existing filters", () => {
    for (const value of ["CASH", "MONOBANK", "PRIVATBANK", "OTHER"]) expect(cash).toContain(value);
    for (const label of ["Наличные", "Monobank", "ПриватБанк", "Прочее", "Сегодня", "Вчера", "Другой период"]) expect(cash).toContain(label);
  });

  it("keeps the cash page focused on real monetary receipts", () => {
    expect(cash).not.toContain("Неденежное погашение");
    expect(cash).not.toContain("Не увеличивает кассу");
    expect(cash).toContain("Выручка за день");
    expect(cash).toContain("Средний чек");
    expect(server).toContain("method: CosmetologyPaymentMethod.CERTIFICATE");
    expect(server).toContain("method: CosmetologyPaymentMethod.BONUS");
  });

  it("uses scoped UI-E styles", () => {
    for (const selector of [".imperia-cash-hero", ".imperia-cash-wallets", ".imperia-cash-revenue", ".imperia-cash-operations"]) expect(css).toContain(selector);
  });
});
