import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { applyVoicePatch, missingVoiceFields, voiceQuestion, type VoiceDraft, type VoicePatch } from "../src/features/family/voice";

const food = { id: "cm12345678901234567890123", name: "Продукты" };
const home = { id: "cm22345678901234567890123", name: "Дом" };
const categories = [food, home];
const blank: VoiceDraft = { operationType: null, amount: null, categoryId: null, categoryName: null, comment: null, date: "2026-09-07" };
const complete: VoiceDraft = { operationType: "EXPENSE", amount: "450.00", categoryId: food.id, categoryName: food.name, comment: "АТБ", date: "2026-09-07" };

const patch = (value: Partial<VoicePatch>): VoicePatch => ({
  intent: "UPDATE", changedFields: [], operationType: null, amount: null,
  categoryId: null, comment: null, date: null, ...value,
});

describe("Family AI voice draft", () => {
  it("creates a complete draft without writing to the database", () => {
    const result = applyVoicePatch(blank, patch({
      changedFields: ["operationType", "amount", "categoryId", "comment"],
      operationType: "EXPENSE", amount: 450, categoryId: food.id, comment: "АТБ",
    }), categories);
    expect(result).toEqual(complete);
  });

  it("changes only the corrected amount", () => {
    const result = applyVoicePatch(complete, patch({ changedFields: ["amount"], amount: 540 }), categories);
    expect(result).toEqual({ ...complete, amount: "540.00" });
  });

  it("changes only the corrected category", () => {
    const result = applyVoicePatch(complete, patch({ changedFields: ["categoryId"], categoryId: home.id }), categories);
    expect(result).toEqual({ ...complete, categoryId: home.id, categoryName: home.name });
  });

  it("can clear a comment without losing the other fields", () => {
    const result = applyVoicePatch(complete, patch({ changedFields: ["comment"], comment: null }), categories);
    expect(result).toEqual({ ...complete, comment: null });
  });

  it("does not accept an invented category id", () => {
    const result = applyVoicePatch(complete, patch({ changedFields: ["categoryId"], categoryId: "unknown" }), categories);
    expect(result.categoryId).toBeNull();
    expect(result.categoryName).toBeNull();
  });

  it("asks for type, amount and category in a deterministic order", () => {
    expect(missingVoiceFields(blank)).toEqual(["operationType", "amount", "categoryId"]);
    expect(voiceQuestion(blank)).toEqual({ text: "Это расход или доход?", awaitingField: "operationType" });
    expect(voiceQuestion({ ...blank, operationType: "EXPENSE" }).awaitingField).toBe("amount");
    expect(voiceQuestion({ ...blank, operationType: "EXPENSE", amount: "10.00" }).awaitingField).toBe("categoryId");
  });

  it("summarizes the completed draft before explicit confirmation", () => {
    const result = voiceQuestion(complete);
    expect(result.awaitingField).toBeNull();
    expect(result.text).toContain("Расход 450 гривен");
    expect(result.text).toContain("Категория: Продукты");
    expect(result.text).toContain("Сохранить?");
  });
});

describe("Family AI voice integration contracts", () => {
  const schema = readFileSync("prisma/schema.prisma", "utf8");
  const migration = readFileSync("prisma/migrations/20260907183000_add_family_voice_idempotency/migration.sql", "utf8");
  const service = readFileSync("src/server/family.ts", "utf8");
  const navigation = readFileSync("src/components/mobile-bottom-navigation.tsx", "utf8");
  const confirmRoute = readFileSync("src/app/api/family/voice/confirm/route.ts", "utf8");
  const parserRoute = readFileSync("src/app/api/family/voice/parse/route.ts", "utf8");

  it("uses a nullable, per-user unique request id without destructive SQL", () => {
    expect(schema).toMatch(/voiceRequestId\s+String\?/);
    expect(schema).toContain("@@unique([userId, voiceRequestId])");
    expect(migration).toContain('ADD COLUMN "voiceRequestId" TEXT');
    expect(migration).toContain('CREATE UNIQUE INDEX "Transaction_userId_voiceRequestId_key"');
    expect(migration).not.toMatch(/DROP\s+(TABLE|COLUMN)|TRUNCATE|DELETE\s+FROM/i);
  });

  it("uses an upsert so repeated confirmations cannot duplicate a transaction", () => {
    expect(service).toContain("createVoiceFamilyOperation");
    expect(service).toContain("prisma.transaction.upsert");
    expect(service).toContain("userId_voiceRequestId");
    expect(confirmRoute).toContain("missingVoiceFields");
  });

  it("keeps the existing Family plus actions and adds voice separately", () => {
    expect(navigation).toContain("<FamilyVoiceEntry/>");
    expect(navigation).toContain('/family/new?type=EXPENSE');
    expect(navigation).toContain('/family/new?type=INCOME');
    expect(navigation).toContain('/family/receipts/new');
    expect(navigation).toContain('/family/recurring/new');
  });

  it("does not store parser requests and requires same-origin confirmation", () => {
    expect(parserRoute).toContain("store: false");
    expect(parserRoute).toContain('content.type === "output_text"');
    expect(parserRoute).toContain("sameOrigin(request)");
    expect(confirmRoute).toContain("sameOrigin(request)");
  });
});
