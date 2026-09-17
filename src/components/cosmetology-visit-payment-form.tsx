"use client";

import { CosmetologyPaymentComponentsFields, type BonusPaymentOption, type CertificateOption } from "@/components/cosmetology-payment-components-fields";
import { formatMoney } from "@/lib/money";

type Props = {
  visitId: string;
  remainingAmount: string;
  today: string;
  certificates: CertificateOption[];
  bonus: BonusPaymentOption;
  action: (formData: FormData) => void | Promise<void>;
};

export function CosmetologyVisitPaymentForm({ visitId, remainingAmount, today, certificates, bonus, action }: Props) {
  return <section className="app-card">
    <p className="eyebrow">Оплата</p>
    <h2>Оплатить процедуру</h2>
    <p className="summary-note">Осталось оплатить: <b>{formatMoney(remainingAmount)}</b>. Можно объединить деньги, сертификат и бонусы.</p>
    <form action={action} className="compact-form">
      <input type="hidden" name="id" value={visitId}/>
      <CosmetologyPaymentComponentsFields legend="Способы оплаты" limitAmount={remainingAmount} certificates={certificates} bonus={bonus}/>
      <label>Дата оплаты<input name="operationDate" type="date" required defaultValue={today}/></label>
      <button className="button primary">Оплатить</button>
    </form>
  </section>;
}
