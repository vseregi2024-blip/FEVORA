import "server-only";

import { randomUUID } from "node:crypto";
import { z } from "zod";

import type { LoyaltyBonusHistoryPage, LoyaltyBonusRedemptionPayload, LoyaltyBonusRedemptionResponse, LoyaltyClientSummary, LoyaltyPaymentPayload, LoyaltyPaymentResponse, LoyaltyProfile } from "@/features/loyalty/types";
import { prisma } from "@/lib/prisma";

export type BotClientErrorCode = "CONFIG" | "UNAUTHORIZED" | "NOT_FOUND" | "CONFLICT" | "INSUFFICIENT_BONUS" | "VALIDATION" | "RATE_LIMIT" | "UNAVAILABLE" | "TIMEOUT" | "INVALID_RESPONSE";

const errorMessages: Record<BotClientErrorCode, string> = {
  CONFIG: "Интеграция с программой лояльности пока не настроена.",
  UNAUTHORIZED: "Нет доступа к программе лояльности.",
  NOT_FOUND: "Клиент не найден в программе лояльности.",
  CONFLICT: "Эта операция уже была передана с другими данными.",
  INSUFFICIENT_BONUS: "Недостаточно бонусов.",
  VALIDATION: "Некорректные данные оплаты.",
  RATE_LIMIT: "Слишком много запросов. Попробуйте немного позже.",
  UNAVAILABLE: "Программа лояльности временно недоступна.",
  TIMEOUT: "Не удалось получить данные программы лояльности.",
  INVALID_RESPONSE: "Не удалось получить данные программы лояльности.",
};

export class BotClientApiError extends Error {
  constructor(public readonly code: BotClientErrorCode, public readonly httpStatus?: number) {
    super(errorMessages[code]);
    this.name = "BotClientApiError";
  }
}

const externalIdSchema = z.union([z.string(), z.number()]).transform(String);
const nullableExternalIdSchema = z.union([z.string(), z.number()]).nullable().transform((value) => value == null ? null : String(value));

const rawClientSchema = z.object({
  id: externalIdSchema,
  first_name: z.string().nullish().transform((value) => value ?? ""),
  last_name: z.string().nullish().transform((value) => value ?? ""),
  full_name: z.string().nullish().transform((value) => value ?? ""),
  phone: z.string().nullish().transform((value) => value ?? ""),
  instagram_login: z.string().nullish().transform((value) => value ?? ""),
  telegram_id: nullableExternalIdSchema,
  telegram_connected: z.boolean(),
  is_registered: z.boolean(),
});

const rawProfileSchema = z.object({
  client_id: externalIdSchema,
  bonus_balance: z.number(),
  pending_bonus_balance: z.number(),
  level_name: z.string().nullish().transform((value) => value ?? "—"),
  level_bonus_percent: z.number(),
  manual_level_percent: z.number().nullable(),
  total_spent: z.number(),
  total_referrals: z.number().int().nonnegative(),
  referral_code: z.string().nullish().transform((value) => value ?? ""),
  referred_by_client_id: nullableExternalIdSchema,
  telegram_connected: z.boolean(),
});

const rawTransactionSchema = z.object({
  id: externalIdSchema,
  amount: z.number(),
  type: z.string(),
  description: z.string().nullish().transform((value) => value ?? ""),
  created_at: z.string(),
});

const rawSearchSchema = z.object({ items: z.array(rawClientSchema), total: z.number().int().nonnegative() });
const rawHistorySchema = z.object({
  items: z.array(rawTransactionSchema),
  page: z.number().int().positive(),
  limit: z.number().int().positive().max(100),
  total: z.number().int().nonnegative(),
});

const rawPaymentResponseSchema = z.object({
  status: z.enum(["accepted", "already_processed"]),
  external_source: z.literal("FEVORA"),
  external_event_id: z.string(),
  payment_id: externalIdSchema,
  client_id: externalIdSchema,
  amount: z.number(),
  currency: z.literal("UAH"),
  bonus_awarded: z.number(),
  bonus_balance: z.number(),
});
const rawBonusRedemptionResponseSchema = z.object({
  status: z.enum(["accepted", "already_processed"]),
  redemption_id: externalIdSchema,
  external_event_id: z.string(),
  client_id: externalIdSchema,
  amount_redeemed: z.number(),
  currency: z.literal("UAH"),
  balance_before: z.number(),
  balance_after: z.number(),
  bonus_transaction_id: externalIdSchema,
});

function integrationConfig() {
  const baseUrl = process.env.BOT_CLIENT_API_URL?.trim().replace(/\/+$/, "");
  const apiSecret = process.env.BOT_CLIENT_API_SECRET?.trim();
  if (!baseUrl || !apiSecret) throw new BotClientApiError("CONFIG");
  return { baseUrl, apiSecret };
}

async function requestBotClient(path: string, init?: Pick<RequestInit, "method" | "body">, logContext?: { appointmentId: string; externalEventId: string }): Promise<unknown> {
  const { baseUrl, apiSecret } = integrationConfig();
  const requestId = randomUUID();
  const startedAt = Date.now();

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      headers: {
        accept: "application/json",
        authorization: `Bearer ${apiSecret}`,
        "content-type": "application/json",
        "x-request-id": requestId,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(7000),
      ...init,
    });

    if (response.status === 401) throw new BotClientApiError("UNAUTHORIZED", response.status);
    if (response.status === 404) throw new BotClientApiError("NOT_FOUND", response.status);
    if (response.status === 409) {
      const body = await response.clone().json().catch(() => null) as { error?: { code?: string } } | null;
      throw new BotClientApiError(body?.error?.code === "INSUFFICIENT_BONUS_BALANCE" ? "INSUFFICIENT_BONUS" : "CONFLICT", response.status);
    }
    if (response.status === 400 || response.status === 422) throw new BotClientApiError("VALIDATION", response.status);
    if (response.status === 429) throw new BotClientApiError("RATE_LIMIT", response.status);
    if (response.status >= 500) throw new BotClientApiError("UNAVAILABLE", response.status);
    if (!response.ok) throw new BotClientApiError("INVALID_RESPONSE", response.status);

    if (logContext) console.info("Bot Client API request", { requestId, ...logContext, httpStatus: response.status, responseTimeMs: Date.now() - startedAt });

    try {
      return await response.json();
    } catch {
      throw new BotClientApiError("INVALID_RESPONSE");
    }
  } catch (error) {
    if (error instanceof BotClientApiError) {
      if (logContext) console.error("Bot Client API request failed", { requestId, ...logContext, code: error.code, httpStatus: error.httpStatus, responseTimeMs: Date.now() - startedAt });
      throw error;
    }
    const code: BotClientErrorCode = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError") ? "TIMEOUT" : "UNAVAILABLE";
    console.error("Bot Client API request failed", { requestId, ...logContext, code, responseTimeMs: Date.now() - startedAt });
    throw new BotClientApiError(code);
  }
}

export function isLoyaltyPaymentDeliveryEnabled() {
  return process.env.BOT_CLIENT_PAYMENTS_ENABLED === "true";
}

export function isLoyaltyBonusRedemptionEnabled() {
  return process.env.BOT_CLIENT_BONUS_REDEMPTIONS_ENABLED === "true";
}

export async function postLoyaltyPayment(payload: LoyaltyPaymentPayload): Promise<LoyaltyPaymentResponse> {
  if (!isLoyaltyPaymentDeliveryEnabled()) throw new BotClientApiError("CONFIG");
  const raw = parseResponse(rawPaymentResponseSchema, await requestBotClient("/api/v1/payments", {
    method: "POST",
    body: JSON.stringify(payload),
  }, { appointmentId: payload.appointment_id, externalEventId: payload.external_event_id }));
  return {
    status: raw.status,
    externalSource: raw.external_source,
    externalEventId: raw.external_event_id,
    paymentId: raw.payment_id,
    clientId: raw.client_id,
    amount: raw.amount,
    currency: raw.currency,
    bonusAwarded: raw.bonus_awarded,
    bonusBalance: raw.bonus_balance,
  };
}

export async function postLoyaltyBonusRedemption(payload: LoyaltyBonusRedemptionPayload): Promise<LoyaltyBonusRedemptionResponse> {
  if (!isLoyaltyBonusRedemptionEnabled()) throw new BotClientApiError("CONFIG");
  const raw = parseResponse(rawBonusRedemptionResponseSchema, await requestBotClient("/api/v1/bonus-redemptions", {
    method: "POST",
    body: JSON.stringify(payload),
  }, { appointmentId: payload.reference.visit_id, externalEventId: payload.external_event_id }));
  return {
    status: raw.status,
    redemptionId: raw.redemption_id,
    externalEventId: raw.external_event_id,
    clientId: raw.client_id,
    amountRedeemed: raw.amount_redeemed,
    currency: raw.currency,
    balanceBefore: raw.balance_before,
    balanceAfter: raw.balance_after,
    bonusTransactionId: raw.bonus_transaction_id,
  };
}

function parseResponse<TSchema extends z.ZodTypeAny>(schema: TSchema, payload: unknown): z.output<TSchema> {
  const result = schema.safeParse(payload);
  if (!result.success) throw new BotClientApiError("INVALID_RESPONSE");
  return result.data;
}

function mapClient(raw: z.infer<typeof rawClientSchema>): LoyaltyClientSummary {
  return {
    id: raw.id,
    firstName: raw.first_name,
    lastName: raw.last_name,
    fullName: raw.full_name,
    phone: raw.phone,
    instagram: raw.instagram_login,
    telegramId: raw.telegram_id,
    telegramConnected: raw.telegram_connected,
    registered: raw.is_registered,
  };
}

export async function searchClientsByPhone(phone: string): Promise<LoyaltyClientSummary[]> {
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("0")) digits = `38${digits}`;
  if (digits.length < 4) return [];
  const raw = parseResponse(rawSearchSchema, await requestBotClient(`/api/v1/clients/search?phone=${encodeURIComponent(digits)}`));
  return raw.items.map(mapClient);
}

export async function getClient(clientId: string): Promise<LoyaltyClientSummary> {
  const raw = parseResponse(rawClientSchema, await requestBotClient(`/api/v1/clients/${encodeURIComponent(clientId)}`));
  return mapClient(raw);
}

export async function getLoyaltyProfile(clientId: string): Promise<LoyaltyProfile> {
  const raw = parseResponse(rawProfileSchema, await requestBotClient(`/api/v1/clients/${encodeURIComponent(clientId)}/loyalty-profile`));
  return {
    clientId: raw.client_id,
    bonusBalance: raw.bonus_balance,
    pendingBonusBalance: raw.pending_bonus_balance,
    levelName: raw.level_name,
    levelBonusPercent: raw.level_bonus_percent,
    manualLevelPercent: raw.manual_level_percent,
    totalSpent: raw.total_spent,
    totalReferrals: raw.total_referrals,
    referralCode: raw.referral_code,
    referredByClientId: raw.referred_by_client_id,
    telegramConnected: raw.telegram_connected,
  };
}

export async function getBonusTransactions(clientId: string, page = 1, limit = 10): Promise<LoyaltyBonusHistoryPage> {
  const safePage = Math.max(1, Math.trunc(page));
  const safeLimit = Math.max(1, Math.min(100, Math.trunc(limit)));
  const raw = parseResponse(rawHistorySchema, await requestBotClient(`/api/v1/clients/${encodeURIComponent(clientId)}/bonus-transactions?page=${safePage}&limit=${safeLimit}`));
  return {
    items: raw.items.map((item) => ({ id: item.id, amount: item.amount, type: item.type, description: item.description, createdAt: item.created_at })),
    page: raw.page,
    limit: raw.limit,
    total: raw.total,
    hasMore: raw.page * raw.limit < raw.total,
  };
}

export async function linkLoyaltyClient(userId: string, clientId: string, loyaltyClientId: string) {
  const client = await prisma.cosmetologyClient.findFirst({ where: { id: clientId, userId, deletedAt: null } });
  if (!client) throw new Error("Клиент FEVORA не найден.");

  await Promise.all([getClient(loyaltyClientId), getLoyaltyProfile(loyaltyClientId)]);
  const occupied = await prisma.cosmetologyClient.findFirst({ where: { loyaltyClientId, NOT: { id: clientId } }, select: { id: true } });
  if (occupied) throw new Error("Этот клиент программы лояльности уже подключён к другой карточке.");

  return prisma.cosmetologyClient.update({ where: { id: clientId }, data: { loyaltyClientId } });
}

export async function unlinkLoyaltyClient(userId: string, clientId: string) {
  const client = await prisma.cosmetologyClient.findFirst({ where: { id: clientId, userId, deletedAt: null } });
  if (!client) throw new Error("Клиент FEVORA не найден.");
  return prisma.cosmetologyClient.update({ where: { id: clientId }, data: { loyaltyClientId: null } });
}
