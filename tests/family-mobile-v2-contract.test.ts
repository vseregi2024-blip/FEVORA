import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const schema = readFileSync(new URL("../prisma/schema.prisma", import.meta.url), "utf8");
const migration = readFileSync(new URL("../prisma/migrations/20260904103000_family_accounts_and_mobile_details/migration.sql", import.meta.url), "utf8");
const service = readFileSync(new URL("../src/server/family.ts", import.meta.url), "utf8");
const actions = readFileSync(new URL("../src/app/(private)/family/actions.ts", import.meta.url), "utf8");
const analytics = readFileSync(new URL("../src/app/(private)/family/analytics/page.tsx", import.meta.url), "utf8");
const settingsView = readFileSync(new URL("../src/components/imperia-settings.tsx", import.meta.url), "utf8");
const settingsSections = readFileSync(new URL("../src/app/(private)/family/settings/sections/page.tsx", import.meta.url), "utf8");
const theme = readFileSync(new URL("../src/components/family-theme-toggle.tsx", import.meta.url), "utf8");
const quickOperation = readFileSync(new URL("../src/components/quick-family-operation-form.tsx", import.meta.url), "utf8");
const splitReceipt = readFileSync(new URL("../src/components/split-receipt-form.tsx", import.meta.url), "utf8");

describe("Family mobile v2 contract", () => {
  it("adds accounts and savings dates without destructive SQL", () => {
    expect(migration).toContain('CREATE TABLE "FamilyAccount"');
    expect(migration).toContain('ADD COLUMN "familyAccountId"');
    expect(migration).toContain('ADD COLUMN "targetDate" DATE');
    expect(migration).not.toMatch(/DROP\s+(TABLE|COLUMN)|TRUNCATE|DELETE\s+FROM/i);
  });

  it("keeps account links nullable so old operations stay valid", () => {
    expect(schema).toMatch(/familyAccountId\s+String\?/);
    expect(schema).toMatch(/targetDate\s+DateTime\?/);
  });

  it("validates account ownership before writing financial records", () => {
    expect(service).toContain("assertFamilyAccount");
    expect(service).toContain("familyAccountId: input.accountId");
  });

  it("requires a physical wallet for a new income without radio-button account choices", () => {
    expect(quickOperation).toContain('name="accountId"');
    expect(quickOperation).toContain('required={type === "INCOME"}');
    expect(quickOperation).not.toContain("Без счёта");
    expect(service).toContain("Для дохода выберите кошелёк поступления.");
  });

  it("requires a wallet and offers an active add-part action for a split expense", () => {
    expect(splitReceipt).toContain('name="accountId" required');
    expect(splitReceipt).not.toContain("Без счёта");
    expect(splitReceipt).toContain("+ Добавить часть");
    expect(service).toContain("Для расхода выберите кошелёк оплаты.");
  });

  it("supports account create, edit, archive, restore and ordering", () => {
    for (const name of ["createFamilyAccountAction", "updateFamilyAccountAction", "archiveFamilyAccountAction", "moveFamilyAccountAction"]) expect(actions).toContain(name);
  });

  it("exposes account renaming in the Family settings UI", () => {
    const accounts = readFileSync(new URL("../src/app/(private)/family/accounts/page.tsx", import.meta.url), "utf8");
    expect(accounts).toContain("updateFamilyAccountAction");
    expect(accounts).toContain("Сохранить изменения");
  });

  it("offers period and analytics view switches without a wide table", () => {
    expect(analytics).toContain('value="MONTH"');
    expect(analytics).toContain('value="THREE_MONTHS"');
    expect(analytics).toContain('value="YEAR"');
    expect(analytics).toContain("categoryHistory");
    expect(analytics).toContain("Суммы");
    expect(analytics).toContain("Категории");
    expect(analytics).toContain("По месяцам");
    expect(analytics).toContain("Сравнить с");
    expect(analytics).not.toContain("category-history-table");
  });

  it("keeps infrequent directories in a separate Family settings screen", () => {
    expect(settingsView).toContain('/family/settings/sections');
    expect(settingsSections).toContain('/family/categories');
    expect(settingsSections).toContain('/family/accounts');
    expect(settingsSections).toContain('/family/recurring');
  });

  it("offers persistent dark and light Family palettes", () => {
    expect(settingsView).toContain("FamilyThemeToggle");
    expect(theme).toContain("fevora-family-theme");
    expect(theme).toContain('"dark" | "light"');
  });
});
