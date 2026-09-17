import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  cosmetologyVisit: {
    findFirst: vi.fn(),
    updateMany: vi.fn(),
    update: vi.fn(),
    findUniqueOrThrow: vi.fn(),
  },
  transaction: { create: vi.fn() },
  cosmetologyPayment: { upsert: vi.fn() },
  cosmetologyPaymentComponent: { create: vi.fn(), aggregate: vi.fn() },
  cosmetologyWalletMovement: { create: vi.fn() },
  cosmetologyCertificate: { updateMany: vi.fn(), findFirst: vi.fn(), findUniqueOrThrow: vi.fn(), update: vi.fn() },
  cosmetologyLoyaltyDelivery: { create: vi.fn() },
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma: { $transaction: vi.fn((callback) => callback(db)) } }));
vi.mock("@/server/loyalty-delivery", () => ({
  newLoyaltyDeliveryData: (visitId: string, loyaltyClientId: string, amount: string) => ({
    visitId,
    loyaltyClientId,
    amount,
    currency: "UAH",
    status: "NOT_SENT",
    externalEventId: `fevora:appointment:${visitId}:final`,
  }),
}));

import { payCosmetologyVisit } from "../src/server/cosmetology";

const visit = (paidAmount = "0.00", loyaltyDelivery: unknown = null) => ({
  id: "visit-1",
  userId: "user-1",
  procedureName: "Чистка",
  paymentAmount: new Prisma.Decimal("1000.00"),
  paidAmount: new Prisma.Decimal(paidAmount),
  incomeTransactionId: null,
  client: { loyaltyClientId: "39" },
  loyaltyDelivery,
});

const input = (cashAmount: string, monoAmount: string, privatAmount: string, otherAmount = "0", otherComment: string | null = null, paymentTotal?: string, certificateId: string | null = null, certificateAmount = "0") => ({
  id: "visit-1",
  operationDate: "2026-09-11",
  cashAmount,
  monoAmount,
  privatAmount,
  otherAmount,
  otherComment,
  certificateId,
  certificateAmount,
  paymentTotal: paymentTotal ?? new Prisma.Decimal(cashAmount).add(monoAmount).add(privatAmount).add(otherAmount).add(certificateAmount).toFixed(2),
});

describe("completed cosmetology visit payment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.cosmetologyVisit.findFirst.mockResolvedValue(visit());
    db.cosmetologyVisit.updateMany.mockResolvedValue({ count: 1 });
    db.cosmetologyVisit.update.mockResolvedValue({});
    db.cosmetologyVisit.findUniqueOrThrow.mockResolvedValue({ ...visit(), paidAmount: new Prisma.Decimal("1000.00") });
    db.transaction.create.mockImplementation(({ data }) => Promise.resolve({ id: `transaction-${data.amount.toString()}` }));
    db.cosmetologyPayment.upsert.mockResolvedValue({ id: "payment-1" });
    db.cosmetologyPaymentComponent.create.mockImplementation(({ data }) => Promise.resolve({ id: `component-${data.method}` }));
    db.cosmetologyPaymentComponent.aggregate.mockResolvedValue({ _sum: { amount: new Prisma.Decimal("1000.00") } });
    db.cosmetologyCertificate.updateMany.mockResolvedValue({ count: 1 });
    db.cosmetologyCertificate.findUniqueOrThrow.mockResolvedValue({ remainingAmount: new Prisma.Decimal("0") });
    db.cosmetologyCertificate.update.mockResolvedValue({});
    db.cosmetologyWalletMovement.create.mockResolvedValue({});
    db.cosmetologyLoyaltyDelivery.create.mockResolvedValue({});
  });

  it("records a full cash payment and creates NOT_SENT delivery", async () => {
    await payCosmetologyVisit("user-1", input("1000", "0", "0"));

    expect(db.cosmetologyVisit.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ paidAmount: expect.any(Prisma.Decimal) }),
      data: { paidAmount: { increment: expect.any(Prisma.Decimal) } },
    }));
    expect(db.transaction.create).toHaveBeenCalledTimes(1);
    expect(db.cosmetologyWalletMovement.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ wallet: "CASH", type: "DEBT_PAYMENT" }) }));
    expect(db.cosmetologyLoyaltyDelivery.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ visitId: "visit-1", amount: "1000.00", status: "NOT_SENT" }) }));
  });

  it("supports a mixed card and cash payment without changing the total", async () => {
    await payCosmetologyVisit("user-1", input("500", "500", "0"));

    expect(db.transaction.create).toHaveBeenCalledTimes(1);
    expect(db.transaction.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ amount: new Prisma.Decimal("1000"), cosmetologyPaymentId: "payment-1" }) }));
    expect(db.cosmetologyPaymentComponent.create).toHaveBeenCalledTimes(2);
    expect(db.cosmetologyWalletMovement.create).toHaveBeenCalledTimes(2);
    const wallets = db.cosmetologyWalletMovement.create.mock.calls.map(([value]) => value.data.wallet);
    expect(wallets).toEqual(["CASH", "MONO"]);
    expect(db.cosmetologyLoyaltyDelivery.create).toHaveBeenCalledTimes(1);
  });

  it("records OTHER with a description inside the same payment", async () => {
    await payCosmetologyVisit("user-1", input("0", "0", "0", "1000", "Продажа косметики"));
    expect(db.transaction.create).toHaveBeenCalledTimes(1);
    expect(db.cosmetologyPaymentComponent.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ method: "OTHER", comment: "Продажа косметики" }) }));
    expect(db.cosmetologyWalletMovement.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ wallet: "OTHER" }) }));
  });

  it("keeps a partial payment open and does not create delivery", async () => {
    db.cosmetologyVisit.findFirst.mockResolvedValue(visit("0.00"));
    await payCosmetologyVisit("user-1", input("300", "0", "0"));
    expect(db.cosmetologyLoyaltyDelivery.create).not.toHaveBeenCalled();
  });

  it("uses a certificate without creating a wallet movement or monetary income", async () => {
    db.cosmetologyPaymentComponent.aggregate.mockResolvedValue({ _sum: { amount: new Prisma.Decimal("0") } });
    await payCosmetologyVisit("user-1", input("0", "0", "0", "0", null, "1000", "cmtvunb6v0001iipe7epcl07t", "1000"));
    expect(db.transaction.create).not.toHaveBeenCalled();
    expect(db.cosmetologyWalletMovement.create).not.toHaveBeenCalled();
    expect(db.cosmetologyPaymentComponent.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ method: "CERTIFICATE", certificateId: "cmtvunb6v0001iipe7epcl07t", transactionId: null }) }));
    expect(db.cosmetologyCertificate.updateMany).toHaveBeenCalledTimes(2);
    expect(db.cosmetologyLoyaltyDelivery.create).not.toHaveBeenCalled();
  });

  it.each([
    ["CASH", input("200", "0", "0", "0", null, "1000", "cmtvunb6v0001iipe7epcl07t", "800"), "CASH"],
    ["MONOBANK", input("0", "200", "0", "0", null, "1000", "cmtvunb6v0001iipe7epcl07t", "800"), "MONO"],
    ["PRIVATBANK", input("0", "0", "200", "0", null, "1000", "cmtvunb6v0001iipe7epcl07t", "800"), "PRIVAT"],
  ])("supports %s + CERTIFICATE as one payment", async (method, paymentInput, wallet) => {
    db.cosmetologyPaymentComponent.aggregate.mockResolvedValue({ _sum: { amount: new Prisma.Decimal("200.00") } });
    await payCosmetologyVisit("user-1", paymentInput);

    expect(db.cosmetologyPayment.upsert).toHaveBeenCalledTimes(1);
    expect(db.transaction.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ amount: new Prisma.Decimal("200") }) }));
    expect(db.cosmetologyPaymentComponent.create).toHaveBeenCalledTimes(2);
    expect(db.cosmetologyPaymentComponent.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ method, transactionId: "transaction-200" }) }));
    expect(db.cosmetologyPaymentComponent.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ method: "CERTIFICATE", certificateId: "cmtvunb6v0001iipe7epcl07t", transactionId: "transaction-200" }) }));
    expect(db.cosmetologyWalletMovement.create).toHaveBeenCalledTimes(1);
    expect(db.cosmetologyWalletMovement.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ wallet }) }));
    expect(db.cosmetologyLoyaltyDelivery.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ amount: "200.00" }) }));
  });

  it("supports CASH + MONOBANK + CERTIFICATE and counts only money as income", async () => {
    db.cosmetologyPaymentComponent.aggregate.mockResolvedValue({ _sum: { amount: new Prisma.Decimal("600.00") } });
    await payCosmetologyVisit("user-1", input("300", "300", "0", "0", null, "1000", "cmtvunb6v0001iipe7epcl07t", "400"));

    expect(db.cosmetologyVisit.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: { paidAmount: { increment: new Prisma.Decimal("1000") } } }));
    expect(db.transaction.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ amount: new Prisma.Decimal("600") }) }));
    expect(db.cosmetologyPaymentComponent.create).toHaveBeenCalledTimes(3);
    expect(db.cosmetologyWalletMovement.create).toHaveBeenCalledTimes(2);
    expect(db.cosmetologyLoyaltyDelivery.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ amount: "600.00" }) }));
  });

  it("keeps a partially used certificate ACTIVE with its remaining amount", async () => {
    db.cosmetologyCertificate.findUniqueOrThrow.mockResolvedValue({ remainingAmount: new Prisma.Decimal("3000") });
    db.cosmetologyPaymentComponent.aggregate.mockResolvedValue({ _sum: { amount: new Prisma.Decimal("0") } });
    await payCosmetologyVisit("user-1", input("0", "0", "0", "0", null, "1000", "cmtvunb6v0001iipe7epcl07t", "1000"));

    expect(db.cosmetologyCertificate.updateMany).toHaveBeenNthCalledWith(2, expect.objectContaining({
      where: expect.objectContaining({ status: "ACTIVE", remainingAmount: { gte: new Prisma.Decimal("1000") } }),
      data: { remainingAmount: { decrement: new Prisma.Decimal("1000") } },
    }));
    expect(db.cosmetologyCertificate.update).not.toHaveBeenCalled();
  });

  it("marks a certificate FULLY_USED when its remaining amount reaches zero", async () => {
    db.cosmetologyPaymentComponent.aggregate.mockResolvedValue({ _sum: { amount: new Prisma.Decimal("0") } });
    await payCosmetologyVisit("user-1", input("0", "0", "0", "0", null, "1000", "cmtvunb6v0001iipe7epcl07t", "1000"));
    expect(db.cosmetologyCertificate.update).toHaveBeenCalledWith({ where: { id: "cmtvunb6v0001iipe7epcl07t" }, data: { status: "FULLY_USED" } });
  });

  it.each([
    ["CANCELLED", "Сертификат отменён."],
    ["FULLY_USED", "Сертификат уже использован полностью."],
    ["EXPIRED", "Сертификат просрочен."],
  ])("rejects a %s certificate before payment components are created", async (status, message) => {
    db.cosmetologyCertificate.updateMany.mockResolvedValueOnce({ count: 0 }).mockResolvedValueOnce({ count: 0 });
    db.cosmetologyCertificate.findFirst.mockResolvedValue({ status, remainingAmount: new Prisma.Decimal(status === "FULLY_USED" ? "0" : "1000"), expiresAt: status === "EXPIRED" ? new Date("2026-01-01T00:00:00.000Z") : null });

    await expect(payCosmetologyVisit("user-1", input("0", "0", "0", "0", null, "1000", "cmtvunb6v0001iipe7epcl07t", "1000"))).rejects.toThrow(message);
    expect(db.cosmetologyPaymentComponent.create).not.toHaveBeenCalled();
    expect(db.cosmetologyWalletMovement.create).not.toHaveBeenCalled();
    expect(db.cosmetologyLoyaltyDelivery.create).not.toHaveBeenCalled();
  });

  it("rejects insufficient certificate balance under concurrent use", async () => {
    db.cosmetologyCertificate.updateMany.mockResolvedValueOnce({ count: 0 }).mockResolvedValueOnce({ count: 0 });
    db.cosmetologyCertificate.findFirst.mockResolvedValue({ status: "ACTIVE", remainingAmount: new Prisma.Decimal("500"), expiresAt: null });
    await expect(payCosmetologyVisit("user-1", input("0", "0", "0", "0", null, "1000", "cmtvunb6v0001iipe7epcl07t", "1000"))).rejects.toThrow("недостаточно остатка");
    expect(db.cosmetologyPaymentComponent.create).not.toHaveBeenCalled();
  });

  it("rejects zero and overpayment before financial writes", async () => {
    await expect(payCosmetologyVisit("user-1", input("0", "0", "0"))).rejects.toThrow("Укажите сумму оплаты");
    await expect(payCosmetologyVisit("user-1", input("1001", "0", "0"))).rejects.toThrow("больше остатка");
    expect(db.transaction.create).not.toHaveBeenCalled();
    expect(db.cosmetologyWalletMovement.create).not.toHaveBeenCalled();
  });

  it("blocks a concurrent duplicate before creating income", async () => {
    db.cosmetologyVisit.updateMany.mockResolvedValue({ count: 0 });
    await expect(payCosmetologyVisit("user-1", input("1000", "0", "0"))).rejects.toThrow("другим запросом");
    expect(db.transaction.create).not.toHaveBeenCalled();
    expect(db.cosmetologyWalletMovement.create).not.toHaveBeenCalled();
    expect(db.cosmetologyLoyaltyDelivery.create).not.toHaveBeenCalled();
  });
});
