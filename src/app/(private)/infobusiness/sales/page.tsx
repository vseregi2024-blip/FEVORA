import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { InfoSaleForm } from "@/components/infobusiness-sale-form";
import { formatMoney } from "@/lib/money";
import { todayInputValue } from "@/lib/dates";
import { requireUser } from "@/server/auth";
import { getInfoDashboard } from "@/server/infobusiness";
import { createInfoSaleAction } from "../actions";

export default async function InfoSalesPage() {
  const user = await requireUser(); const { products, sales } = await getInfoDashboard(user.id);
  const available = products.filter((product) => product.status !== "ARCHIVED");
  return <><header className="page-header"><div><p className="eyebrow">Инфобизнес · Продажи</p><h1>Продажи обучения</h1><p className="muted">Одна продажа создаёт ровно один доход.</p></div><Link href="/infobusiness" className="button secondary">Назад</Link></header>
    <section className="family-grid"><article className="app-card"><h2>Новая продажа</h2>{available.length ? <InfoSaleForm products={available.map((product) => ({ id: product.id, name: product.name, basePrice: product.basePrice?.toString() ?? null }))} action={createInfoSaleAction} defaultDate={todayInputValue()} /> : <p className="muted">Сначала добавьте продукт обучения.</p>}</article><article className="app-card"><h2>Гибкая цена</h2><p className="muted">Базовая цена подставляется для новой продажи, но её можно изменить для скидки или индивидуальной договорённости.</p></article></section>
    <section className="section-header"><div><p className="eyebrow">История</p><h2>Все продажи</h2></div></section><div className="transaction-list">{sales.map((sale) => <article className="transaction-row" key={sale.id}><span><b>{sale.product.name}</b><small>{sale.incomeTransaction.operationDate.toLocaleDateString("ru-RU")}{sale.buyer ? ` · ${sale.buyer}` : ""}{sale.seats !== 1 ? ` · ${sale.seats} мест` : ""}</small>{(sale.buyerPhone || sale.buyerEmail) && <small>{[sale.buyerPhone, sale.buyerEmail].filter(Boolean).join(" · ")}</small>}</span><span className="row-actions">{sale.instagramUrl && <a className="text-link" href={sale.instagramUrl} target="_blank" rel="noreferrer">Instagram ↗</a>}<Link className="text-link" href={`/infobusiness/sales/${sale.id}`}>Изменить</Link><strong className="income">+{formatMoney(sale.incomeTransaction.amount.toString())}</strong></span></article>)}</div>{sales.length === 0 && <EmptyState title="Продаж пока нет" description="Добавьте продажу обучения — она сразу попадёт в доход Инфобизнеса."/>}</>;
}
