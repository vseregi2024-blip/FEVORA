import Link from "next/link";

import { AppCard } from "@/components/ui/app-card";
import { SectionHeader } from "@/components/ui/section-header";
import { formatMoney } from "@/lib/money";
import { requireUser } from "@/server/auth";
import { getInfoAnalytics } from "@/server/infobusiness";

const labels = { TODAY: "Сегодня", WEEK: "Неделя", MONTH: "Месяц", YEAR: "Год" } as const;

export default async function InfoAnalyticsPage({ searchParams }: { searchParams: Promise<{ period?: string; productId?: string; categoryId?: string }> }) {
  const user = await requireUser(); const params = await searchParams; const period = params.period && params.period in labels ? params.period as keyof typeof labels : "MONTH";
  const analytics = await getInfoAnalytics(user.id, period, { productId: params.productId, categoryId: params.categoryId });
  return <><header className="page-header"><div><p className="eyebrow">Инфобизнес · Аналитика</p><h1>Результаты</h1><p className="muted">Расходы по курсам и общие расходы показаны отдельно.</p></div><Link className="button secondary" href="/infobusiness">К финансам</Link></header>
    <form className="period-tabs" action="/infobusiness/analytics">{Object.entries(labels).map(([value, label]) => <button key={value} name="period" value={value} className={period === value ? "active" : ""}>{label}</button>)}</form><form className="filters" action="/infobusiness/analytics"><input type="hidden" name="period" value={period}/><select name="productId" defaultValue={params.productId ?? ""}><option value="">Все продукты</option>{analytics.products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select><select name="categoryId" defaultValue={params.categoryId ?? ""}><option value="">Все категории расходов</option>{analytics.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select><button className="button secondary">Фильтровать</button></form>
    <section className="metric-grid family-summary"><article><span>Доход</span><strong className="income">{formatMoney(analytics.report.income)}</strong></article><article><span>Расход</span><strong className="expense">{formatMoney(analytics.report.expense)}</strong></article><article><span>Прибыль</span><strong>{formatMoney(analytics.report.profit)}</strong></article></section>
    <SectionHeader title="Результаты по продуктам"/><AppCard><div className="mini-list">{analytics.productRows.map((row) => <Link href={`/infobusiness/products/${row.id}`} key={row.id}><div><span><b>{row.name}</b><small>мест: {row.sales} · доход: {formatMoney(row.income)} · расходы курса: {formatMoney(row.expense)}</small></span><b className="income">{formatMoney(row.profit)}</b></div></Link>)}{analytics.productRows.length === 0 && <p className="muted">Операций по продуктам за период нет.</p>}</div></AppCard>
    <section className="family-grid"><AppCard><h2>Расходы по категориям</h2><div className="mini-list">{analytics.categoryRows.map((row) => <Link href={`/infobusiness/analytics?period=${period}&categoryId=${row.id}`} key={row.id}><div><span>{row.name}</span><b className="expense">{formatMoney(row.amount)}</b></div></Link>)}{analytics.categoryRows.length === 0 && <p className="muted">Расходов за период нет.</p>}</div></AppCard><AppCard><h2>Сервисы и подписки</h2><div className="mini-list">{analytics.serviceRows.map((row) => <div key={row.name}><span>{row.name}</span><b className="expense">{formatMoney(row.amount)}</b></div>)}{analytics.serviceRows.length === 0 && <p className="muted">Сервисы с названием пока не добавлены.</p>}</div></AppCard></section>
  </>;
}
