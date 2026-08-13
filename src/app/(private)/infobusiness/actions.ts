"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/server/auth";
import { createInfoExpense, createInfoExpenseCategory, createInfoProduct, createInfoSale, formValue, infoCategorySchema, infoCategoryUpdateSchema, infoExpenseSchema, infoProductSchema, infoSaleSchema, softDeleteInfoExpense, softDeleteInfoSale, updateInfoExpense, updateInfoExpenseCategory, updateInfoProduct, updateInfoSale } from "@/server/infobusiness";

const refresh = () => ["/infobusiness", "/infobusiness/products", "/infobusiness/sales", "/infobusiness/expenses", "/infobusiness/analytics", "/dashboard", "/projects", "/reports", "/finance"].forEach((path) => revalidatePath(path));
const complete = (path: string, key: string) => { refresh(); redirect(`${path}?${key}=1`); };
const required = (formData: FormData, name: string) => { const value = formData.get(name); if (typeof value !== "string" || !value) throw new Error("Запись не найдена."); return value; };

export async function createInfoProductAction(formData: FormData) {
  const user = await requireUser();
  await createInfoProduct(user.id, infoProductSchema.parse({ name: formData.get("name"), type: formData.get("type"), format: formData.get("format"), basePrice: formValue(formData, "basePrice"), startDate: formValue(formData, "startDate"), endDate: formValue(formData, "endDate"), status: formData.get("status"), comment: formValue(formData, "comment") }));
  complete("/infobusiness/products", "product");
}

export async function updateInfoProductAction(formData: FormData) {
  const user = await requireUser(); const id = required(formData, "id");
  await updateInfoProduct(user.id, id, infoProductSchema.parse({ name: formData.get("name"), type: formData.get("type"), format: formData.get("format"), basePrice: formValue(formData, "basePrice"), startDate: formValue(formData, "startDate"), endDate: formValue(formData, "endDate"), status: formData.get("status"), comment: formValue(formData, "comment") }));
  complete(`/infobusiness/products/${id}`, "saved");
}

export async function createInfoSaleAction(formData: FormData) {
  const user = await requireUser();
  await createInfoSale(user.id, infoSaleSchema.parse({ productId: formData.get("productId"), amount: formData.get("amount"), operationDate: formData.get("operationDate"), buyer: formValue(formData, "buyer"), seats: formData.get("seats") || "1", comment: formValue(formData, "comment") }));
  complete("/infobusiness/sales", "sale");
}

export async function updateInfoSaleAction(formData: FormData) {
  const user = await requireUser(); const id = required(formData, "id");
  await updateInfoSale(user.id, id, infoSaleSchema.parse({ productId: formData.get("productId"), amount: formData.get("amount"), operationDate: formData.get("operationDate"), buyer: formValue(formData, "buyer"), seats: formData.get("seats") || "1", comment: formValue(formData, "comment") }));
  complete("/infobusiness/sales", "saleUpdated");
}

export async function deleteInfoSaleAction(formData: FormData) {
  const user = await requireUser(); await softDeleteInfoSale(user.id, required(formData, "id"));
  complete("/infobusiness/sales", "saleDeleted");
}

const parseExpense = (formData: FormData) => infoExpenseSchema.parse({ categoryId: formValue(formData, "categoryId"), newCategoryName: formValue(formData, "newCategoryName"), productId: formValue(formData, "productId"), amount: formData.get("amount"), operationDate: formData.get("operationDate"), description: formData.get("description"), serviceName: formValue(formData, "serviceName"), comment: formValue(formData, "comment") });

export async function createInfoExpenseAction(formData: FormData) {
  const user = await requireUser(); await createInfoExpense(user.id, parseExpense(formData));
  complete("/infobusiness/expenses", "expense");
}

export async function updateInfoExpenseAction(formData: FormData) {
  const user = await requireUser(); const id = required(formData, "id"); await updateInfoExpense(user.id, id, parseExpense(formData));
  complete("/infobusiness/expenses", "expenseUpdated");
}

export async function deleteInfoExpenseAction(formData: FormData) {
  const user = await requireUser(); await softDeleteInfoExpense(user.id, required(formData, "id"));
  complete("/infobusiness/expenses", "expenseDeleted");
}

export async function createInfoExpenseCategoryAction(formData: FormData) {
  const user = await requireUser(); await createInfoExpenseCategory(user.id, infoCategorySchema.parse({ name: formData.get("name") }));
  complete("/infobusiness/expenses", "category");
}

export async function updateInfoExpenseCategoryAction(formData: FormData) {
  const user = await requireUser(); const id = required(formData, "id");
  await updateInfoExpenseCategory(user.id, id, infoCategoryUpdateSchema.parse({ name: formData.get("name"), isArchived: formData.get("isArchived") === "on" }));
  complete("/infobusiness/expenses", "categoryUpdated");
}
