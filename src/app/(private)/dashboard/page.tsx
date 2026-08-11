import Link from "next/link";

import { dateFromInput, todayInputValue } from "@/lib/dates";
import { formatMoney, minorUnitsToMoney, moneyToMinorUnits } from "@/lib/money";
import { getFinancialSummary, getTransactions } from "@/server/finance";
import { requireUser } from "@/server/auth";

export default async function DashboardPage() {
  const user = await requireUser();
  const today = todayInputValue();
  const monthStart = `${today.slice(0, 7)}-01`;
  const [allTime, month, recent] = await Promise.all([
    getFinancialSummary(user.id),
    getFinancialSummary(user.id, dateFromInput(monthStart), dateFromInput(today)),
    getTransactions(user.id),
  ]);
  const difference = minorUnitsToMoney(moneyToMinorUnits(month.income) - moneyToMinorUnits(month.expense));
  return <><header className="page-header"><div><p className="eyebrow">Головна</p><h1>Добрий день{user.name ? `, ${user.name}` : ""}</h1></div><Link className="button primary" href="/finance/new">+ Додати операцію</Link></header><section className="balance-card"><p>Поточний баланс</p><strong>{formatMoney(allTime.balance, user.defaultCurrency)}</strong><span>Стартовий залишок і всі активні операції</span></section><section className="metric-grid"><article><span>Доходи за місяць</span><strong className="income">{formatMoney(month.income)}</strong></article><article><span>Витрати за місяць</span><strong className="expense">{formatMoney(month.expense)}</strong></article><article><span>Різниця за місяць</span><strong>{formatMoney(difference)}</strong></article></section><section className="section-header"><div><h2>Останні операції</h2><p className="muted">Ваші п&apos;ять найновіших записів</p></div><Link href="/finance" className="text-link">Весь журнал</Link></section><div className="transaction-list">{recent.slice(0, 5).map((transaction) => <Link href={`/finance/${transaction.id}`} className="transaction-row" key={transaction.id}><span><b>{transaction.category?.name ?? "Без категорії"}</b><small>{transaction.operationDate.toLocaleDateString("uk-UA")} · {transaction.module}</small></span><strong className={transaction.type === "EXPENSE" || transaction.type === "SAVING_IN" ? "expense" : "income"}>{transaction.type === "EXPENSE" || transaction.type === "SAVING_IN" ? "−" : "+"}{formatMoney(transaction.amount.toString())}</strong></Link>)}{recent.length === 0 && <p className="empty">Операцій поки немає. Додайте першу.</p>}</div></>;
}
