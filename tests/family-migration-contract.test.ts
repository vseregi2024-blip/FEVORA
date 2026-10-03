import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(new URL("../prisma/migrations/20260827090000_finish_family_module/migration.sql", import.meta.url), "utf8");
const familyService = readFileSync(new URL("../src/server/family.ts", import.meta.url), "utf8");
const seed = readFileSync(new URL("../prisma/seed.ts", import.meta.url), "utf8");

describe("Family database integrity migration", () => {
  it("enforces one recurring expense per payment and due date", () => {
    expect(migration).toContain('CREATE UNIQUE INDEX "Transaction_recurringPaymentId_operationDate_key"');
  });

  it("soft-deletes pre-existing recurring duplicates before adding the constraint", () => {
    expect(migration).toContain("ROW_NUMBER() OVER");
    expect(migration).toContain('WHERE position > 1');
  });

  it("stores the declared split receipt total and backfills history", () => {
    expect(migration).toContain('ALTER TABLE "Receipt" ADD COLUMN "totalAmount"');
    expect(migration).toContain('SUM(transaction."amount")');
  });

  it("adds end date and archive state for recurring payments", () => {
    expect(migration).toContain('ADD COLUMN "endDate" DATE');
    expect(migration).toContain('ADD COLUMN "archivedAt"');
  });

  it("claims the current recurring due date atomically when the user explicitly marks it paid", () => {
    expect(familyService).toContain("recurringPayment.updateMany");
    expect(familyService).toContain("payRecurringFromFamily");
  });

  it("supports category archive and restore with one reversible service", () => {
    expect(familyService).toContain("setFamilyCategoryArchived");
    expect(familyService).toContain("data: { isArchived }");
  });

  it("does not recreate deleted Family categories during every deployment", () => {
    expect(seed).not.toContain("FinanceModule.FAMILY");
    expect(seed).not.toContain('["Продукты", FinanceModule.FAMILY');
  });
});
