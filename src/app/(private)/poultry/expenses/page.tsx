import Link from "next/link";

import { DeletePoultryRecordForm } from "@/components/delete-poultry-record-form";
import { PoultryFormActions } from "@/components/poultry-form-actions";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { todayInputValue } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { requireUser } from "@/server/auth";
import { getPoultryCategories, getPoultryDashboard, type PoultryPeriod } from "@/server/poultry";
import { createOperationalExpenseAction, deleteOperationalExpenseAction } from "../actions";

const periodMap: Record<string, PoultryPeriod> = { week: "WEEK", month: "MONTH", year: "YEAR", all: "ALL" };

export default async function PoultryExpensesPage({ searchParams }: { searchParams: Promise<{ batchId?: string; returnTo?: string; period?: string; all?: string }> }) {
  const user = await requireUser();
  const query = await searchParams;
  const period = query.period && periodMap[query.period] ? query.period : "month";
  const [{ batches, incubations, report, expenses, from }, categories] = await Promise.all([getPoultryDashboard(user.id, periodMap[period]), getPoultryCategories(user.id)]);
  const expenseCategories = categories.filter((category) => category.kind !== "INCOME" && category.name !== "Корма");
  const selectedBatchId = batches.some((batch) => batch.id === query.batchId) ? query.batchId ?? "" : "";
  const returnTo = query.returnTo?.startsWith("/poultry") && !query.returnTo.startsWith("//") ? query.returnTo : "/poultry/expenses";
  const periodExpenses = expenses.filter((expense) => expense.transaction.operationDate >= from);
  const visible = query.all === "1" ? periodExpenses : periodExpenses.slice(0, 5);

  return <>
    <header className="page-header compact-page-header"><div><p className="eyebrow">Птицеводство</p><h1>Расходы</h1><p className="muted">Содержание, ветеринария и оборудование</p></div><Link href="/poultry/expenses#new" className="button primary">＋ Расход</Link></header>
    <nav className="chip-tabs"><Link href="?period=week" className={period === "week" ? "active" : ""}>Неделя</Link><Link href="?period=month" className={period === "month" ? "active" : ""}>Месяц</Link><Link href="?period=year" className={period === "year" ? "active" : ""}>Год</Link><Link href="?period=all" className={period === "all" ? "active" : ""}>Всё</Link></nav>
    <section className="balance-card compact-money-hero"><span>Расходы за период</span><strong>{formatMoney(report.expense)}</strong><div className="category-chips">{report.expensesByCategory.slice(0, 4).map((item) => <small key={item.name}>{item.name}: {formatMoney(item.amount)}</small>)}</div></section>
    <details id="new" className="app-card action-drawer"><summary><b>Добавить расход</b><span>＋</span></summary><form action={createOperationalExpenseAction} className="compact-form"><input type="hidden" name="returnTo" value={returnTo}/><label>Категория<select name="categoryId" required defaultValue=""><option value="" disabled>Выберите категорию</option>{expenseCategories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label><div className="form-grid"><label>Сумма<input name="amount" required inputMode="decimal"/></label><label>Дата<input name="operationDate" type="date" required defaultValue={todayInputValue()}/></label></div><details className="optional-details"><summary>Добавить детали</summary><label>Комментарий<input name="description" placeholder="Необязательно"/></label><label>Группа<select name="batchId" defaultValue={selectedBatchId}><option value="">Общий расход хозяйства</option>{batches.map((batch) => <option value={batch.id} key={batch.id}>{batch.name}</option>)}</select></label><label>Инкубация<select name="incubationBatchId"><option value="">Не относится к инкубации</option>{incubations.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label></details><PoultryFormActions cancelHref={returnTo}><button className="button primary">Сохранить расход</button></PoultryFormActions></form></details>
    <SectionHeader eyebrow="История" title="Последние операции" action={<Link href={`?period=${period}${query.all === "1" ? "" : "&all=1"}`} className="text-link">{query.all === "1" ? "Свернуть" : "Показать всё"}</Link>}/>
    {visible.length ? <div className="compact-list">{visible.map((expense) => <article className="compact-list-row" key={expense.id}><span><b>{expense.transaction.description}</b><small>{expense.transaction.operationDate.toLocaleDateString("ru-RU")} · {expense.transaction.category?.name ?? "Без категории"}</small></span><span className="row-actions"><strong className="expense">−{formatMoney(expense.transaction.amount.toString())}</strong><DeletePoultryRecordForm id={expense.id} action={deleteOperationalExpenseAction}/></span></article>)}</div> : <EmptyState title="Расходов за период нет" description="Добавьте расход кнопкой сверху."/>}
  </>;
}
