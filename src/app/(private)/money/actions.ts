"use server";

import { FinanceModule, MoneyAccountKind, MoneyAccountType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/server/auth";
import { cancelInternalTransfer, createInternalAllocation, createMoneyAccount, deleteUnusedMoneyAccount, getMoneyAccount, setMoneyAccountActive, updateMoneyAccount } from "@/server/money";

const text = (data: FormData, key: string) => typeof data.get(key) === "string" ? String(data.get(key)) : "";
const optional = (data: FormData, key: string) => text(data, key).trim() || null;
const refresh = () => ["/family", "/money", "/safe", "/capital", "/money/envelopes", "/money/transfers", "/analytics", "/settings", "/family/settings/money"].forEach((path) => revalidatePath(path));
const message = (error: unknown) => encodeURIComponent(error instanceof Error ? error.message : "Не удалось сохранить.");
const settingsMoneyReturn = (data: FormData) => text(data, "returnTo") === "/family/settings/money" ? "/family/settings/money" : null;
const accountRedirect = (kind: string, result: string, returnTo: string | null) => returnTo ? `${returnTo}?${result}=1` : kind === "ENVELOPE" ? `/money/envelopes?${result}=${result === "created" ? "ENVELOPE" : "1"}` : `/safe?${result}=${result === "created" ? "WALLET" : "1"}`;

function accountInput(data: FormData) {
  return {
    projectCode: text(data, "projectCode") as FinanceModule,
    kind: text(data, "kind") as MoneyAccountKind,
    name: text(data, "name"),
    type: (text(data, "type") || "OTHER") as MoneyAccountType,
    currency: text(data, "currency") || "UAH",
    openingBalance: text(data, "openingBalance") || "0",
    targetAmount: optional(data, "targetAmount"),
    targetDate: optional(data, "targetDate"),
    note: optional(data, "note"),
    icon: optional(data, "icon"),
    categoryId: optional(data, "categoryId"),
    isPrimary: data.get("isPrimary") === "on",
  };
}

export async function createMoneyAccountAction(data: FormData) {
  const user = await requireUser();
  const project = text(data, "projectCode");
  const kind = text(data, "kind");
  const returnTo = settingsMoneyReturn(data);
  try { await createMoneyAccount(user.id, accountInput(data)); }
  catch (error) { redirect(`/money/new?project=${project}&kind=${kind}${returnTo ? `&returnTo=${returnTo}` : ""}&error=${message(error)}`); }
  refresh();
  redirect(accountRedirect(kind, "created", returnTo));
}

export async function updateMoneyAccountAction(data: FormData) {
  const user = await requireUser();
  const id = text(data, "id");
  const kind = text(data, "kind");
  const returnTo = settingsMoneyReturn(data);
  try { await updateMoneyAccount(user.id, id, accountInput(data)); }
  catch (error) { redirect(`/money/${id}?${returnTo ? `returnTo=${returnTo}&` : ""}error=${message(error)}`); }
  refresh();
  redirect(accountRedirect(kind, "updated", returnTo));
}

export async function archiveMoneyAccountAction(data: FormData) {
  const user = await requireUser();
  const account = await getMoneyAccount(user.id, text(data, "id"));
  const returnTo = settingsMoneyReturn(data);
  await setMoneyAccountActive(user.id, account.id, text(data, "isActive") === "true");
  refresh();
  redirect(accountRedirect(account.kind, "archived", returnTo));
}

export async function deleteMoneyAccountAction(data: FormData) {
  const user = await requireUser();
  const id = text(data, "id");
  const account = await getMoneyAccount(user.id, id);
  const returnTo = settingsMoneyReturn(data);
  try { await deleteUnusedMoneyAccount(user.id, id); }
  catch (error) { redirect(`/money/${id}?${returnTo ? `returnTo=${returnTo}&` : ""}error=${message(error)}`); }
  refresh();
  redirect(accountRedirect(account.kind, "deleted", returnTo));
}

export async function createInternalAllocationAction(data: FormData) {
  const user = await requireUser();
  let transferId = "";
  try {
    const transfer = await createInternalAllocation(user.id, {
      sourceAccountId: text(data, "sourceAccountId"),
      targetAccountId: text(data, "targetAccountId"),
      amount: text(data, "amount"),
      operationDate: text(data, "operationDate"),
      comment: optional(data, "comment"),
      idempotencyKey: text(data, "idempotencyKey"),
    });
    transferId = transfer.id;
  } catch (error) { redirect(`/money/transfer?error=${message(error)}`); }
  refresh();
  redirect(`/safe?transfer=${transferId}`);
}

export async function fundMoneyEnvelopeAction(data: FormData) {
  const user = await requireUser();
  const envelopeId = text(data, "targetAccountId");
  const returnTo = settingsMoneyReturn(data);
  try {
    const envelope = await getMoneyAccount(user.id, envelopeId);
    if (envelope.kind !== MoneyAccountKind.ENVELOPE || !envelope.isActive) throw new Error("Этот конверт нельзя пополнить.");
    await createInternalAllocation(user.id, {
      sourceAccountId: text(data, "sourceAccountId"),
      targetAccountId: envelope.id,
      amount: text(data, "amount"),
      operationDate: text(data, "operationDate"),
      comment: `Пополнение конверта «${envelope.name}»`,
      idempotencyKey: text(data, "idempotencyKey"),
    });
  } catch (error) { redirect(`/money/${envelopeId}?${returnTo ? `returnTo=${returnTo}&` : ""}error=${message(error)}`); }
  refresh();
  revalidatePath(`/money/${envelopeId}`);
  redirect(`/money/${envelopeId}?${returnTo ? `returnTo=${returnTo}&` : ""}funded=1`);
}

export async function cancelInternalTransferAction(data: FormData) {
  const user = await requireUser();
  try { await cancelInternalTransfer(user.id, text(data, "id")); }
  catch (error) { redirect(`/money/transfers?error=${message(error)}`); }
  refresh();
  revalidatePath("/money/transfers");
  redirect("/money/transfers?cancelled=1");
}
