"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/server/auth";
import { createFamilyOperation, createRecurringPayment, createSavingsGoal, createSavingsMovement, createSplitReceipt, familyOperationSchema, payRecurringPayment, recurringPaymentSchema, savingsGoalSchema, softDeleteFamilyOperation, splitReceiptSchema, updateFamilyOperation } from "@/server/family";

const refresh = () => ["/dashboard", "/family", "/reports", "/finance"].forEach((path) => revalidatePath(path));
const required = (formData: FormData, name: string) => { const value = formData.get(name); if (typeof value !== "string") throw new Error("Перевірте форму."); return value; };

export async function createFamilyOperationAction(formData: FormData) {
  const user = await requireUser();
  const parsed = familyOperationSchema.parse({ type: formData.get("type"), amount: formData.get("amount"), operationDate: formData.get("operationDate"), categoryId: formData.get("categoryId"), description: formData.get("description") });
  const transaction = await createFamilyOperation(user.id, parsed);
  refresh();
  redirect(`/family?created=${transaction.id}`);
}

export async function updateFamilyOperationAction(formData: FormData) {
  const user = await requireUser();
  const id = required(formData, "id");
  const parsed = familyOperationSchema.parse({ type: formData.get("type"), amount: formData.get("amount"), operationDate: formData.get("operationDate"), categoryId: formData.get("categoryId"), description: formData.get("description") });
  await updateFamilyOperation(user.id, id, parsed);
  refresh();
  redirect(`/family?updated=${id}`);
}

export async function deleteFamilyOperationAction(formData: FormData) {
  const user = await requireUser();
  await softDeleteFamilyOperation(user.id, required(formData, "id"));
  refresh();
  redirect("/family?deleted=1");
}

export async function createSplitReceiptAction(formData: FormData) {
  const user = await requireUser();
  const indexes = [...formData.keys()].flatMap((key) => key.match(/^categoryId-(\d+)$/)?.[1] ?? []);
  const items = indexes.map((index) => ({ categoryId: formData.get(`categoryId-${index}`), amount: formData.get(`amount-${index}`), description: formData.get(`description-${index}`) })).filter((item) => item.categoryId && item.amount);
  const parsed = splitReceiptSchema.parse({ operationDate: formData.get("operationDate"), description: formData.get("description"), items });
  const receipt = await createSplitReceipt(user.id, parsed);
  refresh();
  redirect(`/family?receipt=${receipt.receipt.id}`);
}

export async function createRecurringPaymentAction(formData: FormData) {
  const user = await requireUser();
  const parsed = recurringPaymentSchema.parse({ name: formData.get("name"), amount: formData.get("amount"), categoryId: formData.get("categoryId") || null, frequency: formData.get("frequency"), nextDueDate: formData.get("nextDueDate"), note: formData.get("note") || null });
  await createRecurringPayment(user.id, parsed);
  refresh();
  redirect("/family?recurring=1");
}

export async function payRecurringPaymentAction(formData: FormData) {
  const user = await requireUser();
  await payRecurringPayment(user.id, required(formData, "id"));
  refresh();
  redirect("/family?paid=1");
}

export async function createSavingsGoalAction(formData: FormData) {
  const user = await requireUser();
  const parsed = savingsGoalSchema.parse({ name: formData.get("name"), targetAmount: formData.get("targetAmount") || null, note: formData.get("note") || null });
  await createSavingsGoal(user.id, parsed);
  refresh();
  redirect("/family?savings=1");
}

export async function createSavingsMovementAction(formData: FormData) {
  const user = await requireUser();
  await createSavingsMovement(user.id, required(formData, "goalId"), required(formData, "direction") as "SAVING_IN" | "SAVING_OUT", required(formData, "amount"), required(formData, "operationDate"), required(formData, "description"));
  refresh();
  redirect("/family?savingsMovement=1");
}
