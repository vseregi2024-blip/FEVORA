import Link from "next/link";

import { SplitReceiptForm } from "@/components/split-receipt-form";
import { todayInputValue } from "@/lib/dates";
import { requireUser } from "@/server/auth";
import { getFamilyAccounts, getFamilyCategories } from "@/server/family";

import { createSplitReceiptAction } from "../../actions";

export default async function NewReceiptPage() { const user = await requireUser(); const [categories, accounts] = await Promise.all([getFamilyCategories(user.id, "EXPENSE"), getFamilyAccounts(user.id)]); return <><header className="page-header"><div><p className="eyebrow">Дом</p><h1>Разделить чек</h1><p className="muted">Общая сумма учитывается ровно один раз — через части.</p></div><Link href="/family" className="text-link">Закрыть</Link></header><SplitReceiptForm categories={categories} accounts={accounts} action={createSplitReceiptAction} value={{ date: todayInputValue(), description: "", totalAmount: "", accountId: "" }}/></>; }
