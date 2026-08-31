import Link from "next/link";
import { notFound } from "next/navigation";

import { PoultryFormActions } from "@/components/poultry-form-actions";
import { formatMoney } from "@/lib/money";
import { requireUser } from "@/server/auth";
import { getFeedWorkspace } from "@/server/poultry";
import { updateFeedProductSettingsAction } from "../../../actions";

export default async function FeedProductPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const data = await getFeedWorkspace(user.id);
  const item = data.inventory.find((row) => row.product.id === id);
  if (!item) notFound();
  const operations = data.operations.filter((operation) => operation.productId === id).slice(0, 5);

  return <>
    <header className="page-header compact-page-header"><div><p className="eyebrow">Склад кормов</p><h1>{item.product.name}</h1><p className="muted">{/grain|зерн/i.test(item.product.type ?? "") ? "Зерно" : /supplement|additive|добав/i.test(item.product.type ?? "") ? "Добавки" : "Комбикорм"}</p></div></header>
    <section className="metric-grid feed-product-metrics"><article><span>Текущий остаток</span><strong>{item.current.toFixed(1)} кг</strong></article><article><span>Всего куплено</span><strong>{item.purchased.toFixed(1)} кг</strong></article><article><span>Всего использовано</span><strong>{(item.manual + item.estimated).toFixed(1)} кг</strong></article><article><span>Средняя цена</span><strong>{formatMoney(item.averageCostPerKg.toFixed(2))}/кг</strong></article><article><span>Стоимость остатка</span><strong>{formatMoney((item.current * item.averageCostPerKg).toFixed(2))}</strong></article><article><span>Желаемый минимум</span><strong>{Number(item.product.minimumStockKg).toFixed(1)} кг</strong></article></section>
    <div className="action-button-grid"><Link href="/poultry/feed?returnTo=%2Fpoultry%2Ffeed%2Fstock#buy-feed" className="button primary">Добавить покупку</Link><Link href="/poultry/feed?returnTo=%2Fpoultry%2Ffeed%2Fstock#assign-feed" className="button secondary">Использовать</Link><Link href="/poultry/feed?returnTo=%2Fpoultry%2Ffeed%2Fstock#feed-reconcile" className="button secondary">Инвентаризация</Link></div>
    <details className="app-card action-drawer"><summary><b>Редактировать настройки</b><span>＋</span></summary><form action={updateFeedProductSettingsAction} className="compact-form"><input type="hidden" name="productId" value={id}/><input type="hidden" name="returnTo" value={`/poultry/feed/stock/${id}`}/><label>Категория<input name="type" defaultValue={item.product.type ?? ""}/></label><label>Минимальный желаемый остаток, кг<input name="minimumStockKg" inputMode="decimal" defaultValue={String(item.product.minimumStockKg)}/></label><PoultryFormActions cancelHref={`/poultry/feed/stock/${id}`}><button className="button primary">Сохранить</button></PoultryFormActions></form></details>
    <section className="compact-section"><h2>Последние операции</h2><div className="compact-list">{operations.map((operation) => <article className="compact-list-row" key={operation.id}><span><b>{operation.kind === "PURCHASE" ? "Покупка" : operation.kind === "USAGE" ? "Использование" : "Инвентаризация"}</b><small>{operation.date.toLocaleDateString("ru-RU")} · {operation.detail}</small></span><strong>{operation.quantityKg > 0 ? "+" : ""}{operation.quantityKg.toFixed(1)} кг</strong></article>)}</div></section>
  </>;
}
