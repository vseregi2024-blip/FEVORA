import Link from "next/link";
import { notFound } from "next/navigation";

import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { dateToInput } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth";
import { getGoodsDashboard } from "@/server/goods";
import { deletePurchaseAction, updatePurchaseAction } from "../../actions";

export default async function PurchasePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const [purchase, { products }] = await Promise.all([
    prisma.productPurchase.findFirst({ where: { id, userId: user.id, deletedAt: null }, include: { inventoryLot: { include: { allocations: { where: { deletedAt: null } } } } } }),
    getGoodsDashboard(user.id),
  ]);
  if (!purchase?.inventoryLot) notFound();
  const locked = purchase.inventoryLot.availableQuantity !== purchase.inventoryLot.initialQuantity || purchase.inventoryLot.allocations.length > 0;

  return <>
    <header className="page-header"><div><p className="eyebrow">Товарка · закупка</p><h1>Редактировать закупку</h1><p className="muted">Использованную в FIFO-партию редактировать или удалять нельзя.</p></div><Link href="/goods/purchases" className="button secondary">К закупкам</Link></header>
    {locked ? <p className="summary-note">Эта партия уже использована. Данные защищены от изменений, чтобы не исказить себестоимость уже сделанных продаж.</p> : <form action={updatePurchaseAction} className="transaction-form"><input type="hidden" name="id" value={purchase.id}/>
      <label>Товар<select name="productId" required defaultValue={purchase.productId}>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
      <div className="form-grid"><label>Количество<input name="quantity" required inputMode="numeric" defaultValue={purchase.quantity}/></label><label>Цена за единицу<input name="unitPurchasePrice" required inputMode="decimal" defaultValue={purchase.unitPurchasePrice.toString()}/></label></div>
      <label>Доставка<input name="deliveryAmount" inputMode="decimal" defaultValue={purchase.deliveryAmount.toString()}/></label><label style={{ display: "flex", alignItems: "center", gap: 10 }}><input style={{ width: 20, minHeight: 20 }} name="deliveryInCost" type="checkbox" defaultChecked={purchase.deliveryInCost}/> Включить доставку в себестоимость партии</label>
      <label>Поставщик<input name="supplier" defaultValue={purchase.supplier ?? ""}/></label><label>Дата<input name="operationDate" type="date" required defaultValue={dateToInput(purchase.operationDate)}/></label><label>Комментарий<input name="comment" defaultValue={purchase.comment ?? ""}/></label><button className="button primary">Сохранить изменения</button>
    </form>}
    {!locked && <section className="danger-zone"><h2>Удаление закупки</h2><p>Закупка, её расход и неиспользованная партия будут мягко удалены.</p><ConfirmationDialog action={deletePurchaseAction} fieldName="id" fieldValue={purchase.id} trigger="Удалить закупку" title="Удалить закупку?" description="Остаток товара и связанные расходы будут восстановлены безопасно." confirmLabel="Удалить закупку"/></section>}
  </>;
}
