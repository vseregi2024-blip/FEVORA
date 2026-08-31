import Link from "next/link";

import { DeletePoultryRecordForm } from "@/components/delete-poultry-record-form";
import { PoultryFormActions } from "@/components/poultry-form-actions";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { formatMoney } from "@/lib/money";
import { todayInputValue } from "@/lib/dates";
import { requireUser } from "@/server/auth";
import { getPoultryCategories, getPoultryDashboard } from "@/server/poultry";
import { createOperationalExpenseAction, deleteOperationalExpenseAction } from "../actions";

export default async function PoultryExpensesPage({ searchParams }: { searchParams: Promise<{ batchId?: string; returnTo?: string }> }) {
  const user = await requireUser();
  const [{ batches, incubations, report, expenses }, categories] = await Promise.all([getPoultryDashboard(user.id), getPoultryCategories(user.id)]);
  const expenseCategories = categories.filter((category) => category.kind !== "INCOME" && category.name !== "Корма");
  const query = await searchParams;
  const selectedBatchId = batches.some((batch) => batch.id === query.batchId) ? query.batchId ?? "" : "";
  const returnTo = query.returnTo?.startsWith("/poultry") && !query.returnTo.startsWith("//") ? query.returnTo : "/poultry/expenses";
  return <>
    <header className="page-header"><div><p className="eyebrow">Птицеводство</p><h1>Расходы и покупки</h1><p className="muted">Добавки, ветеринария, хозяйственное и оборудование.</p></div><Link href="/poultry" className="button secondary">Обзор</Link></header>
    <section className="family-grid"><article id="new" className="app-card"><h2>Добавить расход</h2><form action={createOperationalExpenseAction} className="compact-form"><input type="hidden" name="returnTo" value={returnTo}/><label>Категория<select name="categoryId" required defaultValue=""><option value="" disabled>Выберите категорию</option>{expenseCategories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label><details className="form-details"><summary>К чему отнести — необязательно</summary><label>Группа<select name="batchId" defaultValue={selectedBatchId}><option value="">Общий расход хозяйства</option>{batches.map((batch) => <option value={batch.id} key={batch.id}>{batch.name}</option>)}</select></label><label>Инкубация<select name="incubationBatchId"><option value="">Не относится к инкубации</option>{incubations.map((item)=><option value={item.id} key={item.id}>{item.name}</option>)}</select></label></details><div className="form-grid"><label>Сумма<input name="amount" required inputMode="decimal"/></label><label>Дата<input name="operationDate" type="date" required defaultValue={todayInputValue()}/></label></div><label>Что купили<input name="description" required placeholder="Чиктоник, подстилка, поилка…"/></label><p className="summary-note">Оборудование попадёт в реальные расходы, но не увеличит себестоимость одной группы.</p><PoultryFormActions cancelHref={returnTo}><button className="button primary">Сохранить расход</button></PoultryFormActions></form></article><article className="app-card"><h2>За месяц</h2><strong className="expense">{formatMoney(report.expense)}</strong><div className="mini-list">{report.expensesByCategory.map((item)=><div key={item.name}><span>{item.name}</span><b>{formatMoney(item.amount)}</b></div>)}</div></article></section>
    <SectionHeader eyebrow="История" title="Покупки и расходы" />
    {expenses.length ? <div className="transaction-list">{expenses.map((expense)=><article className="transaction-row" key={expense.id}><span><b>{expense.transaction.description}</b><small>{expense.transaction.operationDate.toLocaleDateString("ru-RU")} · {expense.transaction.category?.name ?? "Без категории"}{expense.batch ? ` · ${expense.batch.name}` : expense.incubationBatch ? ` · ${expense.incubationBatch.name}` : " · общий"}</small></span><span className="row-actions"><strong className="expense">−{formatMoney(expense.transaction.amount.toString())}</strong><DeletePoultryRecordForm id={expense.id} action={deleteOperationalExpenseAction}/></span></article>)}</div> : <EmptyState title="Расходов пока нет" description="Покупка корма ведётся отдельно на складе." />}
  </>;
}
