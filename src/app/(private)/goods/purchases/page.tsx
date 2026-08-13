import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { todayInputValue } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { requireUser } from "@/server/auth";
import { getGoodsDashboard } from "@/server/goods";
import { createPurchaseAction } from "../actions";

export default async function PurchasesPage() {
  const user = await requireUser();
  const { products, purchases } = await getGoodsDashboard(user.id);

  return <>
    <header className="page-header"><div><p className="eyebrow">Товарка</p><h1>Закупки</h1><p className="muted">Одна закупка создаёт один расход и одну партию склада.</p></div><Link href="/goods" className="button secondary">Назад</Link></header>
    <section className="family-grid"><article className="app-card"><h2>Новая закупка</h2><form action={createPurchaseAction} className="compact-form">
      <label>Товар<select name="productId" required defaultValue=""><option value="" disabled>Выберите товар</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
      <div className="form-grid"><label>Количество<input name="quantity" required inputMode="numeric" placeholder="10"/></label><label>Закупочная цена за единицу<input name="unitPurchasePrice" required inputMode="decimal" placeholder="500"/></label></div>
      <label>Доставка<input name="deliveryAmount" inputMode="decimal" placeholder="0"/></label><label style={{ display: "flex", alignItems: "center", gap: 10 }}><input style={{ width: 20, minHeight: 20 }} name="deliveryInCost" type="checkbox"/> Включить доставку в себестоимость этой партии</label>
      <label>Поставщик<input name="supplier" placeholder="Необязательно"/></label><label>Дата<input name="operationDate" type="date" required defaultValue={todayInputValue()}/></label><label>Комментарий<input name="comment" placeholder="Необязательно"/></label><button className="button primary">Купить и добавить на склад</button>
    </form></article><article className="app-card"><h2>Как считается закупка</h2><p className="muted">Количество × цена создаёт один денежный расход и увеличивает остаток товара.</p><p className="summary-note">Если включить доставку в себестоимость, она войдёт в FIFO-стоимость партии. Иначе доставка создаст отдельный операционный расход и не изменит цену партии.</p></article></section>
    <section className="section-header"><div><p className="eyebrow">История</p><h2>Последние закупки</h2></div></section>
    <div className="transaction-list">{purchases.map((purchase) => <Link href={`/goods/purchases/${purchase.id}`} className="transaction-row" key={purchase.id}><span><b>{purchase.product.name}</b><small>{purchase.operationDate.toLocaleDateString("ru-RU")} · {purchase.quantity} шт.{purchase.supplier ? ` · ${purchase.supplier}` : ""}</small></span><strong className="expense">−{formatMoney(purchase.totalAmount.toString())}</strong></Link>)}</div>
    {purchases.length === 0 && <EmptyState title="Закупок пока нет" description="Добавьте первую закупку после создания товара."/>}
  </>;
}
