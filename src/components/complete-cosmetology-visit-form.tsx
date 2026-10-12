"use client";

import { useState } from "react";

import { type BonusPaymentOption, type CertificateOption } from "@/components/cosmetology-payment-components-fields";
import { formatMoney } from "@/lib/money";

type Props = {
  visit: { id: string; plannedAmount: string | null; paidAmount: string; comment: string | null };
  items?: Array<{ id: string; name: string; quantity: string }>;
  today: string;
  certificates: CertificateOption[];
  bonus: BonusPaymentOption;
  wallets?: Array<{ id: string; name: string }>;
  procurementEnvelopes?: Array<{ id: string; name: string }>;
  defaultProcurementEnvelopeId?: string | null;
  action: (formData: FormData) => void | Promise<void>;
};

export function CompleteCosmetologyVisitForm({ visit, today, wallets = [], procurementEnvelopes = [], defaultProcurementEnvelopeId = null, action }: Props) {
  const initialTotal = visit.plannedAmount ?? "";
  const [paymentAmount, setPaymentAmount] = useState(initialTotal);
  const remaining = Math.max((Number(paymentAmount.replace(",", ".")) || 0) - Number(visit.paidAmount), 0).toFixed(2);
  const [receivedAmount, setReceivedAmount] = useState(remaining);
  const [procurementAmount, setProcurementAmount] = useState("0");
  const [procurementEnvelopeId, setProcurementEnvelopeId] = useState(defaultProcurementEnvelopeId ?? "");
  const freeAmount = ((Number(receivedAmount.replace(",", ".")) || 0) - (Number(procurementAmount.replace(",", ".")) || 0)).toFixed(2);
  const procurementExceedsPayment = Number(freeAmount) < 0;
  const needsProcurementEnvelope = (Number(procurementAmount.replace(",", ".")) || 0) > 0;
  const selectedProcurementEnvelope = procurementEnvelopes.find((envelope) => envelope.id === procurementEnvelopeId) ?? null;
  return <form action={action} className="compact-form">
    <input type="hidden" name="id" value={visit.id}/><input type="hidden" name="monoAmount" value="0"/><input type="hidden" name="privatAmount" value="0"/><input type="hidden" name="otherAmount" value="0"/><input type="hidden" name="certificateAmount" value="0"/><input type="hidden" name="bonusAmount" value="0"/><input type="hidden" name="paymentTotal" value={receivedAmount}/>
    <label>Итоговая цена за все услуги<input name="paymentAmount" required inputMode="decimal" min="0" step="0.01" value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} placeholder="1400"/></label>
    <p className="summary-note">Стоимость: <b>{formatMoney(paymentAmount || "0")}</b> · уже оплачено: <b>{formatMoney(visit.paidAmount)}</b> · осталось: <b>{formatMoney(remaining)}</b></p>
    <label>Фактически оплачено сейчас<input name="cashAmount" required inputMode="decimal" min="0" step="0.01" value={receivedAmount} onChange={(event) => setReceivedAmount(event.target.value)}/></label>
    <label>Кошелёк поступления<select name="moneyAccountId" required defaultValue=""><option value="" disabled>Выберите кошелёк</option>{wallets.map((wallet) => <option key={wallet.id} value={wallet.id}>{wallet.name}</option>)}</select></label>
    <label>На закупку<input name="procurementAmount" inputMode="decimal" min="0" step="0.01" value={procurementAmount} onChange={(event) => setProcurementAmount(event.target.value)} placeholder="0"/></label>
    <label>Конверт для резерва<select name="procurementEnvelopeId" required={needsProcurementEnvelope} value={procurementEnvelopeId} onChange={(event) => setProcurementEnvelopeId(event.target.value)}><option value="">{procurementEnvelopes.length ? "Выберите конверт" : "Сначала создайте конверт"}</option>{procurementEnvelopes.map((envelope) => <option key={envelope.id} value={envelope.id}>{envelope.name}</option>)}</select></label>
    <p className={`summary-note${procurementExceedsPayment ? " form-error" : ""}`}>Свободно: <b>{formatMoney(freeAmount)}</b>{procurementExceedsPayment ? ". Сумма в резерв не может быть больше фактически оплаченной." : ""}</p>
    <p className={`summary-note${needsProcurementEnvelope && !selectedProcurementEnvelope ? " form-error" : ""}`}>{selectedProcurementEnvelope ? `Резерв поступит в «${selectedProcurementEnvelope.name}». ` : needsProcurementEnvelope ? "Выберите конверт, куда направить резерв. " : "Укажите сумму резерва, если часть оплаты нужно отложить на препараты. "}Это не расход. Препараты при проведении процедуры не списываются.</p>
    <label>Дата выполнения<input name="operationDate" type="date" required defaultValue={today}/></label><label>Комментарий<input name="comment" defaultValue={visit.comment ?? ""}/></label><button className="button primary" disabled={!wallets.length || procurementExceedsPayment || (needsProcurementEnvelope && !selectedProcurementEnvelope)}>Провести и сохранить</button>
  </form>;
}
