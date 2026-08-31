import Link from "next/link";

import { AppCard } from "@/components/ui/app-card";
import { SectionHeader } from "@/components/ui/section-header";
import { formatMoney } from "@/lib/money";
import { requireUser } from "@/server/auth";
import { getPoultryAnalytics, type PoultryPeriod } from "@/server/poultry";

const periods: Record<PoultryPeriod, string> = { TODAY: "Сегодня", WEEK: "Неделя", MONTH: "Месяц", YEAR: "Год", ALL: "Всё время" };

export default async function PoultryAnalyticsPage({ searchParams }: { searchParams: Promise<{ period?: string; from?: string; to?: string }> }) {
  const user = await requireUser();
  const params = await searchParams;
  const period = params.period && params.period in periods ? params.period as PoultryPeriod : "MONTH";
  const data = await getPoultryAnalytics(user.id, period, params.from && params.to ? { from: params.from, to: params.to } : undefined);
  const equipment = data.report.expensesByCategory.find((item) => item.name === "Оборудование" || item.name === "Обладнання і матеріали")?.amount ?? "0.00";
  return <>
    <header className="page-header"><div><p className="eyebrow">Птицеводство</p><h1>Аналитика</h1><p className="muted">Деньги, поголовье и производственная стоимость показаны отдельно.</p></div><Link href="/poultry" className="button secondary">Обзор</Link></header>
    <form className="period-tabs" action="/poultry/analytics">{Object.entries(periods).map(([value,label]) => <button key={value} name="period" value={value} className={!params.from && period === value ? "active" : ""}>{label}</button>)}</form>
    <form className="filters poultry-date-filter" action="/poultry/analytics"><label>С<input name="from" type="date" defaultValue={params.from}/></label><label>По<input name="to" type="date" defaultValue={params.to}/></label><button className="button secondary">Показать</button></form>

    <SectionHeader eyebrow="Финансы" title="Реальные деньги" />
    <section className="metric-grid poultry-summary"><article><span>Доходы</span><strong className="income">{formatMoney(data.report.income)}</strong></article><article><span>Расходы</span><strong className="expense">{formatMoney(data.report.expense)}</strong></article><article><span>Cash difference</span><strong>{formatMoney(data.report.result)}</strong></article><article><span>Оборудование</span><strong>{formatMoney(equipment)}</strong></article></section>

    <SectionHeader eyebrow="Птица" title="Поголовье и события" />
    <section className="metric-grid poultry-summary"><article><span>Сейчас</span><strong>{data.flock.current}</strong></article><article><span>Продано</span><strong>{data.flock.sold}</strong></article><article><span>Падёж</span><strong>{data.flock.mortality}</strong></article><article><span>Для семьи / забой</span><strong>{data.flock.family}</strong></article></section>

    <SectionHeader eyebrow="Себестоимость" title="По живым группам" />
    <div className="transaction-list">{data.batches.filter((batch) => batch.status === "ACTIVE").map((batch) => <Link href={`/poultry/flock/${batch.id}`} className="transaction-row" key={batch.id}><span><b>{batch.name}</b><small>Накоплено {formatMoney(batch.productionCost.total.toFixed(2))}</small></span><strong>{batch.currentQuantity ? formatMoney((batch.productionCost.total / batch.currentQuantity).toFixed(2)) : "—"}/гол.</strong></Link>)}</div>

    <SectionHeader eyebrow="Корм" title="Запасы и использование" />
    <section className="family-grid"><AppCard><h2>Расчётный склад</h2><div className="mini-list">{data.inventory.map((item) => <div key={item.product.id}><span>{item.product.name}<small>куплено {item.purchased.toFixed(1)} · использовано ≈{(item.manual+item.estimated).toFixed(1)} кг</small></span><b>{item.current.toFixed(1)} кг</b></div>)}</div></AppCard><AppCard><h2>Расходы по категориям</h2><div className="mini-list">{data.report.expensesByCategory.map((item) => <div key={item.name}><span>{item.name}</span><b className="expense">{formatMoney(item.amount)}</b></div>)}</div></AppCard></section>

    <SectionHeader eyebrow="Яйца и инкубация" title="Внесённые данные" />
    <section className="metric-grid poultry-summary"><article><span>Собрано яиц</span><strong>{data.eggStats.collected}</strong></article><article><span>Продано яиц</span><strong>{data.eggStats.sold}</strong></article><article><span>Закладок</span><strong>{data.incubationStats.count}</strong></article><article><span>Вылупилось</span><strong>{data.incubationStats.hatched}</strong></article></section>
  </>;
}
