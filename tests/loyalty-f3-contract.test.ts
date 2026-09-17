import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const schema = readFileSync(new URL("../prisma/schema.prisma", import.meta.url), "utf8");
const migration = readFileSync(new URL("../prisma/migrations/20260911073500_add_cosmetology_loyalty_delivery/migration.sql", import.meta.url), "utf8");
const server = readFileSync(new URL("../src/server/loyalty-delivery.ts", import.meta.url), "utf8");
const loyaltyServer = readFileSync(new URL("../src/server/loyalty.ts", import.meta.url), "utf8");
const ui = readFileSync(new URL("../src/components/loyalty-delivery-card.tsx", import.meta.url), "utf8");

describe("F3 persistence and UI contract", () => {
  it("uses additive unique delivery persistence without backfill", () => {
    expect(schema).toContain("model CosmetologyLoyaltyDelivery");
    expect(schema).toMatch(/visitId\s+String\s+@unique/);
    expect(schema).toMatch(/externalEventId\s+String\s+@unique/);
    expect(migration).toContain("CREATE TABLE");
    expect(migration).not.toMatch(/^\s*(?:INSERT|UPDATE|DELETE|DROP|TRUNCATE)\b/im);
  });

  it("uses SENDING as an atomic claim and never changes the event ID on retry", () => {
    expect(server).toContain("updateMany");
    expect(server).toContain("status: CosmetologyLoyaltyDeliveryStatus.SENDING");
    expect(server).toContain("payload.external_event_id !== delivery.externalEventId");
  });

  it("shows all delivery states and keeps production sending gated", () => {
    for (const value of ["NOT_SENT", "SENDING", "SENT", "FAILED"]) expect(ui).toContain(value);
    expect(ui).not.toContain("BOT_CLIENT_PAYMENTS_ENABLED");
    expect(loyaltyServer).toContain("BOT_CLIENT_PAYMENTS_ENABLED");
    expect(ui).toContain("Отправка production payment отключена");
  });

  it("does not create local bonus balance, transactions or loyalty level", () => {
    const deliveryModel = schema.match(/model CosmetologyLoyaltyDelivery \{[\s\S]*?\n\}/)?.[0] ?? "";
    expect(deliveryModel).not.toContain("bonusBalance");
    expect(deliveryModel).not.toContain("bonusTransactions");
    expect(deliveryModel).not.toContain("loyaltyLevel");
  });
});
