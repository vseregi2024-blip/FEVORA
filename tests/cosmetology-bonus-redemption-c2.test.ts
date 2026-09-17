import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ redemption: null as Record<string, unknown> | null, paidUpdates: 0 }));
const loyalty = vi.hoisted(() => ({ post: vi.fn() }));
const MockBotClientApiError = vi.hoisted(
  () => class MockBotClientApiError extends Error {
    constructor(readonly code: string) { super(code); }
  },
);
const db = vi.hoisted(() => ({
  cosmetologyVisit: {
    findFirst: vi.fn(), updateMany: vi.fn(), update: vi.fn(), findUniqueOrThrow: vi.fn(),
  },
  cosmetologyPayment: { upsert: vi.fn() },
  cosmetologyPaymentComponent: { create: vi.fn(), aggregate: vi.fn() },
  transaction: { create: vi.fn() },
  cosmetologyWalletMovement: { create: vi.fn() },
  cosmetologyCertificate: { updateMany: vi.fn(), findFirst: vi.fn(), findUniqueOrThrow: vi.fn(), update: vi.fn() },
  cosmetologyLoyaltyDelivery: { create: vi.fn() },
  cosmetologyBonusRedemption: {
    findFirst: vi.fn(), create: vi.fn(), updateMany: vi.fn(), findUniqueOrThrow: vi.fn(), update: vi.fn(),
  },
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma: { ...db, $transaction: vi.fn((callback) => callback(db)) } }));
vi.mock("@/server/loyalty", () => ({ BotClientApiError: MockBotClientApiError, postLoyaltyBonusRedemption: loyalty.post }));
vi.mock("@/server/loyalty-delivery", () => ({ newLoyaltyDeliveryData: (visitId: string, loyaltyClientId: string, amount: string) => ({ visitId, loyaltyClientId, amount, currency: "UAH", status: "NOT_SENT", externalEventId: `fevora:appointment:${visitId}:final` }) }));

import { payCosmetologyVisit } from "../src/server/cosmetology";

const visit = () => ({
  id: "visit-1", userId: "user-1", procedureName: "Чистка", paymentAmount: new Prisma.Decimal("1000"), paidAmount: new Prisma.Decimal("0"), incomeTransactionId: null,
  client: { loyaltyClientId: "39" }, loyaltyDelivery: null,
});
const input = () => ({ id: "visit-1", operationDate: "2026-09-17", cashAmount: "500", monoAmount: "0", privatAmount: "0", otherAmount: "0", otherComment: null, certificateId: null, certificateAmount: "0", bonusAmount: "500", paymentRequestKey: "00000000-0000-4000-8000-000000000001", paymentTotal: "1000" });

describe("C2 bonus-redemption saga", () => {
  beforeEach(() => {
    vi.clearAllMocks(); state.redemption = null; state.paidUpdates = 0;
    db.cosmetologyVisit.findFirst.mockResolvedValue(visit());
    db.cosmetologyVisit.updateMany.mockImplementation(() => { state.paidUpdates++; return Promise.resolve({ count: 1 }); });
    db.cosmetologyVisit.update.mockResolvedValue({}); db.cosmetologyVisit.findUniqueOrThrow.mockResolvedValue({ id: "visit-1" });
    db.cosmetologyPayment.upsert.mockResolvedValue({ id: "payment-1" });
    db.transaction.create.mockResolvedValue({ id: "income-1" });
    db.cosmetologyPaymentComponent.create.mockImplementation(({ data }) => Promise.resolve({ id: `component-${data.method}` }));
    db.cosmetologyPaymentComponent.aggregate.mockResolvedValue({ _sum: { amount: new Prisma.Decimal("500") } });
    db.cosmetologyWalletMovement.create.mockResolvedValue({}); db.cosmetologyLoyaltyDelivery.create.mockResolvedValue({});
    db.cosmetologyBonusRedemption.findFirst.mockImplementation(({ where }) => {
      if (!state.redemption) return Promise.resolve(null);
      if (where.requestKey || where.id) return Promise.resolve(state.redemption);
      return Promise.resolve(null);
    });
    db.cosmetologyBonusRedemption.create.mockImplementation(({ data }) => { state.redemption = { id: "redemption-1", ...data, status: "PENDING", attemptCount: 0 }; return Promise.resolve(state.redemption); });
    db.cosmetologyBonusRedemption.updateMany.mockImplementation(({ data }) => { if (state.redemption) Object.assign(state.redemption, data, { attemptCount: typeof data.attemptCount === "object" ? Number((state.redemption.attemptCount as number) ?? 0) + 1 : data.attemptCount }); return Promise.resolve({ count: 1 }); });
    db.cosmetologyBonusRedemption.findUniqueOrThrow.mockImplementation(() => Promise.resolve(state.redemption));
    db.cosmetologyBonusRedemption.update.mockImplementation(({ data }) => { if (state.redemption) Object.assign(state.redemption, data); return Promise.resolve(state.redemption); });
    loyalty.post.mockResolvedValue({ status: "accepted", redemptionId: "77", externalEventId: "fevora:visit:visit-1:bonus-redemption:00000000-0000-4000-8000-000000000001", clientId: "39", amountRedeemed: 500, currency: "UAH", balanceBefore: 1000, balanceAfter: 500, bonusTransactionId: "88" });
  });

  it("creates one remote redemption and applies CASH + BONUS as one local payment", async () => {
    await payCosmetologyVisit("user-1", input());
    expect(loyalty.post).toHaveBeenCalledWith(expect.objectContaining({ amount: 500, source: "FEVORA", reference: { visit_id: "visit-1", payment_id: "payment-1" } }));
    expect(db.cosmetologyPaymentComponent.create).toHaveBeenCalledTimes(2);
    expect(db.cosmetologyPaymentComponent.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ method: "BONUS", transactionId: "income-1" }) }));
    expect(db.transaction.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ amount: new Prisma.Decimal("500") }) }));
    expect(db.cosmetologyWalletMovement.create).toHaveBeenCalledTimes(1);
    expect(state.redemption).toMatchObject({ status: "APPLIED", balanceBefore: 1000, balanceAfter: 500, remoteRedemptionId: "77" });
  });

  it("keeps the local payment unapplied after a retryable remote timeout", async () => {
    loyalty.post.mockRejectedValue(new MockBotClientApiError("TIMEOUT"));
    await expect(payCosmetologyVisit("user-1", input())).rejects.toThrow("TIMEOUT");
    expect(db.cosmetologyPaymentComponent.create).not.toHaveBeenCalled();
    expect(db.transaction.create).not.toHaveBeenCalled();
    expect(state.redemption).toMatchObject({ status: "FAILED_RETRYABLE", lastErrorCode: "TIMEOUT" });
  });

  it("rejects a BONUS amount above the procedure remainder before any remote call", async () => {
    const invalid = { ...input(), bonusAmount: "1001", paymentTotal: "1501" };
    await expect(payCosmetologyVisit("user-1", invalid)).rejects.toThrow("больше остатка");
    expect(loyalty.post).not.toHaveBeenCalled();
  });
});
