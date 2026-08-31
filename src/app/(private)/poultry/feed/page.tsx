import Link from "next/link";

import { PoultryFormActions } from "@/components/poultry-form-actions";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { todayInputValue } from "@/lib/dates";
import { requireUser } from "@/server/auth";
import { getPoultryDashboard } from "@/server/poultry";
import { createFeedAdjustmentAction, createFeedPurchaseAction, createFeedRateAction, createFeedUsageAction } from "../actions";
import styles from "./feed.module.css";

export default async function FeedPage({ searchParams }: { searchParams: Promise<{ batchId?: string; returnTo?: string }> }) {
  const user = await requireUser();
  const { batches, lots, inventory } = await getPoultryDashboard(user.id);
  const active = batches.filter((batch) => batch.status === "ACTIVE");
  const today = todayInputValue();
  const totalKg = inventory.reduce((sum, item) => sum + Math.max(item.current, 0), 0);
  const query = await searchParams;
  const selectedBatchId = active.some((batch) => batch.id === query.batchId) ? query.batchId ?? "" : "";
  const returnTo = query.returnTo?.startsWith("/poultry") && !query.returnTo.startsWith("//") ? query.returnTo : "/poultry/feed";

  return <>
    <header className="page-header"><div><p className="eyebrow">Птицеводство</p><h1>Корм</h1><p className="muted">Покупки, приблизительное использование и сверка запасов.</p></div><Link href="/poultry" className="button secondary">Обзор</Link></header>
    <section className={`balance-card ${styles.inventoryHero}`}><span>Расчётный запас</span><strong>{totalKg.toFixed(1)} кг</strong><p>Деньги списываются при покупке. В себестоимость корм переходит по мере использования.</p></section>

    <SectionHeader eyebrow="Склад" title="Что есть сейчас" />
    {inventory.length ? <div className="transaction-list">{inventory.map((item) => <article className={styles.inventoryRow} key={item.product.id}><span className={styles.inventoryInfo}><b>{item.product.name}</b><small>Куплено {item.purchased.toFixed(1)} кг · использовано ≈{(item.manual + item.estimated).toFixed(1)} кг</small><small>Средняя стоимость ≈{item.averageCostPerKg.toFixed(2)} ₴/кг</small></span><strong className={styles.inventoryAmount}>{Math.max(item.current, 0).toFixed(1)}<small>кг</small></strong></article>)}</div> : <EmptyState title="Корма пока нет" description="Добавьте первую покупку в килограммах или мешках." />}

    <SectionHeader eyebrow="Действия" title="Корм и нормы" />
    <section className="poultry-action-panels">
      <details id="buy-feed" className="app-card"><summary><b>Купить корм</b><span>＋</span></summary><form action={createFeedPurchaseAction} className="compact-form"><input type="hidden" name="returnTo" value={returnTo}/><label>Название<input name="name" required placeholder="Пшеница" /></label><div className="form-grid"><label>Единица<select name="unit"><option value="KG">Килограммы</option><option value="BAG">Мешки</option><option value="HOUSEHOLD">Бытовая единица</option></select></label><label>Количество<input name="quantity" required inputMode="decimal" placeholder="1000" /></label></div><div className="form-grid"><label>Вес мешка, кг<input name="bagSizeKg" inputMode="decimal" placeholder="Для мешков" /></label><label>Общая сумма<input name="totalAmount" required inputMode="decimal" /></label></div><details className="form-details"><summary>Калибровать кружку / ведро</summary><div className="form-grid"><label>Название единицы<input name="householdUnitName" placeholder="Кружка" /></label><label>Вес единицы, кг<input name="householdUnitKg" inputMode="decimal" placeholder="0,75" /></label></div></details><label>Тип<input name="type" placeholder="Комбикорм, зерно…" /></label><label>Дата<input name="operationDate" type="date" required defaultValue={today} /></label><label>Комментарий<input name="comment" /></label><PoultryFormActions cancelHref={returnTo}><button className="button primary">Купить и добавить</button></PoultryFormActions></form></details>

      <details id="feeding" className="app-card"><summary><b>Установить норму кормления</b><span>＋</span></summary><form action={createFeedRateAction} className="compact-form"><input type="hidden" name="returnTo" value={returnTo}/><label>Группа<select name="batchId" required defaultValue={selectedBatchId}><option value="" disabled>Выберите группу</option>{active.map((batch) => <option value={batch.id} key={batch.id}>{batch.name}</option>)}</select></label><label>Корм<select name="productId" required defaultValue=""><option value="" disabled>Выберите корм</option>{inventory.map((item) => <option value={item.product.id} key={item.product.id}>{item.product.name}</option>)}</select></label><div className="form-grid"><label>В день<input name="dailyQuantity" required inputMode="decimal" placeholder="3" /></label><label>Единица<select name="unit"><option value="KG">кг</option><option value="HOUSEHOLD">кружки / ведра</option><option value="BAG">мешки</option></select></label></div><label>Действует с<input name="effectiveFrom" type="date" required defaultValue={today} /></label><label>Комментарий<input name="comment" /></label><p className="summary-note">При изменении рациона добавьте новую норму с новой датой. Старая история сохранится.</p><PoultryFormActions cancelHref={returnTo}><button className="button secondary">Сохранить норму</button></PoultryFormActions></form></details>

      <details id="assign-feed" className="app-card"><summary><b>Записать фактическую выдачу</b><span>＋</span></summary><form action={createFeedUsageAction} className="compact-form"><input type="hidden" name="returnTo" value={returnTo}/><label>Покупка корма<select name="lotId" required defaultValue=""><option value="" disabled>Выберите лот</option>{lots.map((lot) => <option value={lot.id} key={lot.id}>{lot.product.name} · {lot.purchaseDate.toLocaleDateString("ru-RU")}</option>)}</select></label><label>Группа<select name="batchId" required defaultValue={selectedBatchId}><option value="" disabled>Выберите группу</option>{active.map((batch) => <option value={batch.id} key={batch.id}>{batch.name}</option>)}</select></label><div className="form-grid"><label>Количество<input name="quantity" required inputMode="decimal" /></label><label>Единица<select name="unit"><option value="KG">кг</option><option value="BAG">мешки</option><option value="HOUSEHOLD">бытовая</option></select></label></div><input type="hidden" name="type" value="ASSIGNED"/><label>Дата<input name="operationDate" type="date" required defaultValue={today} /></label><label>Комментарий<input name="comment" /></label><PoultryFormActions cancelHref={returnTo}><button className="button secondary">Записать без нового расхода</button></PoultryFormActions></form></details>

      <details id="feed-reconcile" className="app-card"><summary><b>Сверить запас</b><span>＋</span></summary><form action={createFeedAdjustmentAction} className="compact-form"><input type="hidden" name="returnTo" value={returnTo}/><label>Корм<select name="productId" required defaultValue=""><option value="" disabled>Выберите корм</option>{inventory.map((item) => <option value={item.product.id} key={item.product.id}>{item.product.name} · расчёт {item.current.toFixed(1)} кг</option>)}</select></label><div className="form-grid"><label>Фактически, кг<input name="actualKg" required inputMode="decimal" /></label><label>Дата<input name="operationDate" type="date" required defaultValue={today} /></label></div><label>Комментарий<input name="comment" /></label><PoultryFormActions cancelHref={returnTo}><button className="button secondary">Создать корректировку</button></PoultryFormActions></form></details>
    </section>
  </>;
}
