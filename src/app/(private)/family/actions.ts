"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/server/auth";
import { archiveRecurringPayment, categoryMutationSchema, createFamilyAccount, createFamilyCategory, createFamilyOperation, createRecurringPayment, createSplitReceipt, deleteFamilyAccount, deleteFamilyCategory, deleteSplitReceipt, familyAccountSchema, familyOperationSchema, moveFamilyAccount, moveFamilyCategory, payRecurringFromFamily, recurringPaymentSchema, setFamilyAccountArchived, setFamilyCategoryArchived, softDeleteFamilyOperation, softDeleteRecurringPaymentOccurrence, splitReceiptSchema, toggleRecurringPayment, updateFamilyAccount, updateFamilyCategory, updateFamilyOperation, updateRecurringPayment, updateSplitReceipt } from "@/server/family";

const refresh = () => ["/dashboard", "/family", "/family/operations", "/family/analytics", "/family/recurring", "/family/settings", "/family/accounts", "/reports", "/finance", "/money"].forEach((path) => revalidatePath(path));
const required = (formData: FormData, name: string) => { const value = formData.get(name); if (typeof value !== "string") throw new Error("Проверьте форму."); return value; };
const nullable = (formData: FormData, name: string) => { const value = formData.get(name); return typeof value === "string" && value.trim() ? value : null; };
const categoryIcon = async (formData: FormData) => {
  const file = formData.get("customIconFile");
  if (file && typeof file !== "string" && "arrayBuffer" in file && typeof file.arrayBuffer === "function" && file.size > 0) {
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) throw new Error("Выберите PNG, JPG или WebP.");
    if (file.size > 10 * 1024 * 1024) throw new Error("Изображение не должно быть больше 10 МБ.");
    const sharp = (await import("sharp")).default;
    const image = await sharp(Buffer.from(await file.arrayBuffer())).rotate().resize(96, 96, { fit: "cover" }).webp({ quality: 82 }).toBuffer();
    return `data:image/webp;base64,${image.toString("base64")}`;
  }
  return nullable(formData, "customIcon") ?? nullable(formData, "icon");
};
const receiptInput = (formData: FormData) => {
  const indexes = [...new Set([...formData.keys()].flatMap((key) => key.match(/^categoryId-(\d+)$/)?.[1] ?? []))];
  const items = indexes.map((index) => ({ id: nullable(formData, `id-${index}`) ?? undefined, categoryId: formData.get(`categoryId-${index}`), amount: formData.get(`amount-${index}`), description: nullable(formData, `description-${index}`) ?? undefined })).filter((item) => item.categoryId && item.amount);
  return splitReceiptSchema.parse({ totalAmount: formData.get("totalAmount"), operationDate: formData.get("operationDate"), accountId: nullable(formData, "accountId"), description: formData.get("description"), items });
};
const recurringInput = (formData: FormData) => recurringPaymentSchema.parse({ name: formData.get("name"), amount: formData.get("amount"), categoryId: nullable(formData, "categoryId"), accountId: nullable(formData, "accountId"), frequency: formData.get("frequency"), nextDueDate: formData.get("nextDueDate"), endDate: nullable(formData, "endDate"), note: nullable(formData, "note") });

export async function createFamilyOperationAction(formData: FormData) { const user = await requireUser(); const input = familyOperationSchema.parse({ type: formData.get("type"), amount: formData.get("amount"), operationDate: formData.get("operationDate"), categoryId: formData.get("categoryId"), accountId: nullable(formData, "accountId"), description: formData.get("description") }); const recurringPaymentId = nullable(formData, "recurringPaymentId"); const item = recurringPaymentId ? await payRecurringFromFamily(user.id, recurringPaymentId, input) : await createFamilyOperation(user.id, input); refresh(); redirect(recurringPaymentId ? "/family/recurring?paid=1" : `/family?created=${item.id}`); }
export async function updateFamilyOperationAction(formData: FormData) { const user = await requireUser(); const id = required(formData, "id"); await updateFamilyOperation(user.id, id, familyOperationSchema.parse({ type: formData.get("type"), amount: formData.get("amount"), operationDate: formData.get("operationDate"), categoryId: formData.get("categoryId"), accountId: nullable(formData, "accountId"), description: formData.get("description") })); refresh(); redirect(`/family/${id}?updated=1`); }
export async function deleteFamilyOperationAction(formData: FormData) { const user = await requireUser(); await softDeleteFamilyOperation(user.id, required(formData, "id")); refresh(); redirect("/family/operations?deleted=1"); }

export async function createSplitReceiptAction(formData: FormData) { const user = await requireUser(); const result = await createSplitReceipt(user.id, receiptInput(formData)); refresh(); redirect(`/family/receipts/${result.receipt.id}?created=1`); }
export async function updateSplitReceiptAction(formData: FormData) { const user = await requireUser(); const id = required(formData, "id"); await updateSplitReceipt(user.id, id, receiptInput(formData)); refresh(); redirect(`/family/receipts/${id}?updated=1`); }
export async function deleteSplitReceiptAction(formData: FormData) { const user = await requireUser(); await deleteSplitReceipt(user.id, required(formData, "id")); refresh(); redirect("/family/operations?deleted=1"); }

export async function createFamilyCategoryAction(formData: FormData) { const user = await requireUser(); await createFamilyCategory(user.id, categoryMutationSchema.parse({ name: formData.get("name"), icon: await categoryIcon(formData), kind: formData.get("kind") })); refresh(); redirect("/family/categories?created=1"); }
export async function createRecurringExpenseCategoryAction(formData: FormData) { const user = await requireUser(); const category = await createFamilyCategory(user.id, categoryMutationSchema.parse({ name: formData.get("name"), icon: await categoryIcon(formData), kind: "EXPENSE" })); refresh(); return { id: category.id, name: category.name, icon: category.icon }; }
export async function updateFamilyCategoryAction(formData: FormData) { const user = await requireUser(); await updateFamilyCategory(user.id, required(formData, "id"), categoryMutationSchema.parse({ name: formData.get("name"), icon: await categoryIcon(formData), kind: formData.get("kind") })); refresh(); redirect("/family/categories?updated=1"); }
export async function deleteFamilyCategoryAction(formData: FormData) { const user = await requireUser(); await deleteFamilyCategory(user.id, required(formData, "id")); refresh(); redirect("/family/categories?deleted=1"); }
export async function archiveFamilyCategoryAction(formData: FormData) { const user = await requireUser(); await setFamilyCategoryArchived(user.id, required(formData, "id"), required(formData, "isArchived") === "true"); refresh(); redirect("/family/categories"); }
export async function moveFamilyCategoryAction(formData: FormData) { const user = await requireUser(); await moveFamilyCategory(user.id, required(formData, "id"), required(formData, "direction") === "UP" ? "UP" : "DOWN"); refresh(); redirect("/family/categories"); }

export async function createFamilyAccountAction(formData: FormData) { const user = await requireUser(); await createFamilyAccount(user.id, familyAccountSchema.parse({ name: formData.get("name") })); refresh(); redirect("/family/accounts?created=1"); }
export async function updateFamilyAccountAction(formData: FormData) { const user = await requireUser(); await updateFamilyAccount(user.id, required(formData, "id"), familyAccountSchema.parse({ name: formData.get("name") })); refresh(); redirect("/family/accounts?updated=1"); }
export async function deleteFamilyAccountAction(formData: FormData) { const user = await requireUser(); await deleteFamilyAccount(user.id, required(formData, "id")); refresh(); redirect("/family/accounts?deleted=1"); }
export async function archiveFamilyAccountAction(formData: FormData) { const user = await requireUser(); await setFamilyAccountArchived(user.id, required(formData, "id"), required(formData, "isArchived") === "true"); refresh(); redirect("/family/accounts"); }
export async function moveFamilyAccountAction(formData: FormData) { const user = await requireUser(); await moveFamilyAccount(user.id, required(formData, "id"), required(formData, "direction") === "UP" ? "UP" : "DOWN"); refresh(); redirect("/family/accounts"); }

export async function createRecurringPaymentAction(formData: FormData) { const user = await requireUser(); await createRecurringPayment(user.id, recurringInput(formData)); refresh(); redirect("/family/recurring?created=1"); }
export async function updateRecurringPaymentAction(formData: FormData) { const user = await requireUser(); const id = required(formData, "id"); await updateRecurringPayment(user.id, id, recurringInput(formData)); refresh(); redirect(`/family/recurring/${id}?updated=1`); }
export async function toggleRecurringPaymentAction(formData: FormData) { const user = await requireUser(); await toggleRecurringPayment(user.id, required(formData, "id"), required(formData, "isActive") === "true"); refresh(); redirect("/family/recurring"); }
export async function archiveRecurringPaymentAction(formData: FormData) { const user = await requireUser(); await archiveRecurringPayment(user.id, required(formData, "id")); refresh(); redirect("/family/recurring?archived=1"); }
export async function deleteRecurringPaymentOccurrenceAction(formData: FormData) { const user = await requireUser(); await softDeleteRecurringPaymentOccurrence(user.id, required(formData, "id")); refresh(); redirect("/family/operations?deleted=1"); }
