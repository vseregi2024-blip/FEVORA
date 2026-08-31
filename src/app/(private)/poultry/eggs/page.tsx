import Link from "next/link";

import { DeletePoultryRecordForm } from "@/components/delete-poultry-record-form";
import { PoultryFormActions } from "@/components/poultry-form-actions";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { todayInputValue } from "@/lib/dates";
import { requireUser } from "@/server/auth";
import { getPoultryDashboard } from "@/server/poultry";
import { createEggCollectionAction, deleteEggCollectionAction } from "../actions";

export default async function PoultryEggsPage({ searchParams }: { searchParams: Promise<{ batchId?: string; returnTo?: string }> }) {
  const user = await requireUser();
  const { batches, eggs, sales } = await getPoultryDashboard(user.id, "MONTH");
  const collected = eggs.reduce((sum, item) => sum + item.quantity, 0);
  const sold = sales.filter((sale) => sale.saleType === "EGGS").reduce((sum, sale) => sum + (sale.quantity ?? 0), 0);
  const query = await searchParams;
  const selectedBatchId = batches.some((batch) => batch.id === query.batchId) ? query.batchId ?? "" : "";
  const returnTo = query.returnTo?.startsWith("/poultry") && !query.returnTo.startsWith("//") ? query.returnTo : "/poultry/eggs";
  return <>
    <header className="page-header"><div><p className="eyebrow">Птицеводство</p><h1>Яйца</h1><p className="muted">Сбор записывается по желанию. Продажи учитываются точно и никогда не меняют поголовье.</p></div><Link href="/poultry" className="button secondary">Обзор</Link></header>
    <section className="metric-grid"><article><span>Собрано за месяц</span><strong>{collected}</strong></article><article><span>Продано</span><strong>{sold}</strong></article></section>
    <SectionHeader eyebrow="Быстро" title="Записать сбор" />
    <article id="collect" className="app-card"><form action={createEggCollectionAction} className="compact-form"><input type="hidden" name="returnTo" value={returnTo}/><label>Группа<select name="batchId" defaultValue={selectedBatchId}><option value="">Общий сбор / неизвестно</option>{batches.filter((batch) => batch.status === "ACTIVE").map((batch) => <option value={batch.id} key={batch.id}>{batch.name}</option>)}</select></label><div className="form-grid"><label>Порода<input name="breed" placeholder="Необязательно" /></label><label>Количество<input name="quantity" required inputMode="numeric" /></label></div><label>Дата<input name="operationDate" type="date" required defaultValue={todayInputValue()} /></label><label>Комментарий<input name="comment" /></label><PoultryFormActions cancelHref={returnTo}><button className="button primary">Добавить яйца</button></PoultryFormActions></form></article>
    <SectionHeader eyebrow="История" title="Внесённые сборы" action={<Link href="/poultry/sales" className="text-link">Продать яйца →</Link>} />
    {eggs.length ? <div className="transaction-list">{eggs.map((item) => <article className="transaction-row" key={item.id}><span><b>+{item.quantity} яиц</b><small>{item.operationDate.toLocaleDateString("ru-RU")} · {item.batch?.name ?? item.breed ?? "Общий сбор"}</small></span><DeletePoultryRecordForm id={item.id} action={deleteEggCollectionAction}/></article>)}</div> : <EmptyState title="Сборов пока нет" description="Это не ошибка: учёт яиц необязательный." />}
  </>;
}
