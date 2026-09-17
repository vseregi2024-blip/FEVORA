import Link from "next/link";

import { AppCard } from "@/components/ui/app-card";
import { SectionHeader } from "@/components/ui/section-header";
import { formatMoney } from "@/lib/money";
import { requireUser } from "@/server/auth";
import { getCosmetologyDashboard } from "@/server/cosmetology";

const labels = { TODAY: "Сегодня", WEEK: "Неделя", MONTH: "Месяц", YEAR: "Год" } as const;

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const user = await requireUser();
  const query = await searchParams;
  const period = query.period && query.period in labels ? query.period as keyof typeof labels : "MONTH";
  const data = await getCosmetologyDashboard(user.id, period);
  const procedures = new Map<string, { count: number; income: number; cost: number }>();
  const clients = new Map<string, { name: string; visits: number; paid: number; last: Date }>();
  const categories = new Map<string, number>();

  for (const visit of data.visits) {
    const procedure = procedures.get(visit.procedureName) ?? { count: 0, income: 0, cost: 0 };
    procedure.count++;
    procedure.cost += Number(visit.costAmount);
    procedures.set(visit.procedureName, procedure);
    const client = clients.get(visit.clientId) ?? { name: `${visit.client.lastName} ${visit.client.firstName}`, visits: 0, paid: 0, last: visit.operationDate };
    client.visits++;
    if (client.last < visit.operationDate) client.last = visit.operationDate;
    clients.set(visit.clientId, client);
  }
  for (const component of data.paymentComponents) {
    const visit = component.payment.visit;
    const procedure = procedures.get(visit.procedureName) ?? { count: 0, income: 0, cost: 0 };
    procedure.income += Number(component.amount);
    procedures.set(visit.procedureName, procedure);
    const client = clients.get(visit.clientId) ?? { name: `${visit.client.lastName} ${visit.client.firstName}`, visits: 0, paid: 0, last: component.operationDate };
    client.paid += Number(component.amount);
    if (client.last < component.operationDate) client.last = component.operationDate;
    clients.set(visit.clientId, client);
  }
  for (const expense of data.expenses) categories.set(expense.category.name, (categories.get(expense.category.name) ?? 0) + Number(expense.transaction.amount));

  return <>
    <header className="page-header"><div><p className="eyebrow">Косметология · Аналитика</p><h1>Результаты</h1></div><div className="button-row"><Link href="/cosmetology/cash" className="button primary">Касса за день</Link><Link href="/cosmetology" className="button secondary">К проекту</Link></div></header>
    <form className="period-tabs" action="/cosmetology/analytics">{Object.entries(labels).map(([value, label]) => <button key={value} name="period" value={value} className={period === value ? "active" : ""}>{label}</button>)}</form>
    <section className="metric-grid family-summary"><article><span>Денежная выручка</span><strong className="income">{formatMoney(data.report.income)}</strong></article><article><span>Денежные расходы</span><strong className="expense">{formatMoney(data.report.cashExpense)}</strong></article><article><span>Себестоимость процедур</span><strong>{formatMoney(data.report.cost)}</strong></article><article><span>Денежный результат</span><strong>{formatMoney(data.report.result)}</strong></article></section>
    <section className="family-grid"><AppCard><h2>По процедурам</h2><div className="mini-list">{Array.from(procedures).map(([name, result]) => <div key={name}><span><b>{name}</b><small>{result.count} · получено {formatMoney(result.income.toFixed(2))} · себестоимость {formatMoney(result.cost.toFixed(2))}</small></span><b className="income">{formatMoney((result.income - result.cost).toFixed(2))}</b></div>)}</div></AppCard><AppCard><h2>По клиентам</h2><div className="mini-list">{Array.from(clients).map(([id, client]) => <Link href={`/cosmetology/clients/${id}`} key={id}><div><span><b>{client.name}</b><small>{client.visits} виз. · получено {formatMoney(client.paid.toFixed(2))} · {client.last.toLocaleDateString("ru-RU")}</small></span><b>{formatMoney(client.paid.toFixed(2))}</b></div></Link>)}</div></AppCard></section>
    <SectionHeader title="Расходы по категориям"/><AppCard><div className="mini-list">{Array.from(categories).map(([name, amount]) => <div key={name}><span>{name}</span><b className="expense">{formatMoney(amount.toFixed(2))}</b></div>)}</div></AppCard>
    <SectionHeader title="Склад"/><AppCard><div className="mini-list">{data.items.map((item) => <div key={item.id}><span><b>{item.name}</b><small>остаток {item.currentQuantity.toString()} · закупочных партий {item.lots.length}</small></span><b>{formatMoney(item.lots.reduce((sum, lot) => sum + Number(lot.availableQuantity) * Number(lot.unitCost), 0).toFixed(2))}</b></div>)}</div></AppCard>
  </>;
}
