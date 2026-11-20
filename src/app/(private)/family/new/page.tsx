import Link from "next/link";
import { randomUUID } from "node:crypto";

import { QuickFamilyOperationForm } from "@/components/quick-family-operation-form";
import { todayInputValue } from "@/lib/dates";
import { requireUser } from "@/server/auth";
import { getFamilyCategories, getFamilyWallets, getRecurringPayment } from "@/server/family";

import { createFamilyOperationAction } from "../actions";

export default async function NewFamilyOperationPage({ searchParams }: { searchParams: Promise<{ type?: string; recurringId?: string }> }) {
  const user = await requireUser(); const params = await searchParams; const type = params.type === "INCOME" ? "INCOME" : "EXPENSE"; const recurringPayment = type === "EXPENSE" && params.recurringId ? await getRecurringPayment(user.id, params.recurringId).catch(() => null) : null; const [categories, accounts] = await Promise.all([getFamilyCategories(user.id, type), getFamilyWallets(user.id)]);
  return <div className="money-entry-page"><header className={`money-entry-header ${type === "EXPENSE" ? "expense" : "income"}`}><Link href="/family">Отменить</Link><h1>{recurringPayment ? "Оплатить обязательный платёж" : type === "EXPENSE" ? "Новый расход" : "Новый доход"}</h1><span aria-hidden="true"/></header>{recurringPayment && <p className="money-entry-reminder">Списание произойдёт только после сохранения этого расхода. Срок оплаты: {recurringPayment.nextDueDate.toLocaleDateString("ru-RU")}.</p>}<QuickFamilyOperationForm categories={categories} accounts={accounts} type={type} date={todayInputValue()} requestId={randomUUID()} action={createFamilyOperationAction} recurringPayment={recurringPayment ? { id: recurringPayment.id, amount: recurringPayment.amount.toString(), categoryId: recurringPayment.categoryId, accountId: null, name: recurringPayment.name } : undefined}/></div>;
}
