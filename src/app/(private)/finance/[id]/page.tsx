import { notFound, redirect } from "next/navigation";
import { FinanceModule } from "@prisma/client";
import Link from "next/link";

import { DeleteTransactionForm } from "@/components/delete-transaction-form";
import { TransactionForm } from "@/components/transaction-form";
import { dateToInput } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth";
import { getCategories } from "@/server/finance";
import { deleteTransactionAction, updateTransactionAction } from "../actions";

export default async function TransactionPage({ params }: { params: Promise<{ id: string }> }) { const user = await requireUser(); const { id } = await params; const [transaction, categories] = await Promise.all([prisma.transaction.findFirst({ where: { id, userId: user.id, deletedAt: null } }), getCategories(user.id)]); if (!transaction) notFound(); if (transaction.module === FinanceModule.GOODS) redirect("/goods"); return <><header className="page-header"><div><p className="eyebrow">Финансы</p><h1>Редактировать операцию</h1></div><Link href="/finance" className="text-link">К журналу</Link></header><TransactionForm categories={categories} action={updateTransactionAction} submitLabel="Сохранить изменения" initialValues={{ id: transaction.id, type: transaction.type, amount: transaction.amount.toString(), operationDate: dateToInput(transaction.operationDate), module: transaction.module, categoryId: transaction.categoryId, description: transaction.description }} /><div className="danger-zone"><h2>Удаление</h2><p>Запись сохранится в базе, но больше не будет влиять на баланс.</p><DeleteTransactionForm id={transaction.id} action={deleteTransactionAction} /></div></>; }
