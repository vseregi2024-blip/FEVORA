import Link from "next/link";

import { TransactionForm } from "@/components/transaction-form";
import { todayInputValue } from "@/lib/dates";
import { requireUser } from "@/server/auth";
import { getCategories } from "@/server/finance";
import { createTransactionAction } from "../actions";

export default async function NewTransactionPage() { const user = await requireUser(); const categories = await getCategories(user.id); return <><header className="page-header"><div><p className="eyebrow">Финансы</p><h1>Новая операция</h1></div><Link href="/finance" className="text-link">Отмена</Link></header><TransactionForm categories={categories} action={createTransactionAction} submitLabel="Сохранить операцию" initialValues={{ type: "EXPENSE", amount: "", operationDate: todayInputValue(), module: "GENERAL", categoryId: null, description: null }} /></>; }
