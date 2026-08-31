import Link from "next/link";

import { PoultryFormActions } from "@/components/poultry-form-actions";
import { dateToInput } from "@/lib/dates";
import { requireUser } from "@/server/auth";
import { getPoultryDashboard, getPoultrySale } from "@/server/poultry";

import { updatePoultrySaleAction } from "../../actions";

export default async function PoultrySalePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ returnTo?: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const [sale, dashboard, query] = await Promise.all([getPoultrySale(user.id, id), getPoultryDashboard(user.id), searchParams]);
  const returnTo = query.returnTo?.startsWith("/poultry") && !query.returnTo.startsWith("//") ? query.returnTo : "/poultry/sales";
  return <><header className="page-header"><div><p className="eyebrow">Птицеводство · Продажа</p><h1>Редактировать продажу</h1></div><Link href={returnTo} className="text-link">← Назад</Link></header><form action={updatePoultrySaleAction} className="transaction-form"><input type="hidden" name="id" value={sale.id}/><input type="hidden" name="returnTo" value={returnTo}/><label>Тип<select name="saleType" defaultValue={sale.saleType}><option value="LIVE_BIRD">Живая птица</option><option value="CARCASS">Тушка</option><option value="EGGS">Яйца</option><option value="OTHER">Другое</option></select></label><label>Группа<select name="batchId" defaultValue={sale.batchId ?? ""}><option value="">Без привязки</option>{dashboard.batches.filter((batch) => batch.status === "ACTIVE" || batch.id === sale.batchId).map((batch) => <option value={batch.id} key={batch.id}>{batch.name} · {batch.currentQuantity} гол.</option>)}</select></label><div className="form-grid"><label>Что продано<input name="itemName" required defaultValue={sale.itemName}/></label><label>Количество<input name="quantity" inputMode="numeric" defaultValue={sale.quantity ?? ""}/></label></div><div className="form-grid"><label>Вес, кг<input name="weightKg" inputMode="decimal" defaultValue={sale.weightKg?.toString() ?? ""}/></label><label>Цена<input name="price" inputMode="decimal" defaultValue={sale.price?.toString() ?? ""}/></label></div><label>Итог<input name="totalAmount" inputMode="decimal" defaultValue={sale.totalAmount.toString()}/><small>Финансовый доход будет обновлён, а не создан повторно.</small></label><details className="form-details"><summary>Данные покупателя</summary><div className="form-grid"><label>Имя<input name="buyer" defaultValue={sale.buyer ?? ""}/></label><label>Телефон<input name="buyerPhone" inputMode="tel" defaultValue={sale.buyerPhone ?? ""}/></label></div></details><label>Дата<input name="operationDate" type="date" required defaultValue={dateToInput(sale.operationDate)}/></label><label>Комментарий<input name="comment" defaultValue={sale.comment ?? ""}/></label><PoultryFormActions cancelHref={returnTo}><button className="button primary">Сохранить изменения</button></PoultryFormActions></form></>;
}
