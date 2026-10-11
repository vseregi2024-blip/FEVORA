"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { formatMoney } from "@/lib/money";

export type CertificateOption = { id: string; certificateNumber: string; remainingAmount: string; expiresAt: string | null };
export type BonusPaymentOption = { clientId: string; connected: boolean; balance: number | null; message?: string | null; requestKey?: string };
type Props = { legend: string; limitAmount?: string; certificates?: CertificateOption[]; bonus?: BonusPaymentOption; compact?: boolean };
const parseAmount = (value: string) => { const parsed = Number(value.replace(",", ".")); return Number.isFinite(parsed) && parsed > 0 ? parsed : 0; };

export function CosmetologyPaymentComponentsFields({ legend, limitAmount, certificates = [], bonus, compact = false }: Props) {
  const [cash, setCash] = useState("0"), [mono, setMono] = useState("0"), [privat, setPrivat] = useState("0"), [other, setOther] = useState("0");
  const [certificateId, setCertificateId] = useState(""), [certificateAmount, setCertificateAmount] = useState("0"), [certificateQuery, setCertificateQuery] = useState("");
  const [bonusAmount, setBonusAmount] = useState("0");
  const [compactMethod, setCompactMethod] = useState<"CASH" | "MONO" | "PRIVAT" | "OTHER">("CASH");
  const [compactAmount, setCompactAmount] = useState("0"), [compactOtherComment, setCompactOtherComment] = useState("");
  const selected = certificates.find((certificate) => certificate.id === certificateId);
  const certificateLimit = selected ? Math.min(Number(selected.remainingAmount), limitAmount ? Number(limitAmount) : Number.POSITIVE_INFINITY) : 0;
  const bonusLimit = bonus?.connected && bonus.balance !== null ? Math.min(bonus.balance, limitAmount ? Number(limitAmount) : Number.POSITIVE_INFINITY) : 0;
  const total = useMemo(() => parseAmount(cash) + parseAmount(mono) + parseAmount(privat) + parseAmount(other) + parseAmount(certificateAmount) + parseAmount(bonusAmount), [cash, mono, privat, other, certificateAmount, bonusAmount]);
  const overLimit = limitAmount !== undefined && total > Number(limitAmount) + 0.001;
  const certificateOverLimit = parseAmount(certificateAmount) > certificateLimit + 0.001;
  const bonusOverLimit = parseAmount(bonusAmount) > bonusLimit + 0.001;
  const filtered = certificates.filter((certificate) => certificate.certificateNumber.toLowerCase().includes(certificateQuery.trim().toLowerCase()));
  if (compact) {
    const amount = parseAmount(compactAmount);
    return <fieldset className="cosmetology-payment-compact"><legend>{legend}</legend><div className="form-grid"><label>Способ<select value={compactMethod} onChange={(event) => setCompactMethod(event.target.value as typeof compactMethod)}><option value="CASH">Наличные</option><option value="MONO">Monobank</option><option value="PRIVAT">ПриватБанк</option><option value="OTHER">Прочее</option></select></label><label>Сумма<input inputMode="decimal" min="0" step="0.01" value={compactAmount} onChange={(event) => setCompactAmount(event.target.value)} placeholder="0,00"/></label></div>{compactMethod === "OTHER" && <label>Комментарий<input value={compactOtherComment} onChange={(event) => setCompactOtherComment(event.target.value)} required placeholder="Например: перевод"/></label>}<input type="hidden" name="cashAmount" value={compactMethod === "CASH" ? compactAmount : "0"}/><input type="hidden" name="monoAmount" value={compactMethod === "MONO" ? compactAmount : "0"}/><input type="hidden" name="privatAmount" value={compactMethod === "PRIVAT" ? compactAmount : "0"}/><input type="hidden" name="otherAmount" value={compactMethod === "OTHER" ? compactAmount : "0"}/><input type="hidden" name="otherComment" value={compactMethod === "OTHER" ? compactOtherComment : ""}/><input type="hidden" name="certificateAmount" value="0"/><input type="hidden" name="bonusAmount" value="0"/><input type="hidden" name="paymentTotal" value={amount.toFixed(2)}/></fieldset>;
  }
  return <fieldset><legend>{legend}</legend><div className="form-grid">
    <label>Наличные<input name="cashAmount" inputMode="decimal" min="0" step="0.01" value={cash} onChange={(event) => setCash(event.target.value)}/></label>
    <label>Monobank<input name="monoAmount" inputMode="decimal" min="0" step="0.01" value={mono} onChange={(event) => setMono(event.target.value)}/></label>
    <label>ПриватБанк<input name="privatAmount" inputMode="decimal" min="0" step="0.01" value={privat} onChange={(event) => setPrivat(event.target.value)}/></label>
    <label>Прочие<input name="otherAmount" inputMode="decimal" min="0" step="0.01" value={other} onChange={(event) => setOther(event.target.value)}/></label>
  </div>{parseAmount(other) > 0 && <label>Описание прочего поступления<input name="otherComment" required maxLength={300} placeholder="Например: продажа косметики"/></label>}
  <div className="form-grid"><label>Поиск сертификата<input value={certificateQuery} onChange={(event) => setCertificateQuery(event.target.value)} placeholder="Номер сертификата"/></label><label>Сертификат<select name="certificateId" value={certificateId} onChange={(event) => { setCertificateId(event.target.value); setCertificateAmount("0"); }}><option value="">Не использовать</option>{filtered.map((certificate) => <option key={certificate.id} value={certificate.id}>{certificate.certificateNumber} · остаток {certificate.remainingAmount} грн{certificate.expiresAt ? ` · до ${certificate.expiresAt}` : ""}</option>)}</select></label></div>
  {certificateId ? <label>Списать с сертификата<input name="certificateAmount" inputMode="decimal" min="0" max={Number.isFinite(certificateLimit) ? certificateLimit : undefined} step="0.01" value={certificateAmount} onChange={(event) => setCertificateAmount(event.target.value)} placeholder="0"/><small>Максимум: {formatMoney(Number.isFinite(certificateLimit) ? certificateLimit.toFixed(2) : "0")}</small></label> : <input type="hidden" name="certificateAmount" value="0"/>}
  <section className="app-card"><p className="eyebrow">Beauty Bonus Club</p><h3>Бонусы</h3>{!bonus?.connected ? <p className="muted">Клиент не подключён к Beauty Bonus Club. {bonus?.clientId ? <Link href={`/cosmetology/clients/${bonus.clientId}`} className="text-link">Подключить клиента</Link> : null}</p> : bonus.balance === null ? <p className="muted">{bonus.message ?? "Не удалось получить актуальный баланс бонусов."}</p> : <label>Списать бонусы<input name="bonusAmount" inputMode="numeric" min="0" max={Number.isFinite(bonusLimit) ? bonusLimit : undefined} step="1" value={bonusAmount} onChange={(event) => setBonusAmount(event.target.value)} placeholder="0"/><small>Доступно: {bonus.balance} · максимум для этой оплаты: {Number.isFinite(bonusLimit) ? bonusLimit : 0}</small></label>}{(!bonus?.connected || bonus.balance === null) && <input type="hidden" name="bonusAmount" value="0"/>}{bonus?.requestKey && <input type="hidden" name="paymentRequestKey" value={bonus.requestKey}/>}</section>
  <input type="hidden" name="paymentTotal" value={total.toFixed(2)}/><p className={overLimit || certificateOverLimit || bonusOverLimit ? "form-error" : "summary-note"}>Сумма компонентов: <b>{formatMoney(total.toFixed(2))}</b>{limitAmount ? ` · доступно ${formatMoney(limitAmount)}` : ""}</p>{overLimit && <p className="form-error">Сумма способов оплаты превышает доступный остаток.</p>}{certificateOverLimit && <p className="form-error">Нельзя списать больше остатка сертификата или процедуры.</p>}{bonusOverLimit && <p className="form-error">Нельзя списать больше доступных бонусов или остатка процедуры.</p>}</fieldset>;
}
