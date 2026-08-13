import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { SaleForm } from "@/components/goods/sale-form";
import { formatMoney } from "@/lib/money";
import { requireUser } from "@/server/auth";
import { getGoodsDashboard } from "@/server/goods";

import { createSaleAction } from "../actions";

export default async function SalesPage() {
  const user = await requireUser();
  const { products, sales } = await getGoodsDashboard(user.id);
  const availableProducts = products.filter((product) => product.currentQuantity > 0).map((product) => ({ id: product.id, name: product.name, currentQuantity: product.currentQuantity, defaultSalePrice: product.defaultSalePrice?.toString() ?? null }));

  return <>
    <header className="page-header"><div><p className="eyebrow">Товарка</p><h1>Продажи</h1><p className="muted">Товар списывается по FIFO, а прибыль считается автоматически.</p></div><Link href="/goods" className="button secondary">Назад</Link></header>
    <section className="family-grid"><article className="app-card"><h2>Новая продажа</h2><SaleForm action={createSaleAction} products={availableProducts} /></article><article className="app-card"><h2>Что произойдёт</h2><p className="muted">Система создаст один доход, уменьшит склад и автоматически рассчитает себестоимость по ранним закупочным партиям.</p><p className="summary-note">Себестоимость — аналитика, она не создаёт второй расход денег.</p></article></section>
    <section className="section-header"><div><p className="eyebrow">История</p><h2>Все продажи</h2></div></section>
    <div className="transaction-list">{sales.map((sale) => <Link href={`/goods/sales/${sale.id}`} className="transaction-row" key={sale.id}><span><b>{sale.product.name}</b><small>{sale.operationDate.toLocaleDateString("ru-RU")} · {sale.quantity} шт.{sale.buyer ? ` · ${sale.buyer}` : ""}<br />Себестоимость {formatMoney(sale.costOfGoods.toString())} · прибыль {formatMoney(sale.profitAmount.toString())}</small></span><strong className="income">+{formatMoney(sale.totalAmount.toString())}</strong></Link>)}</div>
    {sales.length === 0 && <EmptyState title="Продаж пока нет" description="Добавьте первую продажу — FEVORA сама распределит FIFO-себестоимость." />}
  </>;
}
