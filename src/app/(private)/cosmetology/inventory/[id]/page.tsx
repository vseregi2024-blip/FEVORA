import Link from "next/link";

import { requireUser } from "@/server/auth";
import { getCosmetologyInventoryItemHistory } from "@/server/cosmetology";
import { formatMoney } from "@/lib/money";

export default async function InventoryItemPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(); const { id } = await params; const item = await getCosmetologyInventoryItemHistory(user.id, id);
  return <><header className="page-header"><div><p className="eyebrow">Косметология · Препарат</p><h1>{item.name}</h1><p className="muted">Текущий остаток: {item.currentQuantity.toString()}.</p></div><Link href="/cosmetology/inventory" className="button secondary">К препаратам</Link></header><section className="app-card"><h2>История закупок и цен</h2><div className="transaction-list">{item.lots.map((lot) => <article className="transaction-row" key={lot.id}><span><b>{lot.purchaseDate.toLocaleDateString("ru-RU")}</b><small>{lot.initialQuantity.toString()} ед. · {formatMoney(lot.unitCost.toString())}/ед. · {lot.supplier || "Поставщик не указан"}</small></span><strong>{formatMoney(lot.totalAmount.toString())}</strong></article>)}</div>{!item.lots.length && <p className="empty">Закупок пока не было.</p>}</section></>;
}
