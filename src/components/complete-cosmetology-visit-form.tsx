"use client";

import { useState } from "react";

import { CosmetologyPaymentComponentsFields, type BonusPaymentOption, type CertificateOption } from "@/components/cosmetology-payment-components-fields";
import { formatMoney } from "@/lib/money";

type Item = {
  id: string;
  name: string;
  quantity: string;
};

type Props = {
  visit: { id: string; plannedAmount: string | null; paidAmount: string; comment: string | null };
  items: Item[];
  today: string;
  certificates: CertificateOption[];
  bonus: BonusPaymentOption;
  action: (formData: FormData) => void | Promise<void>;
};

export function CompleteCosmetologyVisitForm({ visit, items, today, certificates, bonus, action }: Props) {
  const [paymentAmount, setPaymentAmount] = useState(visit.plannedAmount ?? "");
  const parsedFinal = Number(paymentAmount.replace(",", "."));
  const remaining = Math.max((Number.isFinite(parsedFinal) ? parsedFinal : 0) - Number(visit.paidAmount), 0).toFixed(2);
  return <form action={action} className="compact-form"><input type="hidden" name="id" value={visit.id}/><label>Итоговая цена за все услуги<input name="paymentAmount" required inputMode="decimal" min="0" step="0.01" value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} placeholder="1400"/></label><p className="summary-note">Стоимость: <b>{formatMoney(paymentAmount || "0")}</b> · уже оплачено: <b>{formatMoney(visit.paidAmount)}</b> · осталось: <b>{formatMoney(remaining)}</b></p><CosmetologyPaymentComponentsFields legend="Получено сейчас — можно разделить платёж" limitAmount={remaining} certificates={certificates} bonus={bonus}/><div className="form-grid"><label>Дополнительный материал<select name="itemId" defaultValue=""><option value="">Не использовать</option>{items.map((item) => <option key={item.id} value={item.id}>{item.name} · остаток {item.quantity}</option>)}</select></label><label>Количество<input name="usageQuantity" inputMode="decimal" placeholder="Например, 2"/></label></div><label>Дата выполнения<input name="operationDate" type="date" required defaultValue={today}/></label><label>Комментарий<input name="comment" defaultValue={visit.comment ?? ""}/></label><button className="button primary">Оплатить</button></form>;
}
