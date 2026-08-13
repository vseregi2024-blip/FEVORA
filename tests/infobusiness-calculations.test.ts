import { describe, expect, it } from "vitest";

import { filterInfoOperations, groupInfoExpenses, infoOverallResult, infoProductResult } from "../src/features/infobusiness/calculations";

const sales = [{ productId: "online", amount: "500.00", seats: 1, operationDate: "2026-08-10" }, { productId: "offline", amount: "700.00", seats: 2, operationDate: "2026-08-11" }, { productId: "online", amount: "300.00", seats: 1, operationDate: "2026-08-12", deleted: true }];
const expenses = [{ productId: "online", categoryId: "ads", categoryName: "Реклама", amount: "150.00", operationDate: "2026-08-10" }, { productId: "online", categoryId: "edit", categoryName: "Монтаж", amount: "50.00", operationDate: "2026-08-11" }, { productId: null, categoryId: "services", categoryName: "Сервисы и подписки", serviceName: "ChatGPT", amount: "30.00", operationDate: "2026-08-12" }, { productId: null, categoryId: "services", categoryName: "Сервисы и подписки", serviceName: "Canva", amount: "20.00", operationDate: "2026-08-13", deleted: true }];

describe("infobusiness calculations", () => {
  it("counts income for an online product", () => expect(infoProductResult("online", sales, expenses).income).toBe("500.00"));
  it("counts an offline product", () => expect(infoProductResult("offline", sales, expenses).income).toBe("700.00"));
  it("keeps the number of sold seats", () => expect(infoProductResult("offline", sales, expenses).sales).toBe(2));
  it("calculates linked product expense", () => expect(infoProductResult("online", sales, expenses).expense).toBe("200.00"));
  it("does not include a general expense in product expense", () => expect(infoProductResult("online", sales, expenses).expense).toBe("200.00"));
  it("calculates product profit", () => expect(infoProductResult("online", sales, expenses).profit).toBe("300.00"));
  it("excludes deleted sales", () => expect(infoOverallResult(sales, expenses).income).toBe("1200.00"));
  it("excludes deleted expenses", () => expect(infoOverallResult(sales, expenses).expense).toBe("230.00"));
  it("includes general expense in overall result", () => expect(infoOverallResult(sales, expenses).profit).toBe("970.00"));
  it("groups advertising by category", () => expect(groupInfoExpenses(expenses, "category")).toContainEqual({ name: "Реклама", amount: "150.00" }));
  it("groups a custom category", () => expect(groupInfoExpenses(expenses, "category")).toContainEqual({ name: "Монтаж", amount: "50.00" }));
  it("preserves historical category grouping", () => expect(groupInfoExpenses(expenses, "category")).toContainEqual({ name: "Сервисы и подписки", amount: "30.00" }));
  it("groups services by service name", () => expect(groupInfoExpenses(expenses, "service")).toEqual([{ name: "ChatGPT", amount: "30.00" }]));
  it("does not invent a service group", () => expect(groupInfoExpenses(expenses.slice(0, 2), "service")).toEqual([]));
  it("filters a period from a day", () => expect(filterInfoOperations(sales, { from: "2026-08-11" })).toHaveLength(2));
  it("filters a period to a day", () => expect(filterInfoOperations(sales, { to: "2026-08-10" })).toHaveLength(1));
  it("filters by product", () => expect(filterInfoOperations([...sales.map((sale) => ({ ...sale, productId: sale.productId })), ...expenses], { productId: "online" })).toHaveLength(4));
  it("keeps product expenses separate after reassignment", () => expect(infoProductResult("offline", sales, [...expenses, { ...expenses[0], productId: "offline", amount: "10.00" }]).expense).toBe("10.00"));
  it("supports moving an expense to general", () => expect(infoProductResult("online", sales, [{ ...expenses[0], productId: null }]).expense).toBe("0.00"));
  it("uses exact two-decimal money", () => expect(infoOverallResult([{ productId: "online", amount: "0.10", seats: 1, operationDate: "2026-08-10" }, { productId: "online", amount: "0.20", seats: 1, operationDate: "2026-08-10" }], []).income).toBe("0.30"));
});
