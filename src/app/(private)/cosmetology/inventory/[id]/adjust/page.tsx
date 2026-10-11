import Link from "next/link";

import { createInventoryChangeAction } from "../../../actions";
import { todayInputValue } from "@/lib/dates";
import { requireUser } from "@/server/auth";
import { getCosmetologyInventoryItemHistory } from "@/server/cosmetology";

export default async function AdjustInventoryItemPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(); const { id } = await params; const item = await getCosmetologyInventoryItemHistory(user.id, id);
  return <div className="cosmetology-inventory-flow"><header className="page-header"><div><p className="eyebrow">Препараты и расходники</p><h1>Скорректировать остаток</h1><p className="muted">{item.name} · сейчас {item.currentQuantity.toString()}</p></div><Link href={`/cosmetology/inventory/${item.id}`} className="button secondary">Закрыть</Link></header><form action={createInventoryChangeAction} className="transaction-form cosmetology-inventory-form"><input type="hidden" name="itemId" value={item.id}/><label>Действие<select name="type"><option value="ADJUSTMENT">Добавить</option><option value="WRITE_OFF">Списать</option></select></label><label>Количество<input name="quantity" required inputMode="decimal" placeholder="Например: 2"/></label><label>Причина<select name="reason" required defaultValue=""><option value="" disabled>Выберите причину</option><option>Инвентаризация</option><option>Списание</option><option>Повреждение</option><option>Срок годности</option><option>Другое</option></select></label><label>Дата<input name="operationDate" type="date" required defaultValue={todayInputValue()}/></label><label>Комментарий <small>необязательно</small><input name="comment" placeholder="Дополнительная информация"/></label><div className="money-form-actions"><Link href={`/cosmetology/inventory/${item.id}`} className="button secondary">Отмена</Link><button className="button primary">Сохранить корректировку</button></div></form></div>;
}
