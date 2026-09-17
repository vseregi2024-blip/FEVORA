import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { postLoyaltyBonusRedemption } from "../src/server/loyalty";

const payload = {
  external_event_id: "fevora:visit:visit-123:bonus-redemption:00000000-0000-4000-8000-000000000001",
  client_id: 39,
  amount: 500,
  currency: "UAH" as const,
  source: "FEVORA" as const,
  reference: { visit_id: "visit-123", payment_id: "payment-123" },
};

const accepted = {
  status: "accepted",
  redemption_id: 77,
  external_event_id: payload.external_event_id,
  client_id: 39,
  amount_redeemed: 500,
  currency: "UAH",
  balance_before: 1000,
  balance_after: 500,
  bonus_transaction_id: 88,
};

function jsonResponse(body: unknown, status = 201) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

describe("B3 bonus-redemption transport", () => {
  beforeEach(() => {
    process.env.BOT_CLIENT_API_URL = "https://bonus.test";
    process.env.BOT_CLIENT_API_SECRET = "test-secret";
    process.env.BOT_CLIENT_BONUS_REDEMPTIONS_ENABLED = "true";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.BOT_CLIENT_API_URL;
    delete process.env.BOT_CLIENT_API_SECRET;
    delete process.env.BOT_CLIENT_BONUS_REDEMPTIONS_ENABLED;
  });

  it("sends the exact B3 payload server-to-server and maps accepted", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(accepted));
    vi.stubGlobal("fetch", fetchMock);

    await expect(postLoyaltyBonusRedemption(payload)).resolves.toMatchObject({
      status: "accepted", redemptionId: "77", amountRedeemed: 500, balanceAfter: 500,
    });
    expect(fetchMock).toHaveBeenCalledWith("https://bonus.test/api/v1/bonus-redemptions", expect.objectContaining({ method: "POST" }));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual(payload);
    expect(fetchMock.mock.calls[0][1].headers.authorization).toBe("Bearer test-secret");
  });

  it("accepts an idempotent already_processed response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ ...accepted, status: "already_processed" }, 200)));
    await expect(postLoyaltyBonusRedemption(payload)).resolves.toMatchObject({ status: "already_processed", redemptionId: "77" });
  });

  it("maps insufficient balance separately from an idempotency conflict", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ error: { code: "INSUFFICIENT_BONUS_BALANCE" } }, 409)));
    await expect(postLoyaltyBonusRedemption(payload)).rejects.toMatchObject({ code: "INSUFFICIENT_BONUS", httpStatus: 409 });

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ error: { code: "IDEMPOTENCY_CONFLICT" } }, 409)));
    await expect(postLoyaltyBonusRedemption(payload)).rejects.toMatchObject({ code: "CONFLICT", httpStatus: 409 });
  });

  it("does not call B3 while the explicit redemption flag is disabled", async () => {
    process.env.BOT_CLIENT_BONUS_REDEMPTIONS_ENABLED = "false";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(postLoyaltyBonusRedemption(payload)).rejects.toMatchObject({ code: "CONFIG" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
