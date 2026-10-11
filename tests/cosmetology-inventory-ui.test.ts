import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync(new URL("../src/app/(private)/cosmetology/inventory/page.tsx", import.meta.url), "utf8");
const itemPage = readFileSync(new URL("../src/app/(private)/cosmetology/inventory/new/page.tsx", import.meta.url), "utf8");
const purchasePage = readFileSync(new URL("../src/app/(private)/cosmetology/inventory/purchase/page.tsx", import.meta.url), "utf8");
const purchaseForm = readFileSync(new URL("../src/components/cosmetology-purchase-form.tsx", import.meta.url), "utf8");
const detail = readFileSync(new URL("../src/app/(private)/cosmetology/inventory/[id]/page.tsx", import.meta.url), "utf8");
const adjustment = readFileSync(new URL("../src/app/(private)/cosmetology/inventory/[id]/adjust/page.tsx", import.meta.url), "utf8");

describe("cosmetology inventory compact UI", () => {
  it("keeps the main screen as search, filters, action buttons and a compact list", () => {
    for (const label of ["Поиск", "Категория", "＋ Добавить позицию", "＋ Новая закупка", "Склад сейчас"]) expect(page).toContain(label);
    expect(page).not.toContain("Ручная корректировка");
    expect(page).toContain("Заканчивается");
    expect(page).toContain("История закупок и цен");
  });

  it("opens item creation and procurement as separate short flows", () => {
    expect(itemPage).toContain("Новая позиция");
    expect(itemPage).toContain("createCosmetologyItemAction");
    expect(purchasePage).toContain("Новая закупка");
    expect(purchaseForm).toContain("Кошелёк оплаты");
    expect(purchaseForm).toContain("Резерв «На закупку»");
  });

  it("calculates procurement price and total in the form without changing the purchase action", () => {
    expect(purchaseForm).toContain("Цена за единицу");
    expect(purchaseForm).toContain("useEffect");
    expect(purchaseForm).toContain("updateUnitPrice");
    expect(purchaseForm).toContain("updateTotal");
    expect(purchaseForm).toContain('name="totalAmount"');
  });

  it("keeps inventory correction and its history inside an individual item", () => {
    expect(detail).toContain("Скорректировать остаток");
    expect(detail).toContain("Ручные корректировки");
    expect(adjustment).toContain("Инвентаризация");
    expect(adjustment).toContain("Повреждение");
    expect(adjustment).toContain("Срок годности");
  });
});
