import Link from "next/link";

import { QuickFamilyOperationForm } from "@/components/quick-family-operation-form";
import { todayInputValue } from "@/lib/dates";
import { requireUser } from "@/server/auth";
import { getFamilyAccounts, getFamilyCategories } from "@/server/family";

import { createFamilyOperationAction } from "../actions";

export default async function NewFamilyOperationPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const user = await requireUser(); const params = await searchParams; const type = params.type === "INCOME" ? "INCOME" : "EXPENSE"; const [categories, accounts] = await Promise.all([getFamilyCategories(user.id, type), getFamilyAccounts(user.id)]);
  return <div className="money-entry-page"><header className={`money-entry-header ${type === "EXPENSE" ? "expense" : "income"}`}><Link href="/family">Отменить</Link><h1>{type === "EXPENSE" ? "Новый расход" : "Новый доход"}</h1><span aria-hidden="true">□</span></header><QuickFamilyOperationForm categories={categories} accounts={accounts} type={type} date={todayInputValue()} action={createFamilyOperationAction}/></div>;
}
