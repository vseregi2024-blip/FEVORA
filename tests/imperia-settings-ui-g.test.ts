import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync(new URL("../src/app/(private)/family/settings/page.tsx", import.meta.url), "utf8");
const settings = readFileSync(new URL("../src/components/imperia-settings.tsx", import.meta.url), "utf8");
const theme = readFileSync(new URL("../src/components/family-theme-toggle.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../src/app/imperia-design-system.css", import.meta.url), "utf8");
const categories = readFileSync(new URL("../src/app/(private)/family/categories/page.tsx", import.meta.url), "utf8");
const categoryForm = readFileSync(new URL("../src/components/family-category-form.tsx", import.meta.url), "utf8");
const sections = readFileSync(new URL("../src/app/(private)/family/settings/sections/page.tsx", import.meta.url), "utf8");
const notifications = readFileSync(new URL("../src/app/(private)/family/settings/notifications/page.tsx", import.meta.url), "utf8");
const security = readFileSync(new URL("../src/app/(private)/family/settings/security/page.tsx", import.meta.url), "utf8");
const accounts = readFileSync(new URL("../src/app/(private)/family/accounts/page.tsx", import.meta.url), "utf8");
const recurring = readFileSync(new URL("../src/app/(private)/family/recurring/page.tsx", import.meta.url), "utf8");
const procedures = readFileSync(new URL("../src/app/(private)/cosmetology/procedures/page.tsx", import.meta.url), "utf8");
const inventory = readFileSync(new URL("../src/app/(private)/cosmetology/inventory/page.tsx", import.meta.url), "utf8");
const projects = readFileSync(new URL("../src/components/imperia-finance.tsx", import.meta.url), "utf8");
const moneySettings = readFileSync(new URL("../src/app/(private)/family/settings/money/page.tsx", import.meta.url), "utf8");
const profileSettings = readFileSync(new URL("../src/app/(private)/family/settings/profile/page.tsx", import.meta.url), "utf8");
const profileSettingsActions = readFileSync(new URL("../src/app/(private)/family/settings/profile/actions.ts", import.meta.url), "utf8");
const moneyNew = readFileSync(new URL("../src/app/(private)/money/new/page.tsx", import.meta.url), "utf8");
const moneyAccount = readFileSync(new URL("../src/app/(private)/money/[id]/page.tsx", import.meta.url), "utf8");

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
    for (const href of ["/family/settings/sections", "/family/settings/notifications", "/family/settings/security", "/family/settings/profile"]) expect(settings).toContain(href);
    for (const href of ["/projects", "/family/categories", "/family/accounts", "/family/settings/money", "/family/recurring", "/cosmetology/procedures", "/cosmetology/inventory"]) expect(sections).toContain(href);
    for (const mode of ['selectTheme("light")', 'selectTheme("dark")', 'selectTheme("system")']) expect(theme).toContain(mode);
  });

  it("does not present unavailable notification or biometric controls as active", () => {
    expect(notifications).toContain("Не настроено");
    expect(security).toContain("Не подключён");
    expect(settings).not.toContain('role="switch"');
    for (const selector of [".imperia-settings-profile", ".imperia-settings-card", ".imperia-theme-options", ".imperia-settings-system"]) expect(css).toContain(selector);
  });

  it("moves compact settings details to separate readable screens", () => {
    expect(settings).toContain('href="/family/settings/sections"');
    expect(settings).not.toContain("SettingsDisclosure");
    expect(notifications).toContain("Новые клиенты");
    expect(security).toContain("Вход по паролю");
    expect(css).toContain(".imperia-sections-page");
    expect(css).toContain(".imperia-settings-detail-page");
  });

  it("opens financial-category management as a focused separate flow", () => {
    expect(categories).toContain('href="/family/categories/new"');
    expect(categories).toContain("Финансовые категории");
    expect(categories).not.toContain("<form action={createFamilyCategoryAction}");
    expect(categoryForm).toContain("FamilyCategoryKindPicker");
    expect(categoryForm).toContain("FamilyIconPicker");
    for (const selector of [".imperia-category-page", ".imperia-category-editor-card", ".imperia-category-submit"]) expect(css).toContain(selector);
  });

  it("returns account management to the application-sections launcher instead of Home", () => {
    expect(accounts).toContain('href="/family/settings/sections"');
    expect(accounts).toContain("← Разделы приложения");
  });

  it("returns every top-level application section to the sections launcher", () => {
    for (const source of [categories, accounts, recurring, procedures, inventory, projects]) {
      expect(source).toContain("/family/settings/sections");
    }
    expect(projects).toContain("← Разделы приложения");
    expect(css).toContain(".imperia-projects-back");
  });

  it("keeps wallet and envelope setup separate from Safe with a settings return path", () => {
    expect(settings).not.toContain('href="/safe" icon="money" title="Кошельки и конверты"');
    expect(moneySettings).toContain("Кошельки и конверты");
    expect(moneySettings).toContain("Настроить");
    expect(moneySettings).toContain('href="/family/settings/sections"');
    expect(moneySettings).toContain('const returnTo = "/family/settings/money"');
    expect(moneyNew).toContain('query.returnTo === "/family/settings/money"');
    expect(moneyAccount).toContain('query.returnTo === "/family/settings/money"');
    expect(profileSettings).toContain('href="/family/settings"');
    expect(css).toContain(".imperia-money-settings-page");
  });

  it("allows focused profile preferences without rewriting financial history", () => {
    expect(profileSettings).toContain("Изменить профиль");
    expect(profileSettings).toContain("defaultCurrency");
    expect(profileSettings).toContain("не конвертирует и не изменяет уже сохранённые операции");
    expect(profileSettingsActions).toContain("updateProfileSettingsAction");
    expect(profileSettingsActions).toContain("prisma.user.update");
    expect(profileSettingsActions).not.toContain("transaction.update");
  });
});
