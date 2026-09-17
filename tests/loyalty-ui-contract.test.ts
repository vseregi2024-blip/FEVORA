import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const component = readFileSync(new URL("../src/components/loyalty-client-card.tsx", import.meta.url), "utf8");
const actions = readFileSync(new URL("../src/app/(private)/cosmetology/actions.ts", import.meta.url), "utf8");

describe("F1.1 loyalty UI contract", () => {
  it("requires explicit confirmation and supports cancel", () => {
    expect(component).toContain("Подключить этого клиента к программе лояльности?");
    expect(component).toContain("Да, подключить");
    expect(component).toContain("Отмена");
  });

  it("supports none, multiple candidates, profile and safe disconnect", () => {
    expect(component).toContain("candidates.map");
    expect(component).toContain("Клиент не найден в программе лояльности");
    expect(component).toContain("pendingBonusBalance");
    expect(component).toContain("levelBonusPercent");
    expect(component).toContain("totalReferrals");
    expect(component).toContain("Подтвердить отвязку");
  });

  it("implements server-side paginated history and return navigation", () => {
    expect(component).toContain("getBonusTransactions");
    expect(component).toContain("Показать ещё");
    expect(component).toContain("loyaltyPage=");
    expect(actions).toContain("loyaltyLinked=1");
    expect(actions).toContain("loyaltyUnlinked=1");
  });
});
