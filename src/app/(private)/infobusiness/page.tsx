import Link from "next/link";

import { AppIcon } from "@/components/ui/icons";
import { SectionHeader } from "@/components/ui/section-header";
import { formatMoney } from "@/lib/money";
import { requireUser } from "@/server/auth";
import { getInfoDashboard } from "@/server/infobusiness";

const labels = { TODAY: "Сегодня", WEEK: "Неделя", MONTH: "Месяц", YEAR: "Год" } as const;

export default async function InfoBusinessPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const user = await requireUser(); const params = await searchParams;
  const period = params.period && params.period in labels ? params.period as keyof typeof labels : "MONTH";
  const { products, sales, expenses, report } = await getInfoDashboard(user.id, period);
  return <>
    <header className="page-header"><div><p className="eyebrow">Инфобизнес</p><h1>Финансы обучения</h1><p className="muted">Доходы и расходы образовательных продуктов без автоматических распределений.</p></div><Link className="button secondary" href="/infobusiness/analytics">Аналитика</Link></header>
    <form className="period-tabs" action="/infobusiness">{Object.entries(labels).map(([value, label]) => <button key={value} name="period" value={value} className={period === value ? "active" : ""}>{label}</button>)}</form>
    <section className="metric-grid family-summary"><article><span>Доход</span><strong className="income">{formatMoney(report.income)}</strong></article><article><span>Расход</span><strong className="expense">{formatMoney(report.expense)}</strong></article><article><span>Прибыль</span><strong>{formatMoney(report.profit)}</strong></article><article><span>Продажи</span><strong>{sales.length}</strong></article></section>
    <SectionHeader eyebrow="Разделы" title="Инфобизнес"/>
    <section className="poultry-section-grid"><Link href="/infobusiness/products" className="poultry-section-card"><AppIcon name="projects"/><b>Продукты / Курсы</b><span>{products.length} активных записей</span></Link><Link href="/infobusiness/sales" className="poultry-section-card"><AppIcon name="sales"/><b>Продажи</b><span>Доходы по продуктам</span></Link><Link href="/infobusiness/expenses" className="poultry-section-card"><AppIcon name="money"/><b>Расходы</b><span>Курс или весь Инфобизнес</span></Link><Link href="/infobusiness/analytics" className="poultry-section-card"><AppIcon name="reports"/><b>Аналитика</b><span>Курсы, категории, сервисы</span></Link></section>
    <SectionHeader eyebrow="Последние операции" title="Недавнее"/>
    <div className="transaction-list">{[...sales.map((sale) => ({ id: sale.id, href: `/infobusiness/sales/${sale.id}`, title: sale.product.name, date: sale.incomeTransaction.operationDate, amount: sale.incomeTransaction.amount.toString(), type: "income" })), ...expenses.map((expense) => ({ id: expense.id, href: `/infobusiness/expenses/${expense.id}`, title: expense.transaction.description ?? expense.category.name, date: expense.transaction.operationDate, amount: expense.transaction.amount.toString(), type: "expense" }))].sort((left, right) => right.date.getTime() - left.date.getTime()).slice(0, 6).map((item) => <Link href={item.href} className="transaction-row" key={item.id}><span><b>{item.title}</b><small>{item.date.toLocaleDateString("ru-RU")}</small></span><strong className={item.type === "income" ? "income" : "expense"}>{item.type === "income" ? "+" : "−"}{formatMoney(item.amount)}</strong></Link>)}</div>
    {sales.length + expenses.length === 0 && <p className="empty">Операций за выбранный период пока нет.</p>}
  </>;
}
