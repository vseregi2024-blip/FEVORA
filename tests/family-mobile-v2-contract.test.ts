import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const schema = readFileSync(new URL("../prisma/schema.prisma", import.meta.url), "utf8");
const migration = readFileSync(new URL("../prisma/migrations/20260904103000_family_accounts_and_mobile_details/migration.sql", import.meta.url), "utf8");
const service = readFileSync(new URL("../src/server/family.ts", import.meta.url), "utf8");
const actions = readFileSync(new URL("../src/app/(private)/family/actions.ts", import.meta.url), "utf8");
const analytics = readFileSync(new URL("../src/app/(private)/family/analytics/page.tsx", import.meta.url), "utf8");
const settings = readFileSync(new URL("../src/app/(private)/family/settings/page.tsx", import.meta.url), "utf8");
const theme = readFileSync(new URL("../src/components/family-theme-toggle.tsx", import.meta.url), "utf8");

describe("Family mobile v2 contract", () => {
  it("adds accounts and savings dates without destructive SQL", () => {
    expect(migration).toContain('CREATE TABLE "FamilyAccount"');
    expect(migration).toContain('ADD COLUMN "familyAccountId"');
    expect(migration).toContain('ADD COLUMN "targetDate" DATE');
    expect(migration).not.toMatch(/DROP\s+(TABLE|COLUMN)|TRUNCATE|DELETE\s+FROM/i);
  });

  it("keeps account links nullable so old operations stay valid", () => {
    expect(schema).toContain("familyAccountId    String?");
    expect(schema).toContain("targetDate   DateTime?");
  });

  it("validates account ownership before writing financial records", () => {
    expect(service).toContain("assertFamilyAccount");
    expect(service).toContain("familyAccountId: input.accountId");
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
    expect(settings).toContain('/family/categories');
    expect(settings).toContain('/family/accounts');
    expect(settings).toContain('/family/recurring');
  });

  it("offers persistent dark and light Family palettes", () => {
    expect(settings).toContain("FamilyThemeToggle");
    expect(theme).toContain("fevora-family-theme");
    expect(theme).toContain('"dark" | "light"');
  });
});
