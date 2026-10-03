import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const navigation = readFileSync(new URL("../src/components/mobile-bottom-navigation.tsx", import.meta.url), "utf8");

describe("IMPERIA mobile navigation", () => {
  it("uses the five-destination IMPERIA panel", () => {
    expect(navigation).toContain('["/family", "Дом"');
    expect(navigation).toContain('["/cosmetology/clients", "Клиенты"');
    expect(navigation).toContain('["#imperia-actions", "Добавить"');
    expect(navigation).toContain('["/safe", "Сейф"');
    expect(navigation).toContain('["/family/settings", "Настройки"');
  });

  it("opens IMPERIA actions from the raised central plus without edge buttons", () => {
    expect(navigation).toContain('/cosmetology/visits');
    expect(navigation).toContain('/cosmetology/clients/new');
    expect(navigation).toContain('/family/new?type=EXPENSE');
    expect(navigation).toContain('/family/new?type=INCOME');
    expect(navigation).toContain('/family/receipts/new');
    expect(navigation).toContain('/family/recurring/new');
    expect(navigation).not.toContain('className="family-money-actions"');
    expect(navigation).not.toContain('aria-label="Быстрые операции Family"');
  });
});
