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
  return <><header className="page-header"><div><p className="eyebrow">Семья</p><h1>Редактировать запись</h1></div><Link href="/family" className="text-link">К семье</Link></header><FamilyOperationForm categories={categories} action={updateFamilyOperationAction} submitLabel="Сохранить изменения" value={{ id: transaction.id, type: transaction.type as "INCOME" | "EXPENSE", amount: transaction.amount.toString(), operationDate: dateToInput(transaction.operationDate), categoryId: transaction.categoryId ?? "", description: transaction.description ?? "" }} /><div className="danger-zone"><h2>Удаление</h2><p>Запись останется в базе, но не будет участвовать в отчётах или балансе семьи.</p><DeleteTransactionForm id={transaction.id} action={deleteFamilyOperationAction} /></div></>;
}
