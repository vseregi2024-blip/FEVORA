import Link from "next/link";

import { DeletePoultrySaleForm } from "@/components/delete-poultry-sale-form";
import { PoultrySaleForm } from "@/components/poultry-sale-form";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { formatMoney } from "@/lib/money";
import { requireUser } from "@/server/auth";
import { getPoultryDashboard } from "@/server/poultry";
import { createPoultrySaleAction, deletePoultrySaleAction } from "../actions";

export default async function PoultrySalesPage({ searchParams }: { searchParams: Promise<{ batchId?: string; returnTo?: string; period?: string; all?: string; type?: string }> }) {
  const user = await requireUser();
  const [{ batches, sales }, params] = await Promise.all([getPoultryDashboard(user.id), searchParams]);
  const active = batches.filter((batch) => batch.status === "ACTIVE");
  const selectedBatchId = active.some((batch) => batch.id === params.batchId) ? params.batchId ?? "" : "";
  const returnTo = params.returnTo?.startsWith("/poultry") && !params.returnTo.startsWith("//") ? params.returnTo : "/poultry/sales";
  const period = ["week", "month", "year", "all"].includes(params.period ?? "") ? params.period! : "month";
  const now = new Date();
  const start = period === "week" ? new Date(now.getTime() - 7 * 86400000) : period === "year" ? new Date(Date.UTC(now.getUTCFullYear(), 0, 1)) : period === "all" ? new Date(0) : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const periodSales = sales.filter((sale) => sale.operationDate >= start);
  const visible = params.all === "1" ? periodSales : periodSales.slice(0, 5);

  return <>
    <header className="page-header compact-page-header"><div><p className="eyebrow">Птицеводство</p><h1>Продажи</h1><p className="muted">Доход и движение птицы связываются автоматически</p></div><Link href="/poultry/sales#new-sale" className="button primary">＋ Продажа</Link></header>
    <nav className="chip-tabs"><Link href="?period=week" className={period === "week" ? "active" : ""}>Неделя</Link><Link href="?period=month" className={period === "month" ? "active" : ""}>Месяц</Link><Link href="?period=year" className={period === "year" ? "active" : ""}>Год</Link><Link href="?period=all" className={period === "all" ? "active" : ""}>Всё</Link></nav>
    <section className="balance-card compact-money-hero"><span>Продажи за период</span><strong>{formatMoney(periodSales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0).toFixed(2))}</strong><p>{periodSales.length} операций</p></section>
    <details id="new-sale" className="app-card action-drawer"><summary><b>Добавить продажу</b><span>＋</span></summary>{selectedBatchId && <p className="notice">Партия выбрана.</p>}<PoultrySaleForm batches={active.map((batch) => ({ id: batch.id, name: batch.name, currentQuantity: batch.currentQuantity }))} selectedBatchId={selectedBatchId} initialSaleType={params.type} returnTo={returnTo} action={createPoultrySaleAction}/></details>
    <SectionHeader eyebrow="История" title="Последние операции" action={<Link href={`?period=${period}${params.all === "1" ? "" : "&all=1"}`} className="text-link">{params.all === "1" ? "Свернуть" : "Показать всё"}</Link>}/>
    {visible.length ? <div className="compact-list">{visible.map((sale) => <article className="compact-list-row" key={sale.id}><span><b>{sale.itemName}</b><small>{sale.operationDate.toLocaleDateString("ru-RU")}{sale.buyer ? ` · ${sale.buyer}` : ""}{sale.batch ? ` · ${sale.batch.name}` : ""}</small></span><span className="row-actions"><strong className="income">+{formatMoney(sale.totalAmount.toString())}</strong><Link className="text-link" href={`/poultry/sales/${sale.id}?returnTo=${encodeURIComponent("/poultry/sales")}`}>Изменить</Link><DeletePoultrySaleForm id={sale.id} action={deletePoultrySaleAction}/></span></article>)}</div> : <EmptyState title="Продаж за период нет" description="Добавьте продажу кнопкой сверху."/>}
  </>;
}
