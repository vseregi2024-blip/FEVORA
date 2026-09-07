"use client";

import Link from "next/link";
import { useState } from "react";

type RecentItem = { id: string; href: string; title: string; meta: string; amount: string; outgoing: boolean };
type AccountItem = { id: string; name: string; balance: string };
type Analytics = { income: string; expense: string; result: string; categories: Array<{ name: string; amount: string; percent: number }> };
type Payments = { planned: string; paid: string; remaining: string; overdue: string; overdueCount: number; percent: number };
const palette = ["var(--family-chart-1)", "var(--family-chart-2)", "var(--family-chart-3)", "var(--family-chart-4)", "var(--family-chart-5)", "var(--family-chart-6)"];

export function FamilyMoneyWorkspace({ balance, income, expense, recent, accounts, nearest, analytics, payments, period }: { balance: string; income: string; expense: string; recent: RecentItem[]; accounts: AccountItem[]; nearest: { name: string; meta: string; href: string } | null; analytics: Analytics; payments: Payments; period: "MONTH" | "THREE_MONTHS" | "YEAR" | "CUSTOM" }) {
  const [accountsOpen, setAccountsOpen] = useState(false); let cursor = 0;
  const donut = analytics.categories.length ? `conic-gradient(${analytics.categories.map((item, index) => { const start = cursor; cursor += item.percent; return `${palette[index % palette.length]} ${start}% ${cursor}%`; }).join(", ")})` : "#e7e2d8";
  return <div className="money-workspace family-modern">
    <header className="money-toolbar"><Link href="/dashboard" className="money-global-home">← Главная</Link><div><span>Семья</span><small>{new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" }).format(new Date())}</small></div><button type="button" onClick={() => setAccountsOpen(true)} aria-label="Открыть счета">▣</button></header>
    <section className="money-balance-strip"><span>Баланс семьи</span><strong>{balance}</strong></section>
    <section className="money-month-line" aria-label="Итоги текущего месяца"><span><i className="income-dot"/>Доходы месяца <b>{income}</b></span><span><i className="expense-dot"/>Расходы месяца <b>{expense}</b></span></section>

    <section className="family-insight-section">
      <div className="family-section-heading"><div><small>Аналитика расходов</small><h1>{period === "MONTH" ? "Этот месяц" : period === "THREE_MONTHS" ? "Три месяца" : period === "YEAR" ? "Этот год" : "Выбранный период"}</h1></div><Link href="/family/analytics">Подробнее</Link></div>
      <nav className="family-period-switch" aria-label="Период аналитики"><Link className={period === "MONTH" ? "active" : ""} href="/family?period=MONTH">Месяц</Link><Link className={period === "THREE_MONTHS" ? "active" : ""} href="/family?period=THREE_MONTHS">3 месяца</Link><Link className={period === "YEAR" ? "active" : ""} href="/family?period=YEAR">Год</Link><details className={period === "CUSTOM" ? "active" : ""}><summary>Период</summary><form action="/family"><label>С<input type="date" name="from" required/></label><label>По<input type="date" name="to" required/></label><button>Показать</button></form></details></nav>
      <div className="family-overview-analytics"><div className="family-home-donut" style={{ background: donut }}><span><b>{analytics.expense}</b><small>расходы</small></span></div><div className="family-home-legend">{analytics.categories.slice(0, 5).map((item, index) => <div key={item.name}><i style={{ background: palette[index % palette.length] }}/><span><b>{item.name}</b><small>{item.percent}%</small></span><strong>{item.amount}</strong></div>)}{analytics.categories.length === 0 && <p className="muted">За этот период расходов нет.</p>}</div></div>
      <div className="family-analytics-totals"><span>Доходы <b>{analytics.income}</b></span><span>Расходы <b>{analytics.expense}</b></span><span>Результат <b>{analytics.result}</b></span></div>
    </section>

    <section className="family-payment-progress"><div className="family-section-heading"><div><small>Обязательные платежи месяца</small><h2>{payments.planned}</h2></div><Link href="/family/recurring">Открыть</Link></div><div className="family-payment-track"><i style={{ width: `${Math.max(0, Math.min(100, payments.percent))}%` }}/></div><div className="family-payment-values"><span>Оплачено <b>{payments.paid}</b></span><span>Осталось <b>{payments.remaining}</b></span></div>{payments.overdueCount > 0 && <div className="family-payment-overdue"><span>Просрочено · {payments.overdueCount}</span><b>{payments.overdue}</b></div>}{nearest && <Link href={nearest.href} className="money-reminder"><span>{payments.overdueCount > 0 ? "Требует внимания" : "Ближайший платёж"}</span><b>{nearest.name}</b><small>{nearest.meta}</small></Link>}</section>

    <section className="money-ledger"><div className="money-ledger-heading"><div><small>Последние операции</small><h1>История</h1></div><Link href="/family/operations">Все</Link></div>{recent.map((item) => <Link href={item.href} className="money-ledger-row" key={item.id}><i className={item.outgoing ? "expense-dot" : "income-dot"}/><span><b>{item.title}</b><small>{item.meta}</small></span><strong className={item.outgoing ? "expense" : "income"}>{item.outgoing ? "−" : "+"}{item.amount}</strong></Link>)}{recent.length === 0 && <div className="money-empty"><span>Здесь появятся операции</span><small>Добавьте первую запись через центральный плюс.</small></div>}</section>

    {accountsOpen && <div className="money-drawer-backdrop" onMouseDown={() => setAccountsOpen(false)}><aside className="money-drawer" onMouseDown={(event) => event.stopPropagation()} aria-label="Счета"><header><div><small>Семейные деньги</small><h2>Счета</h2></div><button type="button" onClick={() => setAccountsOpen(false)} aria-label="Закрыть">×</button></header><div className="money-account-list">{accounts.map((account) => <Link href={`/family/operations?accountId=${account.id}`} key={account.id}><span>▣ <b>{account.name}</b></span><strong>{account.balance}</strong></Link>)}{accounts.length === 0 && <p>Счетов пока нет</p>}<Link href="/family/accounts" className="money-add-account">＋ Добавить или настроить счёт</Link></div></aside></div>}
  </div>;
}
