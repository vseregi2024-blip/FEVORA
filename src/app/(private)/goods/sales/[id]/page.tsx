import Link from "next/link";
import { notFound } from "next/navigation";

import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { dateToInput } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth";
import { getGoodsDashboard } from "@/server/goods";
import { deleteSaleAction, updateSaleAction } from "../../actions";

export default async function SalePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const [sale, { products }] = await Promise.all([
    prisma.productSale.findFirst({ where: { id, userId: user.id, deletedAt: null }, include: { product: true } }),
    getGoodsDashboard(user.id),
  ]);
  if (!sale) notFound();

  return <>
    <header className="page-header"><div><p className="eyebrow">Товарка · продажа</p><h1>Редактировать продажу</h1><p className="muted">FIFO-себестоимость и прибыль пересчитаются после сохранения.</p></div><Link href="/goods/sales" className="button secondary">К продажам</Link></header>
    <form action={updateSaleAction} className="transaction-form"><input type="hidden" name="id" value={sale.id}/>
      <label>Товар<select name="productId" required defaultValue={sale.productId}>{products.map((product) => <option key={product.id} value={product.id}>{product.name} · остаток {product.currentQuantity}</option>)}</select></label>
      <div className="form-grid"><label>Количество<input name="quantity" required inputMode="numeric" defaultValue={sale.quantity}/></label><label>Цена продажи за единицу<input name="unitSalePrice" required inputMode="decimal" defaultValue={sale.unitSalePrice.toString()}/></label></div>
      <label>Итоговая сумма<input name="totalAmount" required inputMode="decimal" defaultValue={sale.totalAmount.toString()}/></label><label>Покупатель<input name="buyer" defaultValue={sale.buyer ?? ""}/></label><label>Дата<input name="operationDate" type="date" required defaultValue={dateToInput(sale.operationDate)}/></label><label>Комментарий<input name="comment" defaultValue={sale.comment ?? ""}/></label>
      <p className="summary-note">Текущая себестоимость: {formatMoney(sale.costOfGoods.toString())} · прибыль: {formatMoney(sale.profitAmount.toString())}.</p><button className="button primary">Сохранить изменения</button>
    </form>
    <section className="danger-zone"><h2>Удаление продажи</h2><p>Доход будет исключён из финансов, а товар вернётся на склад.</p><ConfirmationDialog action={deleteSaleAction} fieldName="id" fieldValue={sale.id} trigger="Удалить продажу" title="Удалить продажу?" description="Доход будет убран из отчётов, а склад и FIFO будут восстановлены." confirmLabel="Удалить продажу"/></section>
  </>;
}
