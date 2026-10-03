import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync(new URL("../src/app/(private)/family/settings/page.tsx", import.meta.url), "utf8");
const settings = readFileSync(new URL("../src/components/imperia-settings.tsx", import.meta.url), "utf8");
const theme = readFileSync(new URL("../src/components/family-theme-toggle.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/app/imperia-design-system.css", import.meta.url), "utf8");

describe("FEVORA IMPERIA UI-G Settings", () => {
  it("uses the authenticated user and read-only integration configuration", () => {
    expect(page).toContain("requireUser");
    expect(page).toContain("BOT_CLIENT_API_URL");
    expect(page).toContain("BOT_CLIENT_API_SECRET");
    expect(page).not.toContain("prisma");
  });

  it("contains every approved settings section", () => {
    for (const label of ["Внешний вид", "Уведомления", "Безопасность", "Разделы приложения", "Интеграция лояльности", "Системные настройки"]) expect(settings).toContain(label);
    expect(settings).toContain("Beauty Bonus Club");
  });

  it("keeps real theme selection, routes and logout", () => {
    expect(settings).toContain("FamilyThemeToggle");
    expect(settings).toContain("logoutAction");
    for (const href of ["/projects", "/family/categories", "/cosmetology/procedures", "/cosmetology/inventory", "/settings", "/money"]) expect(settings).toContain(href);
    for (const mode of ['selectTheme("light")', 'selectTheme("dark")', 'selectTheme("system")']) expect(theme).toContain(mode);
  });

  it("does not present unavailable notification or biometric controls as active", () => {
    expect(settings).toContain("Не настроено");
    expect(settings).toContain("Не подключён");
    expect(settings).not.toContain('role="switch"');
    for (const selector of [".imperia-settings-profile", ".imperia-settings-card", ".imperia-theme-options", ".imperia-settings-system"]) expect(css).toContain(selector);
  });
});
