import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { DeletePoultrySaleForm } from "@/components/delete-poultry-sale-form";
import { formatMoney } from "@/lib/money";
import { todayInputValue } from "@/lib/dates";
import { requireUser } from "@/server/auth";
import { getPoultryDashboard } from "@/server/poultry";
import { createPoultrySaleAction, deletePoultrySaleAction } from "../actions";

export default async function PoultrySalesPage({ searchParams }: { searchParams: Promise<{ batchId?: string }> }) {
  const user = await requireUser();
  const [{ batches, sales }, params] = await Promise.all([getPoultryDashboard(user.id), searchParams]);
  const active = batches.filter((batch) => batch.status === "ACTIVE");
  const selectedBatchId = active.some((batch) => batch.id === params.batchId) ? params.batchId : "";

  return <>
    <header className="page-header"><div><p className="eyebrow">Птицеводство</p><h1>Продажи</h1><p className="muted">Продажа создаёт один доход и уменьшает выбранную партию.</p></div><Link href="/poultry" className="button secondary">Назад</Link></header>
    <section className="family-grid"><article className="app-card"><h2>Новая продажа</h2>{selectedBatchId && <p className="notice">Партия выбрана. Заполните, что и за сколько продали.</p>}<form action={createPoultrySaleAction} className="compact-form"><label>Партия<select name="batchId" defaultValue={selectedBatchId}><option value="">Без привязки</option>{active.map((batch) => <option value={batch.id} key={batch.id}>{batch.name} · {batch.currentQuantity} гол.</option>)}</select></label><div className="form-grid"><label>Покупатель<input name="buyer" placeholder="Необязательно" /></label><label>Что продано<input name="itemName" required placeholder="Курица" /></label></div><div className="form-grid"><label>Количество<input name="quantity" inputMode="numeric" placeholder="или вес" /></label><label>Вес, кг<input name="weightKg" inputMode="decimal" placeholder="или количество" /></label></div><div className="form-grid"><label>Цена за кг / шт.<input name="price" inputMode="decimal" placeholder="180" /></label><label>Итоговая сумма<input name="totalAmount" inputMode="decimal" placeholder="Если известна" /></label></div><label>Дата<input name="operationDate" type="date" required defaultValue={todayInputValue()} /></label><label>Комментарий<input name="comment" placeholder="Необязательно" /></label><button className="button primary">Сохранить продажу</button></form></article><article className="app-card"><h2>Как считается сумма</h2><p className="muted">Укажите цену и количество или вес — сумма посчитается при сохранении. Если вы знаете точный итог, введите его — FEVORA использует его.</p><p className="summary-note">Одна продажа = один доход Poultry + одно уменьшение партии. Дублирующих операций не будет.</p></article></section>
    <section className="section-header"><div><p className="eyebrow">История</p><h2>Все продажи</h2></div></section><div className="transaction-list">{sales.map((sale) => <article className="transaction-row" key={sale.id}><span><b>{sale.itemName}</b><small>{sale.operationDate.toLocaleDateString("ru-RU")}{sale.buyer ? ` · ${sale.buyer}` : ""}{sale.batch ? ` · ${sale.batch.name}` : ""}</small></span><span className="row-actions"><strong className="income">+{formatMoney(sale.totalAmount.toString())}</strong><Link className="text-link" href={`/poultry/sales/${sale.id}`}>Изменить</Link><DeletePoultrySaleForm id={sale.id} action={deletePoultrySaleAction} /></span></article>)}</div>{sales.length === 0 && <EmptyState title="Продаж пока нет" description="Добавьте первую продажу — доход и движение поголовья будут связаны автоматически." />}
  </>;
}
