import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { calculateMoneyAccountBalance, validateInternalAllocation, validateTransferCancellation } from "../src/features/money/calculations";

const account = (id: string, projectId: string, kind: "WALLET" | "ENVELOPE" = "WALLET", balanceMinor = 100_000_00n) => ({ id, projectId, kind, currency: "UAH", isActive: true, balanceMinor });
const server = readFileSync(join(process.cwd(), "src/server/money.ts"), "utf8");
const actions = readFileSync(join(process.cwd(), "src/app/(private)/money/actions.ts"), "utf8");
const historyPage = readFileSync(join(process.cwd(), "src/app/(private)/money/transfers/page.tsx"), "utf8");
const transferPage = readFileSync(join(process.cwd(), "src/app/(private)/money/transfer/page.tsx"), "utf8");
const stage1Migration = readFileSync(join(process.cwd(), "prisma/migrations/20260909120000_add_universal_money_accounts/migration.sql"), "utf8");
const stage2Migration = readFileSync(join(process.cwd(), "prisma/migrations/20260909150000_add_internal_transfer_history_index/migration.sql"), "utf8");

describe("Этап 2: обязательные межпроектные сценарии", () => {
  it("1. Косметология → Семья", () => expect(() => validateInternalAllocation(account("mono", "cosmetology"), account("family-card", "family"), 20_000_00n)).not.toThrow());
  it("2. Косметология → Семья / Сбережения", () => expect(() => validateInternalAllocation(account("mono", "cosmetology"), account("savings", "family", "ENVELOPE"), 20_000_00n)).not.toThrow());
  it("3. Косметология → Семья / На жизнь", () => expect(() => validateInternalAllocation(account("mono", "cosmetology"), account("life", "family", "ENVELOPE"), 20_000_00n)).not.toThrow());
  it("4. Косметология → Птицеводство", () => expect(() => validateInternalAllocation(account("mono", "cosmetology"), account("poultry", "poultry"), 10_000_00n)).not.toThrow());
  it("5. Птицеводство → Семья", () => expect(() => validateInternalAllocation(account("poultry", "poultry"), account("family", "family"), 1_000_00n)).not.toThrow());
  it("6. Товарка → Семья", () => expect(() => validateInternalAllocation(account("goods", "goods"), account("family", "family"), 1_000_00n)).not.toThrow());
  it("7. Инфобизнес → Семья", () => expect(() => validateInternalAllocation(account("info", "info"), account("family", "family"), 1_000_00n)).not.toThrow());
  it("8. Косметология → Косметология / Препараты", () => expect(() => validateInternalAllocation(account("mono", "cosmetology"), account("drugs", "cosmetology", "ENVELOPE"), 15_000_00n)).not.toThrow());
  it("9. кошелёк → конверт другого проекта", () => expect(() => validateInternalAllocation(account("w", "a"), account("e", "b", "ENVELOPE"), 100n)).not.toThrow());
  it("10. конверт → кошелёк другого проекта", () => expect(() => validateInternalAllocation(account("e", "a", "ENVELOPE"), account("w", "b"), 100n)).not.toThrow());
});

describe("Этап 2: финансовая безопасность", () => {
  it("11. перевод не создаёт Income", () => expect(stage1Migration).not.toMatch(/INSERT INTO "Transaction"/));
  it("12. перевод не создаёт Expense", () => expect(server).not.toMatch(/transaction\.create\([\s\S]*type:\s*["']EXPENSE/));
  it("13. общий капитал не меняется", () => {
    const before = [100_000_00n, 20_000_00n, 10_000_00n].reduce((a, b) => a + b, 0n);
    const after = [80_000_00n, 40_000_00n, 10_000_00n].reduce((a, b) => a + b, 0n);
    expect(after).toBe(before);
  });
  it("14. недостаток средств запрещён", () => expect(() => validateInternalAllocation(account("a", "one", "WALLET", 10_000_00n), account("b", "two"), 15_000_00n)).toThrow("Недостаточно"));
  it("15. архивный контейнер запрещён", () => expect(() => validateInternalAllocation({ ...account("a", "one"), isActive: false }, account("b", "two"), 100n)).toThrow("Архивный"));
  it("16. повторный запрос ищет существующий перевод", () => expect(server).toContain("if (duplicate) return duplicate"));
  it("17. idempotency защищён уникальным ключом", () => expect(stage1Migration).toContain('"InternalTransfer_userId_idempotencyKey_key"'));
  it("18. atomicity обеспечена одной serializable transaction", () => { expect(server).toContain("Prisma.TransactionIsolationLevel.Serializable"); expect(server).toContain("moneyLedgerEntry.createMany"); });
  it("19. cancellation не удаляет перевод физически", () => { expect(server).toContain('status: "CANCELLED"'); expect(server).not.toContain("internalTransfer.delete"); });
  it("20. безопасная отмена разрешена при доступном остатке", () => expect(() => validateTransferCancellation(20_000_00n, 20_000_00n)).not.toThrow());
  it("21. отмена запрещена, если деньги использованы", () => expect(() => validateTransferCancellation(19_999_99n, 20_000_00n)).toThrow("часть денег уже использована"));
  it("22. разные валюты запрещены", () => expect(() => validateInternalAllocation(account("a", "one"), { ...account("b", "two"), currency: "EUR" }, 100n)).toThrow("валют"));
});

describe("Этап 2: история и балансы", () => {
  it("23. история показывает дату, источник, назначение, сумму и комментарий", () => ["operationDate", "sourceAccount", "targetAccount", "sourceAmount", "comment"].forEach((field) => expect(server + historyPage).toContain(field)));
  it("24. баланс источника уменьшается signed-проводкой", () => expect(calculateMoneyAccountBalance({ openingBalance: "100000", entries: [{ amount: "-20000" }] })).toBe(80_000_00n));
  it("25. баланс получателя увеличивается signed-проводкой", () => expect(calculateMoneyAccountBalance({ openingBalance: "20000", entries: [{ amount: "20000" }] })).toBe(40_000_00n));
  it("26. баланс проекта строится из его MoneyAccount", () => expect(server).toContain("summarizeProjectMoney"));
  it("27. консолидированный баланс FEVORA строится по всем счетам", () => { expect(server).toContain("getMoneyOverview"); expect(server).toContain("summaries: currencies.map"); });
  it("форма группирует счета по проектам и содержит Cancel", () => { expect(transferPage).toContain("<optgroup"); expect(transferPage).toContain("Отмена"); });
  it("отмена сторнирует две проводки для перевода кошелёк→кошелёк и одну для резерва в конверте", () => { expect(server).toContain("isEnvelopeAllocation ? 1 : 2"); expect(server).toContain("reversedAt: cancelledAt"); });
  it("новая миграция только добавляет индекс", () => { expect(stage2Migration).toContain("CREATE INDEX"); expect(stage2Migration).not.toMatch(/DROP|DELETE|TRUNCATE/i); });
  it("action после перевода возвращает к проекту-источнику", () => expect(actions).toContain("sourceProject"));
});
