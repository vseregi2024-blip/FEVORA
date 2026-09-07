import Link from "next/link";

import { PoultryFormActions } from "@/components/poultry-form-actions";
import { SectionHeader } from "@/components/ui/section-header";
import { todayInputValue } from "@/lib/dates";
import { requireUser } from "@/server/auth";
import { getFeedWorkspace } from "@/server/poultry";
import { createFeedAdjustmentAction, createFeedPurchaseAction, createFeedRateAction, createFeedUsageAction } from "../actions";

const operationLabel = { PURCHASE: "Покупка", USAGE: "Использование", ADJUSTMENT: "Коррекция" } as const;

export default async function FeedPage({ searchParams }: { searchParams: Promise<{ batchId?: string; returnTo?: string; all?: string }> }) {
  const user = await requireUser();
  const data = await getFeedWorkspace(user.id);
  const active = data.batches.filter((batch) => batch.status === "ACTIVE");
  const today = todayInputValue();
  const totalKg = data.inventory.reduce((sum, item) => sum + item.current, 0);
  const lowStock = data.inventory.filter((item) => item.current <= Number(item.product.minimumStockKg));
  const query = await searchParams;
  const selectedBatchId = active.some((batch) => batch.id === query.batchId) ? query.batchId ?? "" : "";
  const returnTo = query.returnTo?.startsWith("/poultry") && !query.returnTo.startsWith("//") ? query.returnTo : "/poultry/feed";
  const operations = query.all === "1" ? data.operations : data.operations.slice(0, 5);

  return <>
    <header className="page-header compact-page-header"><div><p className="eyebrow">Птицеводство</p><h1>Корм</h1><p className="muted">Склад и ежедневные операции</p></div></header>
    <section className="balance-card feed-summary"><span>На складе</span><strong>{totalKg.toFixed(1)} кг</strong><p>{data.dailyKg > 0 ? `Приблизительно на ${Math.floor(totalKg / data.dailyKg)} дней` : "Нормы кормления не настроены"}</p><p>{lowStock.length ? `${lowStock.length} поз. заканчиваются` : "Низких остатков нет"}</p></section>

    <section className="compact-section"><h2>Основные действия</h2><div className="action-button-grid"><Link href="/poultry/feed?returnTo=%2Fpoultry%2Ffeed#buy-feed" className="button primary">Купить корм</Link><Link href="/poultry/feed?returnTo=%2Fpoultry%2Ffeed#assign-feed" className="button secondary">Использовать / открыть мешок</Link><Link href="/poultry/feed?returnTo=%2Fpoultry%2Ffeed#feed-reconcile" className="button secondary">Инвентаризация</Link><Link href="/poultry/feed/stock" className="button secondary">Посмотреть остатки</Link></div></section>

    <section className="poultry-action-panels hidden-forms">
      <details id="buy-feed" className="app-card action-drawer"><summary><b>Покупка корма</b><span>＋</span></summary><form action={createFeedPurchaseAction} className="compact-form"><input type="hidden" name="returnTo" value={returnTo}/><label>Корм или добавка<input name="name" required placeholder="Пшеница" list="feed-products"/></label><datalist id="feed-products">{data.inventory.map((item) => <option key={item.product.id} value={item.product.name}/>)}</datalist><label>Категория<select name="type" defaultValue="Комбикорм"><option>Зерно</option><option>Комбикорм</option><option>Добавки</option></select></label><div className="form-grid"><label>Количество мешков<input name="bags" inputMode="numeric" placeholder="Необязательно"/></label><label>Вес мешка, кг<input name="bagSizeKg" inputMode="decimal" placeholder="Необязательно"/></label></div><input type="hidden" name="unit" value="KG"/><label>Общее количество, кг<input name="quantity" required inputMode="decimal"/></label><div className="form-grid"><label>Сумма за корм, ₴<input name="totalAmount" required inputMode="decimal"/></label><label>Доставка, ₴<input name="deliveryAmount" inputMode="decimal" placeholder="Необязательно"/></label></div><label>Поставщик<input name="supplier" placeholder="Необязательно"/></label><label>Дата<input name="operationDate" type="date" required defaultValue={today}/></label><label>Комментарий<input name="comment"/></label><p className="summary-note">Будет создан один денежный расход: стоимость корма плюс доставка.</p><PoultryFormActions cancelHref={returnTo}><button className="button primary">Сохранить покупку</button></PoultryFormActions></form></details>

      <details id="assign-feed" className="app-card action-drawer"><summary><b>Использовать / открыть мешок</b><span>＋</span></summary><form action={createFeedUsageAction} className="compact-form"><input type="hidden" name="returnTo" value={returnTo}/><label>Корм<select name="lotId" required defaultValue=""><option value="" disabled>Выберите корм</option>{data.lots.map((lot) => <option value={lot.id} key={lot.id}>{lot.product.name} · {lot.purchaseDate.toLocaleDateString("ru-RU")}</option>)}</select></label><div className="form-grid"><label>Количество<input name="quantity" required inputMode="decimal"/></label><label>Единица<select name="unit"><option value="KG">килограммы</option><option value="BAG">мешки</option></select></label></div><label>Группа птицы — необязательно<select name="batchId" defaultValue={selectedBatchId}><option value="">Без привязки</option>{active.map((batch) => <option value={batch.id} key={batch.id}>{batch.name}</option>)}</select></label><input type="hidden" name="type" value="ASSIGNED"/><label>Дата<input name="operationDate" type="date" required defaultValue={today}/></label><label>Комментарий<input name="comment"/></label><p className="summary-note">Остаток уменьшится. Новый денежный расход не создаётся.</p><PoultryFormActions cancelHref={returnTo}><button className="button primary">Сохранить использование</button></PoultryFormActions></form></details>

      <details id="feed-reconcile" className="app-card action-drawer"><summary><b>Инвентаризация</b><span>＋</span></summary><form action={createFeedAdjustmentAction} className="compact-form"><input type="hidden" name="returnTo" value={returnTo}/><label>Корм<select name="productId" required defaultValue=""><option value="" disabled>Выберите корм</option>{data.inventory.map((item) => <option value={item.product.id} key={item.product.id}>{item.product.name} · расчёт {item.current.toFixed(1)} кг</option>)}</select></label><div className="form-grid"><label>Фактический остаток, кг<input name="actualKg" required inputMode="decimal"/></label><label>Дата<input name="operationDate" type="date" required defaultValue={today}/></label></div><label>Причина коррекции<input name="comment" required placeholder="Пересчёт, списание, расхождение…"/></label><PoultryFormActions cancelHref={returnTo}><button className="button primary">Сохранить корректировку</button></PoultryFormActions></form></details>

      <details id="feed-rate" className="app-card action-drawer"><summary><b>Настроить норму кормления</b><span>＋</span></summary><form action={createFeedRateAction} className="compact-form"><input type="hidden" name="returnTo" value={returnTo}/><label>Группа<select name="batchId" required defaultValue={selectedBatchId}><option value="" disabled>Выберите группу</option>{active.map((batch) => <option value={batch.id} key={batch.id}>{batch.name}</option>)}</select></label><label>Корм<select name="productId" required defaultValue=""><option value="" disabled>Выберите корм</option>{data.inventory.map((item) => <option value={item.product.id} key={item.product.id}>{item.product.name}</option>)}</select></label><div className="form-grid"><label>В день<input name="dailyQuantity" required inputMode="decimal"/></label><label>Единица<select name="unit"><option value="KG">кг</option><option value="BAG">мешки</option><option value="HOUSEHOLD">бытовая</option></select></label></div><label>Действует с<input name="effectiveFrom" type="date" required defaultValue={today}/></label><label>Комментарий<input name="comment"/></label><PoultryFormActions cancelHref={returnTo}><button className="button primary">Сохранить норму</button></PoultryFormActions></form></details>
    </section>

    <SectionHeader eyebrow="История" title="Последние операции" action={<Link href={query.all === "1" ? "/poultry/feed" : "/poultry/feed?all=1"} className="text-link">{query.all === "1" ? "Свернуть" : "Показать всё"}</Link>}/>
    <div className="compact-list">{operations.map((item) => <article className="compact-list-row" key={item.id}><span><b>{item.productName}</b><small>{operationLabel[item.kind]} · {item.date.toLocaleDateString("ru-RU")}</small><small>{item.detail}</small></span><strong className={item.quantityKg >= 0 ? "income" : "expense"}>{item.quantityKg >= 0 ? "+" : ""}{item.quantityKg.toFixed(1)} кг</strong></article>)}</div>
    <Link href="/poultry/feed?returnTo=%2Fpoultry%2Ffeed#feed-rate" className="text-link secondary-action-link">Настроить нормы кормления →</Link>
  </>;
}
