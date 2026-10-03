import Link from "next/link";
import { notFound } from "next/navigation";

import { DeleteTransactionForm } from "@/components/delete-transaction-form";
import { FamilyOperationForm } from "@/components/family-operation-form";
import { dateToInput } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth";
import { getFamilyAccounts, getFamilyCategories } from "@/server/family";

import { deleteFamilyOperationAction, deleteRecurringPaymentOccurrenceAction, updateFamilyOperationAction } from "../actions";

export default async function FamilyOperationPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ edit?: string; updated?: string }> }) {
  const user = await requireUser();
  const { id } = await params; const query = await searchParams;
  const [transaction, categories, accounts] = await Promise.all([prisma.transaction.findFirst({ where: { id, userId: user.id, module: "FAMILY", deletedAt: null }, include: { category: true, familyAccount: true } }), getFamilyCategories(user.id), getFamilyAccounts(user.id, true)]);
  if (!transaction || !["INCOME", "EXPENSE"].includes(transaction.type)) notFound();
  const editing = query.edit === "1";
  const recurringOccurrence = Boolean(transaction.recurringPaymentId);
  return <><header className="page-header"><div><p className="eyebrow">Операция</p><h1>{transaction.type === "EXPENSE" ? "Расход" : "Доход"}</h1></div><Link href="/family/operations" className="text-link">Закрыть</Link></header>{query.updated && <p className="notice">Изменения сохранены.</p>}{editing && !recurringOccurrence ? <><FamilyOperationForm categories={categories} accounts={accounts} action={updateFamilyOperationAction} submitLabel="Сохранить изменения" value={{ id: transaction.id, type: transaction.type as "INCOME" | "EXPENSE", amount: transaction.amount.toString(), operationDate: dateToInput(transaction.operationDate), categoryId: transaction.categoryId ?? "", accountId: transaction.familyAccountId ?? "", description: transaction.description ?? "" }}/><Link href={`/family/${id}`} className="button secondary">Отмена</Link></> : <section className="app-card operation-detail"><strong className={transaction.type === "EXPENSE" ? "expense" : "income"}>{transaction.type === "EXPENSE" ? "−" : "+"}{formatMoney(transaction.amount.toString())}</strong><dl><div><dt>Категория</dt><dd>{transaction.category?.name ?? "Без категории"}</dd></div><div><dt>Счёт</dt><dd>{transaction.familyAccount?.name ?? "Без счёта"}</dd></div><div><dt>Дата</dt><dd>{transaction.operationDate.toLocaleDateString("ru-RU")}</dd></div><div><dt>Комментарий</dt><dd>{transaction.description || "Нет"}</dd></div></dl>{recurringOccurrence && <p className="muted">Это отметка об оплате обязательного платежа. Её можно удалить, если она создана по ошибке.</p>}<div className="page-actions">{!recurringOccurrence && <Link href={`/family/${id}?edit=1`} className="button secondary">Редактировать</Link>}<DeleteTransactionForm id={transaction.id} action={recurringOccurrence ? deleteRecurringPaymentOccurrenceAction : deleteFamilyOperationAction}/></div></section>}</>;
}
