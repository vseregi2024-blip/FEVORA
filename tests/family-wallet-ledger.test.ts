import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { calculateMoneyAccountBalance } from "../src/features/money/calculations";

const db = vi.hoisted(() => ({
  category: { findFirst: vi.fn() },
  moneyAccount: { findFirst: vi.fn(), findMany: vi.fn() },
  receipt: { create: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
  transaction: { create: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn(), findMany: vi.fn() },
  moneyLedgerEntry: { create: vi.fn(), findFirst: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma: { ...db, $transaction: vi.fn((callback) => callback(db)) } }));

import { createFamilyOperation, createSplitReceipt, createVoiceFamilyOperation, softDeleteFamilyOperation, updateFamilyOperation } from "../src/server/family";

const wallet = { id: "wallet-family", userId: "user-1", projectId: "project-family", name: "Наличка в кошельке", kind: "WALLET", type: "CASH", currency: "UAH", openingBalance: new Prisma.Decimal("10000"), targetAmount: null, targetDate: null, note: null, icon: null, categoryId: null, isPrimary: true, isActive: true, sortOrder: 0, createdAt: new Date(), updatedAt: new Date() };
const baseInput = { type: "EXPENSE" as const, amount: "760", operationDate: "2026-11-20", categoryId: "category-family", accountId: wallet.id, description: "Синтетический расход" };

describe("Family operations update real wallet ledgers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.category.findFirst.mockResolvedValue({ id: baseInput.categoryId, kind: "BOTH" });
    db.moneyAccount.findFirst.mockResolvedValue(wallet);
    db.transaction.create.mockImplementation(({ data }) => Promise.resolve({ id: `transaction-${db.transaction.create.mock.calls.length}`, ...data }));
    db.moneyLedgerEntry.create.mockImplementation(({ data }) => Promise.resolve({ id: `ledger-${db.moneyLedgerEntry.create.mock.calls.length}`, reversedAt: null, ...data }));
    db.receipt.create.mockResolvedValue({ id: "receipt-1" });
    db.transaction.findUnique.mockResolvedValue(null);
  });

  it("applies the acceptance example 10 000 − 760 + 160 = 9 400", async () => {
    await createFamilyOperation("user-1", baseInput);
    await createFamilyOperation("user-1", { ...baseInput, type: "INCOME", amount: "160", description: "Синтетический доход" });

    const entries = db.moneyLedgerEntry.create.mock.calls.map(([argument]) => ({ amount: argument.data.amount.toString() }));
    expect(entries).toEqual([{ amount: "-760" }, { amount: "160" }]);
    expect(calculateMoneyAccountBalance({ openingBalance: "10000", entries })).toBe(940_000n);
    expect(db.transaction.create).toHaveBeenNthCalledWith(1, expect.objectContaining({ data: expect.objectContaining({ familyAccountId: null, moneyAccountId: wallet.id, currency: "UAH" }) }));
  });

  it("rejects another user's or archived wallet before any financial write", async () => {
    db.moneyAccount.findFirst.mockResolvedValue(null);
    await expect(createFamilyOperation("user-2", baseInput)).rejects.toThrow("активный кошелёк Family");
    expect(db.moneyAccount.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ id: wallet.id, userId: "user-2", isActive: true, kind: "WALLET" }) }));
    expect(db.transaction.create).not.toHaveBeenCalled();
    expect(db.moneyLedgerEntry.create).not.toHaveBeenCalled();
  });

  it("records split receipt parts once and subtracts exactly the declared total", async () => {
    await createSplitReceipt("user-1", { totalAmount: "760", operationDate: "2026-11-20", accountId: wallet.id, description: "Синтетический чек", items: [
      { categoryId: "category-family", amount: "400", description: "Часть 1" },
      { categoryId: "category-family", amount: "360", description: "Часть 2" },
    ] });
    const entries = db.moneyLedgerEntry.create.mock.calls.map(([argument]) => ({ amount: argument.data.amount.toString() }));
    expect(entries).toEqual([{ amount: "-400" }, { amount: "-360" }]);
    expect(calculateMoneyAccountBalance({ openingBalance: "10000", entries })).toBe(924_000n);
  });

  it("edits amount, type and wallet by updating the same active ledger entry", async () => {
    db.transaction.findFirst.mockResolvedValue({ id: "transaction-1", userId: "user-1", receiptId: null, recurringPaymentId: null });
    db.transaction.update.mockResolvedValue({ id: "transaction-1" });
    db.moneyLedgerEntry.findFirst.mockResolvedValue({ id: "ledger-1" });
    db.moneyLedgerEntry.update.mockResolvedValue({ id: "ledger-1" });

    await updateFamilyOperation("user-1", "transaction-1", { ...baseInput, type: "INCOME", amount: "250" });

    expect(db.transaction.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ type: "INCOME", amount: new Prisma.Decimal("250"), moneyAccountId: wallet.id }) }));
    expect(db.moneyLedgerEntry.update).toHaveBeenCalledWith({ where: { id: "ledger-1" }, data: expect.objectContaining({ accountId: wallet.id, type: "INCOME", amount: new Prisma.Decimal("250") }) });
    expect(db.moneyLedgerEntry.create).not.toHaveBeenCalled();
  });

  it("soft deletion reverses the ledger instead of deleting financial history", async () => {
    db.transaction.findFirst.mockResolvedValue({ id: "transaction-1", userId: "user-1", receiptId: null, recurringPaymentId: null });
    db.transaction.update.mockResolvedValue({ id: "transaction-1" });
    db.moneyLedgerEntry.updateMany.mockResolvedValue({ count: 1 });

    await softDeleteFamilyOperation("user-1", "transaction-1");

    expect(db.moneyLedgerEntry.updateMany).toHaveBeenCalledWith({ where: { userId: "user-1", transactionId: { in: ["transaction-1"] }, reversedAt: null }, data: { reversedAt: expect.any(Date) } });
    expect(db.transaction.update).toHaveBeenCalledWith({ where: { id: "transaction-1" }, data: { deletedAt: expect.any(Date) } });
  });

  it("does not create a second ledger for a repeated voice request", async () => {
    const existing = { id: "transaction-existing", moneyAccountId: wallet.id };
    db.transaction.findUnique.mockResolvedValue(existing);
    const result = await createVoiceFamilyOperation("user-1", "11111111-1111-4111-8111-111111111111", { ...baseInput, type: "INCOME" });
    expect(result).toBe(existing);
    expect(db.transaction.create).not.toHaveBeenCalled();
    expect(db.moneyLedgerEntry.create).not.toHaveBeenCalled();
  });

  it("uses the submission id to make a repeated form save idempotent", async () => {
    const requestId = "22222222-2222-4222-8222-222222222222";
    db.transaction.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: "transaction-1", moneyAccountId: wallet.id });
    await createFamilyOperation("user-1", baseInput, requestId);
    await createFamilyOperation("user-1", baseInput, requestId);
    expect(db.transaction.create).toHaveBeenCalledTimes(1);
    expect(db.moneyLedgerEntry.create).toHaveBeenCalledTimes(1);
  });
});
