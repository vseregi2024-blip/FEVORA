"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/server/auth";
import { createTransaction, parseTransactionForm, softDeleteTransaction, updateTransaction } from "@/server/finance";

function refreshFinance() {
  revalidatePath("/dashboard");
  revalidatePath("/finance");
}

export async function createTransactionAction(formData: FormData) {
  const user = await requireUser();
  await createTransaction(user.id, parseTransactionForm(formData));
  refreshFinance();
  redirect("/finance?created=1");
}

export async function updateTransactionAction(formData: FormData) {
  const user = await requireUser();
  const id = formData.get("id");
  if (typeof id !== "string") throw new Error("Операцію не знайдено.");
  await updateTransaction(user.id, id, parseTransactionForm(formData));
  refreshFinance();
  redirect("/finance?updated=1");
}

export async function deleteTransactionAction(formData: FormData) {
  const user = await requireUser();
  const id = formData.get("id");
  if (typeof id !== "string") throw new Error("Операцію не знайдено.");
  await softDeleteTransaction(user.id, id);
  refreshFinance();
  redirect("/finance?deleted=1");
}
