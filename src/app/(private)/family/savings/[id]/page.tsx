import Link from "next/link";
import { notFound } from "next/navigation";

import { DeleteTransactionForm } from "@/components/delete-transaction-form";
import { dateToInput, todayInputValue } from "@/lib/dates";
import { formatMoney, minorUnitsToMoney, moneyToMinorUnits } from "@/lib/money";
import { requireUser } from "@/server/auth";
import { getSavingsGoals } from "@/server/family";

import { createSavingsMovementAction, deleteSavingsMovementAction, setSavingsGoalStatusAction, updateSavingsGoalAction, updateSavingsMovementAction } from "../../actions";

export default async function SavingsGoalPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ action?: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const query = await searchParams;
  const goal = (await getSavingsGoals(user.id, true)).find((item) => item.id === id);
  if (!goal || goal.status === "ARCHIVED") notFound();
  const target = goal.targetAmount ? moneyToMinorUnits(goal.targetAmount.toString()) : null;
  const progress = target && target > 0n ? Math.max(0, Math.min(100, Number(goal.currentAmount * 100n / target))) : null;
  const selectedAction = ["deposit", "withdraw", "edit"].includes(query.action ?? "") ? query.action : null;
  const movements = goal.movements.filter((movement) => !movement.transaction.deletedAt);

  return <>
    <header className="page-header"><div><p className="eyebrow">Накопления</p><h1>{goal.name}</h1></div><Link href="/family/savings" className="text-link">Закрыть</Link></header>
    <section className="available-card savings-card"><span>Накоплено</span><strong>{formatMoney(minorUnitsToMoney(goal.currentAmount))}</strong>{target && <><div className="savings-progress light"><i style={{ width: `${progress}%` }}/></div><small>{progress}% из {formatMoney(goal.targetAmount!.toString())}</small></>}{goal.targetDate && <small>Срок: {goal.targetDate.toLocaleDateString("ru-RU")}</small>}</section>
    <div className="savings-actions"><Link href={`/family/savings/${id}?action=deposit`} className="button primary">+ Пополнить</Link><Link href={`/family/savings/${id}?action=withdraw`} className="button secondary">Снять</Link><Link href={`/family/savings/${id}?action=edit`} className="button secondary">Редактировать</Link></div>
    {(selectedAction === "deposit" || selectedAction === "withdraw") && <form action={createSavingsMovementAction} className="transaction-form savings-task-form"><input type="hidden" name="goalId" value={goal.id}/><input type="hidden" name="direction" value={selectedAction === "deposit" ? "SAVING_IN" : "SAVING_OUT"}/><h2>{selectedAction === "deposit" ? "Пополнить цель" : "Снять из цели"}</h2><label>Сумма<input name="amount" required inputMode="decimal" autoFocus placeholder="0,00"/></label><label>Дата<input name="operationDate" type="date" required defaultValue={todayInputValue()}/></label><label>Комментарий<input name="description" maxLength={500} placeholder="Необязательно"/></label><button className="button primary wide">Сохранить</button></form>}
    {selectedAction === "edit" && <><form action={updateSavingsGoalAction} className="transaction-form savings-task-form"><input type="hidden" name="id" value={goal.id}/><h2>Настройки цели</h2><label>Название<input name="name" required defaultValue={goal.name}/></label><label>Целевая сумма<input name="targetAmount" inputMode="decimal" defaultValue={goal.targetAmount?.toString() ?? ""}/></label><label>Срок цели<input name="targetDate" type="date" defaultValue={goal.targetDate ? dateToInput(goal.targetDate) : ""}/></label><label>Комментарий<input name="note" defaultValue={goal.note ?? ""}/></label><button className="button primary">Сохранить</button></form><form action={setSavingsGoalStatusAction} className="archive-action"><input type="hidden" name="id" value={goal.id}/><input type="hidden" name="status" value="ARCHIVED"/><button className="text-button expense">Архивировать цель</button></form></>}
    <section className="section-header"><div><p className="eyebrow">История</p><h2>Движения</h2></div></section>
    <div className="transaction-list">{movements.map((movement) => <details className="movement-card" key={movement.id}><summary><span><b>{movement.direction === "SAVING_IN" ? "Пополнение" : "Снятие"}</b><small>{movement.transaction.operationDate.toLocaleDateString("ru-RU")} · {movement.transaction.description || "Без комментария"}</small></span><strong className={movement.direction === "SAVING_IN" ? "income" : "expense"}>{movement.direction === "SAVING_IN" ? "+" : "−"}{formatMoney(movement.amount.toString())}</strong></summary><form action={updateSavingsMovementAction} className="compact-form movement-edit"><input type="hidden" name="id" value={movement.id}/><input type="hidden" name="goalId" value={goal.id}/><label>Действие<select name="direction" defaultValue={movement.direction}><option value="SAVING_IN">Пополнить</option><option value="SAVING_OUT">Снять</option></select></label><label>Сумма<input name="amount" required inputMode="decimal" defaultValue={movement.amount.toString()}/></label><label>Дата<input name="operationDate" type="date" required defaultValue={dateToInput(movement.transaction.operationDate)}/></label><label>Комментарий<input name="description" defaultValue={movement.transaction.description ?? ""}/></label><button className="button secondary">Исправить</button></form><DeleteTransactionForm id={movement.id} action={deleteSavingsMovementAction}/></details>)}{movements.length === 0 && <p className="empty">Движений пока нет.</p>}</div>
  </>;
}
