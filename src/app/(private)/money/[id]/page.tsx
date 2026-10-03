import Link from "next/link";

import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { MoneyAccountForm } from "@/components/money-account-form";
import { dateToInput } from "@/lib/dates";
import { requireUser } from "@/server/auth";
import { getCategories } from "@/server/finance";
import { getMoneyAccount } from "@/server/money";
import { archiveMoneyAccountAction, deleteMoneyAccountAction, updateMoneyAccountAction } from "../actions";

export default async function MoneyAccountPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const query = await searchParams;
  const account = await getMoneyAccount(user.id, id);
  const categories = account.kind === "ENVELOPE" ? await getCategories(user.id, account.project.code) : [];
  const hasHistory = account._count.moneyLedgerEntries + account._count.incomingTransfers + account._count.outgoingTransfers > 0;
  return <><header className="page-header"><div><Link href={`/money?project=${account.project.code}`} className="eyebrow">← Назад</Link><h1>{account.name}</h1><p className="muted">{account.kind === "WALLET" ? "Настройки кошелька" : "Настройки конверта"}{!account.isActive ? " · в архиве" : ""}</p></div></header>{query.error && <p className="form-error">{query.error}</p>}<MoneyAccountForm action={updateMoneyAccountAction} projectCode={account.project.code} kind={account.kind} categories={categories} submitLabel="Сохранить изменения" value={{ id: account.id, name: account.name, type: account.type, currency: account.currency, openingBalance: account.openingBalance.toString(), targetAmount: account.targetAmount?.toString(), targetDate: account.targetDate ? dateToInput(account.targetDate) : undefined, note: account.note ?? undefined, icon: account.icon ?? undefined, categoryId: account.categoryId ?? undefined, isPrimary: account.isPrimary }}/><section className="danger-zone"><h2>{account.isActive ? "Архивирование" : "Восстановление"}</h2><p className="muted">История и остаток сохраняются. Архивный счёт нельзя использовать в новых распределениях.</p><form action={archiveMoneyAccountAction}><input type="hidden" name="id" value={account.id}/><input type="hidden" name="projectCode" value={account.project.code}/><input type="hidden" name="isActive" value={account.isActive ? "false" : "true"}/><button className="button secondary">{account.isActive ? "Переместить в архив" : "Вернуть из архива"}</button></form>{!hasHistory && account.openingBalance.isZero() && <ConfirmationDialog action={deleteMoneyAccountAction} fieldName="id" fieldValue={account.id} trigger="Удалить безвозвратно" title={`Удалить «${account.name}»?`} description="Это разрешено, потому что у счёта нет остатка и истории." confirmLabel="Удалить" triggerClassName="text-button expense"/>}</section></>;
}
