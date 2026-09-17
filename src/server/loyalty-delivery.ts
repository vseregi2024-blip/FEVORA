import "server-only";

import { CosmetologyLoyaltyDeliveryStatus, CosmetologyPaymentMethod } from "@prisma/client";

import { assessLoyaltyPayment, buildLoyaltyPaymentPayload, loyaltyExternalEventId } from "@/features/loyalty/payment";
import { moneyToMinorUnits } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { BotClientApiError, isLoyaltyPaymentDeliveryEnabled, postLoyaltyPayment } from "@/server/loyalty";

const SENDING_LEASE_MS = 2 * 60 * 1000;

export type LoyaltyDeliveryErrorCode = "UNAUTHORIZED" | "NOT_FOUND" | "CONFLICT" | "INSUFFICIENT_BONUS" | "VALIDATION" | "RATE_LIMIT" | "UNAVAILABLE" | "TIMEOUT" | "INVALID_RESPONSE" | "NOT_ELIGIBLE";

function safeDeliveryErrorCode(error: unknown): LoyaltyDeliveryErrorCode {
  if (error instanceof BotClientApiError && error.code !== "CONFIG") return error.code;
  return error instanceof BotClientApiError ? "UNAVAILABLE" : "INVALID_RESPONSE";
}

export function isRetryableLoyaltyDeliveryError(code: string | null) {
  return code !== "CONFLICT";
}

export async function deliverLoyaltyPayment(userId: string, visitId: string) {
  if (!isLoyaltyPaymentDeliveryEnabled()) throw new Error("Передача оплат в production пока отключена.");
  const delivery = await prisma.cosmetologyLoyaltyDelivery.findFirst({
    where: { visitId, visit: { userId } },
    include: { visit: { include: { client: true, services: { orderBy: { sortOrder: "asc" } }, payment: { include: { components: { where: { method: { in: [CosmetologyPaymentMethod.CASH, CosmetologyPaymentMethod.MONOBANK, CosmetologyPaymentMethod.PRIVATBANK, CosmetologyPaymentMethod.OTHER] }, transaction: { is: { deletedAt: null } } } } } } } } },
  });
  if (!delivery) throw new Error("Оплата не подготовлена к передаче.");
  if (delivery.status === CosmetologyLoyaltyDeliveryStatus.SENT) return delivery;
  const monetaryPaidAmount = delivery.visit.payment?.components.reduce((sum, component) => sum + Number(component.amount), 0).toFixed(2) ?? "0.00";
  const candidate = {
    id: delivery.visit.id,
    status: delivery.visit.status,
    deletedAt: delivery.visit.deletedAt,
    paymentAmount: delivery.visit.paymentAmount.toString(),
    paidAmount: delivery.visit.paidAmount.toString(),
    monetaryPaidAmount,
    operationDate: delivery.visit.operationDate,
    procedureName: delivery.visit.procedureName,
    loyaltyClientId: delivery.visit.client.loyaltyClientId,
    currency: delivery.currency,
    services: delivery.visit.services.map((service) => ({ name: service.name, price: service.price.toString() })),
  };
  if (assessLoyaltyPayment(candidate) !== "READY" || candidate.loyaltyClientId !== delivery.loyaltyClientId || moneyToMinorUnits(candidate.monetaryPaidAmount) !== moneyToMinorUnits(delivery.amount.toString())) {
    throw new Error("Оплата больше не соответствует условиям программы лояльности.");
  }

  const now = new Date();
  const staleBefore = new Date(now.getTime() - SENDING_LEASE_MS);
  const claim = await prisma.cosmetologyLoyaltyDelivery.updateMany({
    where: {
      id: delivery.id,
      OR: [
        { status: { in: [CosmetologyLoyaltyDeliveryStatus.NOT_SENT, CosmetologyLoyaltyDeliveryStatus.FAILED] } },
        { status: CosmetologyLoyaltyDeliveryStatus.SENDING, lastAttemptAt: { lt: staleBefore } },
      ],
    },
    data: { status: CosmetologyLoyaltyDeliveryStatus.SENDING, attemptCount: { increment: 1 }, lastAttemptAt: now, lastErrorCode: null },
  });
  if (claim.count !== 1) throw new Error("Оплата уже передаётся другим запросом.");

  try {
    const payload = buildLoyaltyPaymentPayload(candidate);
    if (payload.external_event_id !== delivery.externalEventId) throw new Error("External event ID не совпадает с сохранённым значением.");
    const response = await postLoyaltyPayment(payload);
    if (response.externalEventId !== delivery.externalEventId || response.clientId !== delivery.loyaltyClientId || response.currency !== delivery.currency || moneyToMinorUnits(response.amount.toFixed(2)) !== moneyToMinorUnits(delivery.amount.toString())) throw new BotClientApiError("INVALID_RESPONSE");
    return await prisma.cosmetologyLoyaltyDelivery.update({
      where: { id: delivery.id },
      data: { status: CosmetologyLoyaltyDeliveryStatus.SENT, remotePaymentId: response.paymentId, sentAt: new Date(), lastErrorCode: null },
    });
  } catch (error) {
    await prisma.cosmetologyLoyaltyDelivery.update({
      where: { id: delivery.id },
      data: { status: CosmetologyLoyaltyDeliveryStatus.FAILED, lastErrorCode: safeDeliveryErrorCode(error) },
    });
    throw error;
  }
}

export function newLoyaltyDeliveryData(visitId: string, loyaltyClientId: string, amount: string) {
  return {
    visitId,
    externalEventId: loyaltyExternalEventId(visitId),
    loyaltyClientId,
    amount,
    currency: "UAH",
    status: CosmetologyLoyaltyDeliveryStatus.NOT_SENT,
  };
}
