import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { DeletePoultrySaleForm } from "@/components/delete-poultry-sale-form";
import { PoultrySaleForm } from "@/components/poultry-sale-form";
import { formatMoney } from "@/lib/money";
import { requireUser } from "@/server/auth";
import { getPoultryDashboard } from "@/server/poultry";
import { createPoultrySaleAction, deletePoultrySaleAction } from "../actions";

export default async function PoultrySalesPage({ searchParams }: { searchParams: Promise<{ batchId?: string }> }) {
  const user = await requireUser();
  const [{ batches, sales }, params] = await Promise.all([getPoultryDashboard(user.id), searchParams]);
  const active = batches.filter((batch) => batch.status === "ACTIVE");
  const selectedBatchId = active.some((batch) => batch.id === params.batchId) ? params.batchId ?? "" : "";

  return <>
    <header className="page-header"><div><p className="eyebrow">Птицеводство</p><h1>Продажи</h1><p className="muted">Продажа создаёт один доход и уменьшает выбранную партию.</p></div><Link href="/poultry" className="button secondary">Назад</Link></header>
    <section className="family-grid"><article className="app-card"><h2>Новая продажа</h2>{selectedBatchId && <p className="notice">Партия выбрана. Заполните, что и за сколько продали.</p>}<PoultrySaleForm batches={active.map((batch) => ({ id: batch.id, name: batch.name, currentQuantity: batch.currentQuantity }))} selectedBatchId={selectedBatchId} action={createPoultrySaleAction} /></article><article className="app-card"><h2>Как считается сумма</h2><p className="muted">Вес и цену можно вводить через запятую или точку: <b>4,600</b> и <b>4.600</b> означают одно и то же.</p><p className="summary-note">Если указан вес, итог считается как вес × цена. Количество при этом уменьшает птицу в партии. Если веса нет — итог считается как количество × цена.</p></article></section>
    <section className="section-header"><div><p className="eyebrow">История</p><h2>Все продажи</h2></div></section><div className="transaction-list">{sales.map((sale) => <article className="transaction-row" key={sale.id}><span><b>{sale.itemName}</b><small>{sale.operationDate.toLocaleDateString("ru-RU")}{sale.buyer ? ` · ${sale.buyer}` : ""}{sale.batch ? ` · ${sale.batch.name}` : ""}</small></span><span className="row-actions"><strong className="income">+{formatMoney(sale.totalAmount.toString())}</strong><Link className="text-link" href={`/poultry/sales/${sale.id}`}>Изменить</Link><DeletePoultrySaleForm id={sale.id} action={deletePoultrySaleAction} /></span></article>)}</div>{sales.length === 0 && <EmptyState title="Продаж пока нет" description="Добавьте первую продажу — доход и движение поголовья будут связаны автоматически." />}
  </>;
}
