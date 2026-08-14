"use client";

type Item = {
  id: string;
  name: string;
  quantity: string;
};

type Props = {
  visit: { id: string; plannedAmount: string | null; comment: string | null };
  items: Item[];
  today: string;
  action: (formData: FormData) => void | Promise<void>;
};

export function CompleteCosmetologyVisitForm({ visit, items, today, action }: Props) {
  return <form action={action} className="compact-form"><input type="hidden" name="id" value={visit.id}/><label>Итоговая цена за все услуги<input name="paymentAmount" required inputMode="decimal" defaultValue={visit.plannedAmount ?? ""} placeholder="1400"/></label><fieldset><legend>Получено сейчас</legend><div className="form-grid"><label>Наличные<input name="cashAmount" inputMode="decimal" defaultValue="0"/></label><label>Monobank<input name="monoAmount" inputMode="decimal" defaultValue="0"/></label><label>ПриватБанк<input name="privatAmount" inputMode="decimal" defaultValue="0"/></label></div></fieldset><div className="form-grid"><label>Дополнительный материал<select name="itemId" defaultValue=""><option value="">Не использовать</option>{items.map((item) => <option key={item.id} value={item.id}>{item.name} · остаток {item.quantity}</option>)}</select></label><label>Количество<input name="usageQuantity" inputMode="decimal" placeholder="Например, 2"/></label></div><label>Дата выполнения<input name="operationDate" type="date" required defaultValue={today}/></label><label>Комментарий<input name="comment" defaultValue={visit.comment ?? ""}/></label><button className="button primary">Закрыть процедуру</button></form>;
}
