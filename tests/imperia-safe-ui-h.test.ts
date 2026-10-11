import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const safe = readFileSync(new URL("../src/components/imperia-safe.tsx", import.meta.url), "utf8");
const safePage = readFileSync(new URL("../src/app/(private)/safe/page.tsx", import.meta.url), "utf8");
const analytics = readFileSync(new URL("../src/app/(private)/analytics/page.tsx", import.meta.url), "utf8");
const analyticsDetails = readFileSync(new URL("../src/components/imperia-analytics-details.tsx", import.meta.url), "utf8");
const projectNavigation = readFileSync(new URL("../src/components/project-bottom-navigation.tsx", import.meta.url), "utf8");
const imperiaShell = readFileSync(new URL("../src/components/imperia-app-shell.tsx", import.meta.url), "utf8");
const mobileNavigation = readFileSync(new URL("../src/components/mobile-bottom-navigation.tsx", import.meta.url), "utf8");

describe("FEVORA IMPERIA UI-H Safe and analytics", () => {
  it("keeps Safe focused on current money, wallets, allocation and operations", () => {
    for (const label of ["Пришло", "Ушло", "Итог", "Кошельки", "Распределение денег", "Всего денег", "В конвертах", "Свободно"]) expect(safe).toContain(label);
    expect(safe).not.toContain("Последние операции");
    expect(safe).not.toContain("Средний чек");
    expect(safe).not.toContain("Выручка за день");
  });

  it("links allocation to envelopes and places the four financial actions in the Safe bottom-plus menu", () => {
    expect(safe).toContain('href="/money/envelopes"');
    expect(safe).not.toContain('className="imperia-safe-add"');
    for (const label of ["Доход", "Расход", "Перевод", "В конверт"]) expect(mobileNavigation).toContain(`>${label}<`);
    expect(mobileNavigation).toContain("const safeActions = inSafe");
    expect(safePage).toContain("total - allocated");
  });

  it("places analytics on its own screen with requested filters and metrics", () => {
    const analyticsUi = `${analytics}\n${analyticsDetails}`;
    for (const label of ["Период", "Направление", "Тип", "Категория", "Кошелёк", "Поступления", "Расходы", "Количество операций", "Движение денег"]) expect(analyticsUi).toContain(label);
    expect(analytics).not.toContain("Средний приход");
    expect(projectNavigation).toContain('pathname === "/safe"');
    expect(projectNavigation).toContain('pathname === "/analytics"');
    expect(imperiaShell).toContain('pathname === "/analytics"');
    expect(mobileNavigation).toContain('pathname.startsWith("/analytics")');
  });

  it("opens period and day breakdowns from analytics totals and chart bars", () => {
    expect(analytics).toContain("ImperiaAnalyticsDetails");
    for (const label of ["Показать все поступления", "Показать все расходы", "Нажмите на день для расшифровки", "Поступления за период", "Расходы за период", "Расшифровка"]) expect(analyticsDetails).toContain(label);
    expect(analyticsDetails).toContain("selectedDay.groups");
  });
});
