import { minorUnitsToMoney, moneyToMinorUnits } from "@/lib/money";

import type { LoyaltyPaymentPayload, LoyaltyPaymentService } from "./types";

export type LoyaltyPaymentCandidate = {
  id: string;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  deletedAt: Date | null;
  paymentAmount: string;
  paidAmount: string;
  monetaryPaidAmount: string;
  operationDate: Date;
  procedureName: string;
  loyaltyClientId: string | null;
  currency: string;
  services: Array<{ name: string; price: string }>;
};

export type LoyaltyEligibilityReason = "READY" | "NOT_COMPLETED" | "NOT_FULLY_PAID" | "NO_LOYALTY_CLIENT" | "INVALID_AMOUNT" | "INVALID_CLIENT_ID" | "UNSUPPORTED_CURRENCY";

export function loyaltyExternalEventId(visitId: string) {
  return `fevora:appointment:${visitId}:final`;
}

export function assessLoyaltyPayment(candidate: LoyaltyPaymentCandidate): LoyaltyEligibilityReason {
  if (candidate.deletedAt || candidate.status !== "COMPLETED") return "NOT_COMPLETED";
  if (!candidate.loyaltyClientId) return "NO_LOYALTY_CLIENT";
  if (!/^\d+$/.test(candidate.loyaltyClientId) || Number(candidate.loyaltyClientId) <= 0) return "INVALID_CLIENT_ID";
  if (candidate.currency !== "UAH") return "UNSUPPORTED_CURRENCY";
  const paid = moneyToMinorUnits(candidate.paidAmount);
  const monetaryPaid = moneyToMinorUnits(candidate.monetaryPaidAmount);
  const expected = moneyToMinorUnits(candidate.paymentAmount);
  if (expected <= 0n) return "INVALID_AMOUNT";
  if (paid !== expected) return "NOT_FULLY_PAID";
  if (paid <= 0n || monetaryPaid <= 0n || monetaryPaid > paid) return "INVALID_AMOUNT";
  return "READY";
}

export function allocateLoyaltyServiceAmounts(services: Array<{ name: string; price: string }>, totalAmount: string, fallbackName: string): LoyaltyPaymentService[] {
  const total = moneyToMinorUnits(totalAmount);
  if (total <= 0n) throw new Error("Сумма оплаты должна быть больше нуля.");
  const positive = services.map((service) => ({ name: service.name.trim(), amount: moneyToMinorUnits(service.price) })).filter((service) => service.name && service.amount > 0n);
  const basis = positive.reduce((sum, service) => sum + service.amount, 0n);
  if (!positive.length || basis <= 0n) return [{ name: fallbackName.trim() || "FEVORA procedure", amount: Number(total) / 100 }];

  let allocated = 0n;
  return positive.map((service, index) => {
    const amount = index === positive.length - 1 ? total - allocated : service.amount * total / basis;
    allocated += amount;
    return { name: service.name, amount: Number(minorUnitsToMoney(amount)) };
  }).filter((service) => service.amount > 0);
}

export function buildLoyaltyPaymentPayload(candidate: LoyaltyPaymentCandidate): LoyaltyPaymentPayload {
  const reason = assessLoyaltyPayment(candidate);
  if (reason !== "READY") throw new Error(`Loyalty payment is not eligible: ${reason}`);
  const amount = Number(minorUnitsToMoney(moneyToMinorUnits(candidate.monetaryPaidAmount)));
  return {
    external_source: "FEVORA",
    external_event_id: loyaltyExternalEventId(candidate.id),
    loyalty_client_id: Number(candidate.loyaltyClientId),
    appointment_id: candidate.id,
    amount,
    currency: "UAH",
    payment_date: candidate.operationDate.toISOString(),
    services: allocateLoyaltyServiceAmounts(candidate.services, candidate.monetaryPaidAmount, candidate.procedureName),
    comment: "FEVORA completed procedure",
  };
}
