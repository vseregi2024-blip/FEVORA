import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const deliveryDb = vi.hoisted(() => ({ findFirst: vi.fn(), updateMany: vi.fn(), update: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma: { cosmetologyLoyaltyDelivery: deliveryDb } }));

import { deliverLoyaltyPayment } from "../src/server/loyalty-delivery";

const response = { status: "accepted", external_source: "FEVORA", external_event_id: "fevora:appointment:visit-123:final", payment_id: 77, client_id: 42, amount: 5000, currency: "UAH", bonus_awarded: 150, bonus_balance: 250 };
const storedDelivery = (status = "NOT_SENT") => ({
  id: "delivery-1",
  visitId: "visit-123",
  externalEventId: "fevora:appointment:visit-123:final",
  loyaltyClientId: "42",
  amount: { toString: () => "5000" },
  currency: "UAH",
  status,
  attemptCount: 0,
  lastAttemptAt: null,
  lastErrorCode: null,
  visit: {
    id: "visit-123", status: "COMPLETED", deletedAt: null, paymentAmount: { toString: () => "5000" }, paidAmount: { toString: () => "5000" },
    operationDate: new Date("2026-09-11T00:00:00.000Z"), procedureName: "Botox", client: { loyaltyClientId: "42" },
    services: [{ name: "Botox", price: { toString: () => "5000" } }],
    payment: { components: [{ amount: { toString: () => "5000" } }] },
  },
});

function jsonResponse(body: unknown, status = 201) { return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } }); }

describe("F3 delivery integration against mock Bot Client", () => {
  beforeEach(() => {
    process.env.BOT_CLIENT_API_URL = "https://bonus.test";
    process.env.BOT_CLIENT_API_SECRET = "server-secret";
    process.env.BOT_CLIENT_PAYMENTS_ENABLED = "true";
    deliveryDb.findFirst.mockReset().mockResolvedValue(storedDelivery());
    deliveryDb.updateMany.mockReset().mockResolvedValue({ count: 1 });
    deliveryDb.update.mockReset().mockImplementation(({ data }) => Promise.resolve({ ...storedDelivery(data.status), ...data }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.BOT_CLIENT_API_URL;
    delete process.env.BOT_CLIENT_API_SECRET;
    delete process.env.BOT_CLIENT_PAYMENTS_ENABLED;
  });

  it("moves success to SENT without writing FEVORA finance", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(response));
    vi.stubGlobal("fetch", fetchMock);
    await deliverLoyaltyPayment("user-1", "visit-123");
    expect(deliveryDb.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "SENDING", attemptCount: { increment: 1 } }) }));
    expect(deliveryDb.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "SENT", remotePaymentId: "77", lastErrorCode: null }) }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(Object.keys(deliveryDb)).toEqual(["findFirst", "updateMany", "update"]);
  });

  it("treats already_processed as SENT", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ ...response, status: "already_processed" }, 200)));
    await deliverLoyaltyPayment("user-1", "visit-123");
    expect(deliveryDb.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "SENT", remotePaymentId: "77" }) }));
  });

  it.each([[409, "CONFLICT"], [401, "UNAUTHORIZED"], [404, "NOT_FOUND"], [429, "RATE_LIMIT"], [500, "UNAVAILABLE"], [503, "UNAVAILABLE"]])("maps HTTP %i to FAILED/%s", async (status, code) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ error: { code } }, status)));
    await expect(deliverLoyaltyPayment("user-1", "visit-123")).rejects.toBeTruthy();
    expect(deliveryDb.update).toHaveBeenCalledWith(expect.objectContaining({ data: { status: "FAILED", lastErrorCode: code } }));
  });

  it("maps timeout to FAILED and retains the same event ID", async () => {
    const fetchMock = vi.fn().mockRejectedValue(Object.assign(new Error("socket"), { name: "TimeoutError" }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(deliverLoyaltyPayment("user-1", "visit-123")).rejects.toBeTruthy();
    expect(deliveryDb.update).toHaveBeenCalledWith(expect.objectContaining({ data: { status: "FAILED", lastErrorCode: "TIMEOUT" } }));
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.external_event_id).toBe("fevora:appointment:visit-123:final");
  });

  it("allows only one concurrent claimant", async () => {
    deliveryDb.updateMany.mockResolvedValue({ count: 0 });
    const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
    await expect(deliverLoyaltyPayment("user-1", "visit-123")).rejects.toThrow("другим запросом");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not POST while the production safety flag is disabled", async () => {
    process.env.BOT_CLIENT_PAYMENTS_ENABLED = "false";
    const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
    await expect(deliverLoyaltyPayment("user-1", "visit-123")).rejects.toThrow("отключена");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(deliveryDb.findFirst).not.toHaveBeenCalled();
  });
});
