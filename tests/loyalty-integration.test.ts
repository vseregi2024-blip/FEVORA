import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({ findFirst: vi.fn(), update: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma: { cosmetologyClient: prismaMock } }));

import { BotClientApiError, getBonusTransactions, getClient, getLoyaltyProfile, linkLoyaltyClient, searchClientsByPhone, unlinkLoyaltyClient } from "../src/server/loyalty";

const rawClient = { id: 42, first_name: "Анна", last_name: "Иванова", full_name: "Анна Иванова", phone: "+380501234567", instagram_login: "anna", telegram_id: 100, telegram_connected: true, is_registered: true };
const rawProfile = { client_id: 42, bonus_balance: 850, pending_bonus_balance: 50, level_name: "Gold", level_bonus_percent: 5, manual_level_percent: null, total_spent: 12000, total_referrals: 3, referral_code: "REF42", referred_by_client_id: null, telegram_connected: true };
const rawTransaction = { id: 7, amount: 100, type: "registration_bonus", description: "Регистрация", created_at: "2026-09-10T12:00:00Z" };

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

describe("Bot Client read-only API client", () => {
  beforeEach(() => {
    process.env.BOT_CLIENT_API_URL = "https://bonus.test/";
    process.env.BOT_CLIENT_API_SECRET = "server-secret";
    prismaMock.findFirst.mockReset();
    prismaMock.update.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.BOT_CLIENT_API_URL;
    delete process.env.BOT_CLIENT_API_SECRET;
  });

  it("performs a valid search with normalized phone and server-side Bearer auth", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ items: [rawClient], total: 1 }));
    vi.stubGlobal("fetch", fetchMock);
    const clients = await searchClientsByPhone("+38 (050) 123-45-67");
    expect(clients[0]).toMatchObject({ id: "42", fullName: "Анна Иванова", telegramConnected: true });
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("https://bonus.test/api/v1/clients/search?phone=380501234567");
    expect(options.headers.authorization).toBe("Bearer server-secret");
    expect(options.headers["x-request-id"]).toEqual(expect.any(String));
    expect(url).not.toContain("server-secret");
    expect(options.cache).toBe("no-store");
    expect(options.method).toBeUndefined();
  });

  it("supports one, multiple and no search candidates", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(jsonResponse({ items: [rawClient], total: 1 }))
      .mockResolvedValueOnce(jsonResponse({ items: [rawClient, { ...rawClient, id: 43 }], total: 2 }))
      .mockResolvedValueOnce(jsonResponse({ items: [], total: 0 })));
    expect(await searchClientsByPhone("1234")).toHaveLength(1);
    expect(await searchClientsByPhone("1234")).toHaveLength(2);
    expect(await searchClientsByPhone("1234")).toEqual([]);
  });

  it("normalizes a local Ukrainian phone to the Bot Client format", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ items: [rawClient], total: 1 }));
    vi.stubGlobal("fetch", fetchMock);
    await searchClientsByPhone("098 106 17 53");
    expect(fetchMock.mock.calls[0][0]).toContain("phone=380981061753");
  });

  it("reads and validates the client and loyalty profile", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(jsonResponse(rawClient)).mockResolvedValueOnce(jsonResponse(rawProfile)));
    expect(await getClient("42")).toMatchObject({ id: "42", instagram: "anna" });
    expect(await getLoyaltyProfile("42")).toMatchObject({ clientId: "42", bonusBalance: 850, pendingBonusBalance: 50, levelName: "Gold", levelBonusPercent: 5, totalReferrals: 3, totalSpent: 12000 });
  });

  it("reads paginated and empty bonus history and clamps limit to 100", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ items: [rawTransaction], page: 2, limit: 100, total: 201 }))
      .mockResolvedValueOnce(jsonResponse({ items: [], page: 1, limit: 10, total: 0 }));
    vi.stubGlobal("fetch", fetchMock);
    const page = await getBonusTransactions("42", 2, 500);
    expect(page).toMatchObject({ page: 2, limit: 100, total: 201, hasMore: true });
    expect(page.items[0]).toMatchObject({ id: "7", amount: 100, createdAt: rawTransaction.created_at });
    expect(fetchMock.mock.calls[0][0]).toContain("page=2&limit=100");
    expect((await getBonusTransactions("42", 1, 10)).items).toEqual([]);
  });

  it.each([
    [401, "UNAUTHORIZED", "Нет доступа к программе лояльности."],
    [404, "NOT_FOUND", "Клиент не найден в программе лояльности."],
    [429, "RATE_LIMIT", "Слишком много запросов. Попробуйте немного позже."],
    [500, "UNAVAILABLE", "Программа лояльности временно недоступна."],
    [503, "UNAVAILABLE", "Программа лояльности временно недоступна."],
  ])("maps HTTP %i to a safe error", async (status, code, message) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ error: "upstream detail" }, status)));
    await expect(getLoyaltyProfile("42")).rejects.toMatchObject({ code, message });
  });

  it("maps timeout without exposing internals", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(Object.assign(new Error("socket details"), { name: "TimeoutError" })));
    await expect(getLoyaltyProfile("42")).rejects.toMatchObject({ code: "TIMEOUT", message: "Не удалось получить данные программы лояльности." });
  });

  it("rejects malformed JSON and malformed response schemas", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(new Response("not-json", { status: 200 })).mockResolvedValueOnce(jsonResponse({ bonus_balance: "850" })));
    await expect(getLoyaltyProfile("42")).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
    await expect(getLoyaltyProfile("42")).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  });

  it("fails safely when server-side configuration is absent", async () => {
    delete process.env.BOT_CLIENT_API_URL;
    await expect(getLoyaltyProfile("42")).rejects.toBeInstanceOf(BotClientApiError);
    await expect(getLoyaltyProfile("42")).rejects.toMatchObject({ code: "CONFIG" });
  });
});

describe("manual loyalty linking and financial isolation", () => {
  beforeEach(() => {
    process.env.BOT_CLIENT_API_URL = "https://bonus.test";
    process.env.BOT_CLIENT_API_SECRET = "server-secret";
    prismaMock.findFirst.mockReset();
    prismaMock.update.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.BOT_CLIENT_API_URL;
    delete process.env.BOT_CLIENT_API_SECRET;
  });

  it("connects only after remote validation and changes only loyaltyClientId", async () => {
    prismaMock.findFirst.mockResolvedValueOnce({ id: "fevora-1", userId: "user-1" }).mockResolvedValueOnce(null);
    prismaMock.update.mockResolvedValue({ id: "fevora-1", loyaltyClientId: "42" });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(jsonResponse(rawClient)).mockResolvedValueOnce(jsonResponse(rawProfile)));
    await linkLoyaltyClient("user-1", "fevora-1", "42");
    expect(prismaMock.update).toHaveBeenCalledWith({ where: { id: "fevora-1" }, data: { loyaltyClientId: "42" } });
  });

  it("rejects a duplicate loyaltyClientId", async () => {
    prismaMock.findFirst.mockResolvedValueOnce({ id: "fevora-1", userId: "user-1" }).mockResolvedValueOnce({ id: "fevora-2" });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(jsonResponse(rawClient)).mockResolvedValueOnce(jsonResponse(rawProfile)));
    await expect(linkLoyaltyClient("user-1", "fevora-1", "42")).rejects.toThrow("уже подключён");
    expect(prismaMock.update).not.toHaveBeenCalled();
  });

  it("disconnects and never writes finance models", async () => {
    prismaMock.findFirst.mockResolvedValue({ id: "fevora-1", userId: "user-1", loyaltyClientId: "42" });
    prismaMock.update.mockResolvedValue({ id: "fevora-1", loyaltyClientId: null });
    await unlinkLoyaltyClient("user-1", "fevora-1");
    expect(Object.keys(prismaMock)).toEqual(["findFirst", "update"]);
    expect(prismaMock.update).toHaveBeenCalledWith({ where: { id: "fevora-1" }, data: { loyaltyClientId: null } });
  });
});
