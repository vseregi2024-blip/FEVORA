import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const server = readFileSync("src/server/poultry.ts", "utf8");
const finance = readFileSync("src/server/finance.ts", "utf8");
const schema = readFileSync("prisma/schema.prisma", "utf8");
const migration = readFileSync("prisma/migrations/20260831070000_poultry_2_0/migration.sql", "utf8");
const actions = readFileSync("src/app/(private)/poultry/actions.ts", "utf8");
const routeNavigation = readFileSync("src/components/poultry-route-navigation.tsx", "utf8");
const mobileNavigation = readFileSync("src/components/mobile-bottom-navigation.tsx", "utf8");
const poultryCss = readFileSync("src/app/family.css", "utf8");

describe("Poultry 2.0 integrity contracts", () => {
  it("uses an upper report date bound", () => expect(server).toContain("operationDate: { gte: from, lte: to }"));
  it("filters soft-deleted operational costs and transactions", () => { expect(server).toContain("batchId, deletedAt: null"); expect(server).toContain("transaction: { deletedAt: null"); });
  it("blocks generic Poultry finance creation and mutation", () => { expect(finance).toContain("input.module === FinanceModule.POULTRY"); expect(finance).toContain("existing.module === FinanceModule.POULTRY"); });
  it("links all generated finance sources explicitly", () => { expect(schema).toContain("poultryAcquisition"); expect(schema).toContain("incubationPurchase"); expect(schema).toContain("feedLot"); expect(schema).toContain("poultrySale"); expect(schema).toContain("operationalExpense"); });
  it("migration preserves legacy batches with origins and breeds", () => { expect(migration).toContain("legacy-origin-"); expect(migration).toContain("legacy-breed-"); });
  it("migration backfills reproducible movement deltas", () => expect(migration).toContain("UPDATE \"PoultryMovement\""));
  it("sale removal detaches the old unique movement link", () => expect(server).toContain("data: { saleId: null }"));
  it("egg sales are typed independently", () => expect(schema).toContain("EGGS"));
  it("equipment is excluded from automatic group cost", () => expect(server).toContain("notIn: [\"Оборудование\", \"Обладнання і матеріали\"]"));
  it("feed usage creates no financial transaction", () => { const body = server.slice(server.indexOf("export async function createFeedUsage"), server.indexOf("export async function createFeedRate")); expect(body).not.toContain("db.transaction.create"); });
  it("provides Back, Poultry overview, and FEVORA Projects routes", () => { expect(routeNavigation).toContain("← Назад"); expect(routeNavigation).toContain("Poultry · Обзор"); expect(routeNavigation).toContain("← FEVORA · Проекты"); });
  it("makes contextual Back deterministic through returnTo", () => { expect(routeNavigation).toContain('searchParams.get("returnTo")'); expect(routeNavigation).toContain("<Link href={returnTo}"); });
  it("redirects successful forms through a validated Poultry return path", () => { expect(actions).toContain('formValue(formData, "returnTo")'); expect(actions).toContain('requested?.startsWith("/poultry")'); expect(actions).toContain("target.searchParams.set(key, \"1\")"); });
  it("returns global quick actions to the Poultry overview", () => expect(mobileNavigation).toContain("returnTo=%2Fpoultry"));
  it("shows a cancel action beside Poultry form submissions", () => expect(readFileSync("src/components/poultry-form-actions.tsx", "utf8")).toContain("Отмена / Назад"));
  it("keeps explicit responsive rules for 375, 390, and 430 px", () => { expect(poultryCss).toContain("max-width: 375px"); expect(poultryCss).toContain("max-width: 390px"); expect(poultryCss).toContain("max-width: 430px"); });
  it("opens the form targeted by contextual hash navigation", () => expect(readFileSync("src/components/poultry-hash-details.tsx", "utf8")).toContain("target.open = true"));
});
