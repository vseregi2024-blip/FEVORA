import { notFound } from "next/navigation";
import Link from "next/link";

import { DeleteTransactionForm } from "@/components/delete-transaction-form";
import { TransactionForm } from "@/components/transaction-form";
import { dateToInput } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth";
import { getCategories } from "@/server/finance";
import { deleteTransactionAction, updateTransactionAction } from "../actions";

export default async function TransactionPage({ params }: { params: Promise<{ id: string }> }) { const user = await requireUser(); const { id } = await params; const [transaction, categories] = await Promise.all([prisma.transaction.findFirst({ where: { id, userId: user.id, deletedAt: null } }), getCategories(user.id)]); if (!transaction) notFound(); return <><header className="page-header"><div><p className="eyebrow">Фінанси</p><h1>Редагувати операцію</h1></div><Link href="/finance" className="text-link">До журналу</Link></header><TransactionForm categories={categories} action={updateTransactionAction} submitLabel="Зберегти зміни" initialValues={{ id: transaction.id, type: transaction.type, amount: transaction.amount.toString(), operationDate: dateToInput(transaction.operationDate), module: transaction.module, categoryId: transaction.categoryId, description: transaction.description }} /><div className="danger-zone"><h2>Видалення</h2><p>Запис збережеться в базі, але більше не впливатиме на баланс.</p><DeleteTransactionForm id={transaction.id} action={deleteTransactionAction} /></div></>; }
