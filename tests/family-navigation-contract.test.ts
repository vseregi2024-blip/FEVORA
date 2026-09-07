import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const navigation = readFileSync(new URL("../src/components/mobile-bottom-navigation.tsx", import.meta.url), "utf8");

describe("Family mobile navigation", () => {
  it("uses the five-destination Family panel", () => {
    expect(navigation).toContain('["/family/operations", "Операции"');
    expect(navigation).toContain('["/family/savings", "Накопления"');
    expect(navigation).toContain('["#family-actions", "Добавить"');
    expect(navigation).toContain('["/family/analytics", "Аналитика"');
    expect(navigation).toContain('["/family/settings", "Настройки"');
  });

  it("opens Family actions from the raised central plus without edge buttons", () => {
    expect(navigation).toContain('/family/new?type=EXPENSE');
    expect(navigation).toContain('/family/new?type=INCOME');
    expect(navigation).toContain('/family/receipts/new');
    expect(navigation).toContain('/family/recurring/new');
    expect(navigation).not.toContain('className="family-money-actions"');
    expect(navigation).not.toContain('aria-label="Быстрые операции Family"');
  });
});
