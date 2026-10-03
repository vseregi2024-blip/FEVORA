import Link from "next/link";

import { NewRecurringPaymentForm } from "@/components/new-recurring-payment-form";
import { todayInputValue } from "@/lib/dates";
import { requireUser } from "@/server/auth";
import { getFamilyAccounts, getFamilyCategories } from "@/server/family";

import { createRecurringPaymentAction } from "../../actions";

export default async function NewRecurringPage() { const user = await requireUser(); const [categories, accounts] = await Promise.all([getFamilyCategories(user.id, "EXPENSE"), getFamilyAccounts(user.id)]); return <><header className="page-header"><div><p className="eyebrow">Дом</p><h1>Новый платёж</h1><p className="muted">Обязательство не списывает деньги до отметки «Оплачен».</p></div><Link href="/family/recurring" className="text-link">Закрыть</Link></header><NewRecurringPaymentForm categories={categories} accounts={accounts} defaultDate={todayInputValue()} action={createRecurringPaymentAction}/></>; }
