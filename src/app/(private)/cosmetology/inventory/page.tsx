import Link from "next/link";

import { cosmeticItemCategories, getCosmetologyDashboard } from "@/server/cosmetology";
import { requireUser } from "@/server/auth";
import { formatMoney } from "@/lib/money";

const unitLabels: Record<string, string> = { UNIT: "ед.", ML: "мл", VIAL: "флак.", PIECE: "шт." };
const queryValue = (value: string | string[] | undefined) => typeof value === "string" ? value.trim() : "";

export default async function InventoryPage({ searchParams }: { searchParams: Promise<{ q?: string | string[]; category?: string | string[] }> }) {
  const user = await requireUser();
  const query = await searchParams;
  const search = queryValue(query.q).toLocaleLowerCase("ru-RU");
  const category = queryValue(query.category);
  const dashboard = await getCosmetologyDashboard(user.id);
  const categories = [...new Set([...cosmeticItemCategories, ...dashboard.items.map((item) => item.category)])].sort((a, b) => a.localeCompare(b, "ru"));
  const items = dashboard.items.filter((item) => {
    const matchesSearch = !search || [item.name, item.category, item.brand ?? ""].some((value) => value.toLocaleLowerCase("ru-RU").includes(search));
    return matchesSearch && (!category || item.category === category);
  });

  return <div className="cosmetology-inventory-page">
    <header className="page-header"><div><p className="eyebrow">Косметология · Товары</p><h1>Препараты и расходники</h1><p className="muted">Остатки меняются только при закупке или ручной корректировке.</p></div><Link href="/family/settings/sections" className="button secondary">← Разделы приложения</Link></header>
    <section className="cosmetology-inventory-actions" aria-label="Действия со складом"><Link href="/cosmetology/inventory/new" className="button secondary">＋ Добавить позицию</Link><Link href="/cosmetology/inventory/purchase" className="button primary">＋ Новая закупка</Link></section>
    <form className="cosmetology-inventory-filters" action="/cosmetology/inventory"><label>Поиск<input name="q" defaultValue={search} placeholder="Название, бренд или категория"/></label><label>Категория<select name="category" defaultValue={category}><option value="">Все категории</option>{categories.map((item) => <option value={item} key={item}>{item}</option>)}</select></label><button className="button secondary">Показать</button></form>
    <section className="section-header"><div><p className="eyebrow">Наличие</p><h2>Склад сейчас</h2><p className="muted">Откройте позицию, чтобы посмотреть историю закупок, цен и корректировок.</p></div></section>
    <div className="cosmetology-inventory-list">{items.map((item) => {
      const latestLot = item.lots.slice().sort((a, b) => b.purchaseDate.getTime() - a.purchaseDate.getTime() || b.createdAt.getTime() - a.createdAt.getTime())[0];
      const low = item.currentQuantity.lte(item.minimumQuantity);
      return <Link className="cosmetology-inventory-card" href={`/cosmetology/inventory/${item.id}`} key={item.id}><span><b>{item.name}</b><small>{item.category}{item.brand ? ` · ${item.brand}` : ""}</small><small>Последняя цена: {latestLot ? `${formatMoney(latestLot.unitCost.toString())}/${unitLabels[item.unit]}` : "ещё нет закупок"}</small><em>История закупок и цен <span aria-hidden>→</span></em></span><strong>{item.currentQuantity.toString()} <small>{unitLabels[item.unit]}</small>{low && <i>Заканчивается</i>}</strong></Link>;
    })}</div>
    {!items.length && <p className="empty">{dashboard.items.length ? "По этому фильтру позиций нет." : "Товаров пока нет. Добавьте первую позицию."}</p>}
  </div>;
}
