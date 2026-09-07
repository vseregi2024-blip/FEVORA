import Link from "next/link";

import { formatMoney } from "@/lib/money";
import { requireUser } from "@/server/auth";
import { getPoultryAnalytics, type PoultryPeriod } from "@/server/poultry";

const periods: Record<PoultryPeriod, string> = { TODAY: "Сегодня", WEEK: "Неделя", MONTH: "Месяц", YEAR: "Год", ALL: "Всё" };

export default async function PoultryAnalyticsPage({ searchParams }: { searchParams: Promise<{ period?: string; tab?: string }> }) {
  const user = await requireUser();
  const params = await searchParams;
  const period = params.period && params.period in periods ? params.period as PoultryPeriod : "MONTH";
  const tab = ["money", "flock", "cost"].includes(params.tab ?? "") ? params.tab! : "money";
  const data = await getPoultryAnalytics(user.id, period);
  const equipment = data.report.expensesByCategory.find((item) => item.name === "Оборудование" || item.name === "Обладнання і матеріали")?.amount ?? "0.00";
  const tabHref = (nextTab: string) => `/poultry/analytics?period=${period}&tab=${nextTab}`;

  return <>
    <header className="page-header compact-page-header"><div><p className="eyebrow">Птицеводство</p><h1>Аналитика</h1><p className="muted">Деньги, поголовье и себестоимость отдельно</p></div></header>
    <form className="period-tabs" action="/poultry/analytics"><input type="hidden" name="tab" value={tab}/>{Object.entries(periods).map(([value, label]) => <button key={value} name="period" value={value} className={period === value ? "active" : ""}>{label}</button>)}</form>
    <nav className="segment-tabs"><Link href={tabHref("money")} className={tab === "money" ? "active" : ""}>Деньги</Link><Link href={tabHref("flock")} className={tab === "flock" ? "active" : ""}>Поголовье</Link><Link href={tabHref("cost")} className={tab === "cost" ? "active" : ""}>Себестоимость</Link></nav>
    {tab === "money" && <section className="metric-grid analytics-grid"><article><span>Доходы</span><strong className="income">{formatMoney(data.report.income)}</strong></article><article><span>Расходы</span><strong className="expense">{formatMoney(data.report.expense)}</strong></article><article><span>Разница доходов и расходов</span><strong>{formatMoney(data.report.result)}</strong></article><article><span>Оборудование</span><strong>{formatMoney(equipment)}</strong></article></section>}
    {tab === "flock" && <section className="metric-grid analytics-grid"><article><span>Сейчас</span><strong>{data.flock.current}</strong></article><article><span>Продано</span><strong>{data.flock.sold}</strong></article><article><span>Падёж</span><strong>{data.flock.mortality}</strong></article><article><span>Семья / забой</span><strong>{data.flock.family}</strong></article></section>}
    {tab === "cost" && <div className="compact-list">{data.batches.filter((batch) => batch.status === "ACTIVE").map((batch) => <Link href={`/poultry/flock/${batch.id}`} className="compact-list-row" key={batch.id}><span><b>{batch.name}</b><small>{batch.currentQuantity} голов · накоплено {formatMoney(batch.productionCost.total.toFixed(2))}</small></span><strong>{batch.currentQuantity ? formatMoney((batch.productionCost.total / batch.currentQuantity).toFixed(2)) : "—"}/гол.</strong></Link>)}</div>}
  </>;
}
