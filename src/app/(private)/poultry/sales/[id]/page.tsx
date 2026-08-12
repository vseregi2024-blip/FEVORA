import Link from "next/link";

import { dateToInput } from "@/lib/dates";
import { requireUser } from "@/server/auth";
import { getPoultryDashboard, getPoultrySale } from "@/server/poultry";

import { updatePoultrySaleAction } from "../../actions";

export default async function PoultrySalePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const [sale, dashboard] = await Promise.all([getPoultrySale(user.id, id), getPoultryDashboard(user.id)]);
  return <><header className="page-header"><div><p className="eyebrow">Птицеводство · Продажа</p><h1>Редактировать продажу</h1></div><Link href="/poultry/sales" className="text-link">К продажам</Link></header><form action={updatePoultrySaleAction} className="transaction-form"><input type="hidden" name="id" value={sale.id}/><label>Партия<select name="batchId" defaultValue={sale.batchId ?? ""}><option value="">Без привязки</option>{dashboard.batches.filter((batch) => batch.status === "ACTIVE" || batch.id === sale.batchId).map((batch) => <option value={batch.id} key={batch.id}>{batch.name} · {batch.currentQuantity} гол.</option>)}</select></label><div className="form-grid"><label>Покупатель<input name="buyer" defaultValue={sale.buyer ?? ""}/></label><label>Что продано<input name="itemName" required defaultValue={sale.itemName}/></label></div><div className="form-grid"><label>Количество<input name="quantity" inputMode="numeric" defaultValue={sale.quantity ?? ""}/></label><label>Вес, кг<input name="weightKg" inputMode="decimal" defaultValue={sale.weightKg?.toString() ?? ""}/></label></div><div className="form-grid"><label>Цена<input name="price" inputMode="decimal" defaultValue={sale.price?.toString() ?? ""}/></label><label>Итог<input name="totalAmount" inputMode="decimal" defaultValue={sale.totalAmount.toString()}/></label></div><label>Дата<input name="operationDate" type="date" required defaultValue={dateToInput(sale.operationDate)}/></label><label>Комментарий<input name="comment" defaultValue={sale.comment ?? ""}/></label><button className="button primary">Сохранить без второго дохода</button></form></>;
}
