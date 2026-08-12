import Link from "next/link";
import { notFound } from "next/navigation";

import { DeleteTransactionForm } from "@/components/delete-transaction-form";
import { FamilyOperationForm } from "@/components/family-operation-form";
import { dateToInput } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth";
import { getFamilyCategories } from "@/server/family";

import { deleteFamilyOperationAction, updateFamilyOperationAction } from "../actions";

export default async function FamilyOperationPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const [transaction, categories] = await Promise.all([prisma.transaction.findFirst({ where: { id, userId: user.id, module: "FAMILY", deletedAt: null }, include: { category: true } }), getFamilyCategories(user.id)]);
  if (!transaction || !["INCOME", "EXPENSE"].includes(transaction.type)) notFound();
  return <><header className="page-header"><div><p className="eyebrow">Сімʼя</p><h1>Редагувати запис</h1></div><Link href="/family" className="text-link">До Family</Link></header><FamilyOperationForm categories={categories} action={updateFamilyOperationAction} submitLabel="Зберегти зміни" value={{ id: transaction.id, type: transaction.type as "INCOME" | "EXPENSE", amount: transaction.amount.toString(), operationDate: dateToInput(transaction.operationDate), categoryId: transaction.categoryId ?? "", description: transaction.description ?? "" }} /><div className="danger-zone"><h2>Видалення</h2><p>Запис залишиться в базі, але не братиме участі у Family-звітах чи балансі.</p><DeleteTransactionForm id={transaction.id} action={deleteFamilyOperationAction} /></div></>;
}
