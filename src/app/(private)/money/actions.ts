"use server";

import { FinanceModule, MoneyAccountKind, MoneyAccountType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/server/auth";
import { cancelInternalTransfer, createInternalAllocation, createMoneyAccount, deleteUnusedMoneyAccount, getMoneyAccount, setMoneyAccountActive, updateMoneyAccount } from "@/server/money";

const text = (data: FormData, key: string) => typeof data.get(key) === "string" ? String(data.get(key)) : "";
const optional = (data: FormData, key: string) => text(data, key).trim() || null;
const refresh = () => ["/money", "/money/transfers", "/settings"].forEach((path) => revalidatePath(path));
const message = (error: unknown) => encodeURIComponent(error instanceof Error ? error.message : "Не удалось сохранить.");

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
  try { await createMoneyAccount(user.id, accountInput(data)); }
  catch (error) { redirect(`/money/new?project=${project}&kind=${kind}&error=${message(error)}`); }
  refresh();
  redirect(`/money?project=${project}&created=${kind}`);
}

export async function updateMoneyAccountAction(data: FormData) {
  const user = await requireUser();
  const id = text(data, "id");
  const project = text(data, "projectCode");
  try { await updateMoneyAccount(user.id, id, accountInput(data)); }
  catch (error) { redirect(`/money/${id}?error=${message(error)}`); }
  refresh();
  redirect(`/money?project=${project}&updated=1`);
}

export async function archiveMoneyAccountAction(data: FormData) {
  const user = await requireUser();
  const project = text(data, "projectCode");
  await setMoneyAccountActive(user.id, text(data, "id"), text(data, "isActive") === "true");
  refresh();
  redirect(`/money?project=${project}&archived=1`);
}

export async function deleteMoneyAccountAction(data: FormData) {
  const user = await requireUser();
  const id = text(data, "id");
  let project = text(data, "projectCode");
  if (!project) project = (await getMoneyAccount(user.id, id)).project.code;
  try { await deleteUnusedMoneyAccount(user.id, id); }
  catch (error) { redirect(`/money/${id}?error=${message(error)}`); }
  refresh();
  redirect(`/money?project=${project}&deleted=1`);
}

export async function createInternalAllocationAction(data: FormData) {
  const user = await requireUser();
  const returnProject = text(data, "projectCode") || FinanceModule.FAMILY;
  let sourceProject = returnProject;
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
    sourceProject = (await getMoneyAccount(user.id, transfer.sourceAccountId)).project.code;
  } catch (error) { redirect(`/money/transfer?project=${returnProject}&error=${message(error)}`); }
  refresh();
  redirect(`/money?project=${sourceProject}&transfer=${transferId}`);
}

export async function cancelInternalTransferAction(data: FormData) {
  const user = await requireUser();
  try { await cancelInternalTransfer(user.id, text(data, "id")); }
  catch (error) { redirect(`/money/transfers?error=${message(error)}`); }
  refresh();
  revalidatePath("/money/transfers");
  redirect("/money/transfers?cancelled=1");
}
