import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { assertAllocationKeepsCapital, calculateMoneyAccountBalance, summarizeProjectMoney, validateInternalAllocation } from "../src/features/money/calculations";

const wallet = (overrides = {}) => ({ id: "wallet", projectId: "family", kind: "WALLET" as const, currency: "UAH", isActive: true, balanceMinor: 50_000_00n, ...overrides });
const envelope = (overrides = {}) => ({ id: "envelope", projectId: "family", kind: "ENVELOPE" as const, currency: "UAH", isActive: true, balanceMinor: 0n, ...overrides });
const migration = readFileSync(join(process.cwd(), "prisma/migrations/20260909120000_add_universal_money_accounts/migration.sql"), "utf8");

describe("универсальные кошельки и конверты", () => {
  it("1. миграция создаёт кошелёк как универсальный MoneyAccount", () => expect(migration).toContain('CREATE TABLE "MoneyAccount"'));
  it("2. opening balance входит в вычисляемый баланс", () => expect(calculateMoneyAccountBalance({ openingBalance: "50000", entries: [] })).toBe(5_000_000n));
  it("3. opening balance не создаёт Income", () => expect(migration).not.toMatch(/INSERT INTO "Transaction"/));
  it("4. модель поддерживает редактируемые реквизиты", () => expect(migration).toContain('"updatedAt" TIMESTAMP(3) NOT NULL'));
  it("5. модель поддерживает архивирование кошелька", () => expect(migration).toContain('"isActive" BOOLEAN NOT NULL DEFAULT true'));
  it("6. архивный кошелёк нельзя использовать", () => expect(() => validateInternalAllocation(wallet({ isActive: false }), envelope(), 100n)).toThrow("Архивный"));
  it("7. конверт создаётся тем же типом сущности", () => expect(migration).toContain("'WALLET', 'ENVELOPE'"));
  it("8. конверт имеет цель, срок и комментарий", () => { expect(migration).toContain('"targetAmount"'); expect(migration).toContain('"targetDate"'); expect(migration).toContain('"note"'); });
  it("9. конверт можно архивировать", () => expect(migration).toContain('"isActive"'));
  it("10. история ограничивает физическое удаление", () => expect(migration).toContain('ON DELETE RESTRICT'));
  it("11. допускает кошелёк → конверт", () => expect(() => validateInternalAllocation(wallet(), envelope(), 100n)).not.toThrow());
  it("12. допускает конверт → кошелёк", () => expect(() => validateInternalAllocation(envelope({ balanceMinor: 100n }), wallet(), 100n)).not.toThrow());
  it("13. внутреннее перемещение не является Income", () => expect(migration).toContain("'TRANSFER'"));
  it("14. внутреннее перемещение не является Expense", () => expect(migration).toContain('"type" "MoneyLedgerEntryType"'));
  it("15. резервирование в конверте не увеличивает капитал", () => {
    const before = [{ kind: "WALLET" as const, openingBalance: "50000", entries: [] }, { kind: "ENVELOPE" as const, openingBalance: "0", entries: [] }];
    const after = [{ ...before[0], entries: [] }, { ...before[1], entries: [{ amount: "10000" }] }];
    expect(assertAllocationKeepsCapital(before, after)).toBe(true);
  });
  it("16. отклоняет недостаток средств", () => expect(() => validateInternalAllocation(wallet({ balanceMinor: 99n }), envelope(), 100n)).toThrow("Недостаточно"));
  it("17. acceptance: 50 000 = 20 000 свободно + 30 000 распределено", () => {
    const result = summarizeProjectMoney([
      { kind: "WALLET", openingBalance: "50000", entries: [] },
      { kind: "ENVELOPE", openingBalance: "0", entries: [{ amount: "10000" }] },
      { kind: "ENVELOPE", openingBalance: "0", entries: [{ amount: "15000" }] },
      { kind: "ENVELOPE", openingBalance: "0", entries: [{ amount: "5000" }] },
    ]);
    expect(result).toEqual({ total: 5_000_000n, free: 2_000_000n, allocated: 3_000_000n });
  });
  it("18. запрещает смешивать валюты", () => expect(() => validateInternalAllocation(wallet(), envelope({ currency: "USD" }), 100n)).toThrow("валют"));
  it("19. idempotency обеспечена уникальным ключом пользователя", () => expect(migration).toContain('"InternalTransfer_userId_idempotencyKey_key"'));
  it("20. существующие Family-таблицы миграция не изменяет", () => { expect(migration).not.toMatch(/ALTER TABLE "Transaction"/); expect(migration).not.toMatch(/ALTER TABLE "FamilyAccount"/); expect(migration).not.toMatch(/ALTER TABLE "SavingsGoal"/); });
});

describe("ограничения этапа", () => {
  it("разрешает межпроектное распределение после Этапа 2", () => expect(() => validateInternalAllocation(wallet(), envelope({ projectId: "poultry" }), 100n)).not.toThrow());
  it("запрещает кошелёк → кошелёк", () => expect(() => validateInternalAllocation(wallet(), wallet({ id: "wallet-2" }), 100n)).toThrow("кошельком и конвертом"));
  it("запрещает конверт → конверт", () => expect(() => validateInternalAllocation(envelope({ balanceMinor: 100n }), envelope({ id: "envelope-2" }), 100n)).toThrow("кошельком и конвертом"));
  it("игнорирует сторнированные проводки", () => expect(calculateMoneyAccountBalance({ openingBalance: "10", entries: [{ amount: "5", reversedAt: new Date() }] })).toBe(1000n));
});
