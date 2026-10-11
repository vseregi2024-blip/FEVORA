"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/server/auth";
import { createWalletTransaction, walletTransactionSchema } from "@/server/money";

const value = (formData: FormData, name: string) => typeof formData.get(name) === "string" ? String(formData.get(name)) : "";

export async function createSafeTransactionAction(formData: FormData) {
  const user = await requireUser();
  const returnTo = value(formData, "returnTo");
  const destination = returnTo.startsWith("/cosmetology/visits") ? returnTo : "/safe";
  await createWalletTransaction(user.id, walletTransactionSchema.parse({ type: value(formData, "type"), amount: value(formData, "amount"), operationDate: value(formData, "operationDate"), module: value(formData, "module"), categoryId: value(formData, "categoryId") || null, moneyAccountId: value(formData, "moneyAccountId"), description: value(formData, "description") || null }));
  ["/safe", "/analytics", "/capital", "/cosmetology/visits"].forEach((path) => revalidatePath(path));
  redirect(destination);
}
