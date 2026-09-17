import Link from "next/link";

import { todayInputValue } from "@/lib/dates";
import { requireUser } from "@/server/auth";
import { getCosmetologyClients } from "@/server/cosmetology";
import { createCosmetologyCertificateAction } from "../../actions";

export default async function NewCertificatePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await requireUser(); const clients = await getCosmetologyClients(user.id);
  const { error } = await searchParams;
  return <><header className="page-header"><div><p className="eyebrow">Косметология · Сертификаты</p><h1>Новый сертификат</h1><p className="muted">Создание сертификата не является продажей и не создаёт денежный доход.</p></div><Link href="/cosmetology/certificates" className="text-link">К списку</Link></header>{error && <p className="form-error">{error}</p>}<form action={createCosmetologyCertificateAction} className="compact-form"><label>Номер сертификата<input name="certificateNumber" required maxLength={80} placeholder="CERT-2026-001"/></label><div className="form-grid"><label>Номинал<input name="initialAmount" required inputMode="decimal" min="0.01" step="0.01" placeholder="5000"/></label><label>Валюта<select name="currency" defaultValue="UAH"><option value="UAH">UAH · гривна</option></select></label></div><label>Привязать к клиенту (необязательно)<select name="clientId" defaultValue=""><option value="">Не привязывать</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.displayName ?? `${client.firstName} ${client.lastName}`}</option>)}</select></label><div className="form-grid"><label>Дата выдачи<input name="issuedAt" type="date" required defaultValue={todayInputValue()}/></label><label>Срок действия<input name="expiresAt" type="date"/></label></div><label>Комментарий<input name="comment" maxLength={500} placeholder="Необязательно"/></label><button className="button primary">Создать сертификат</button></form></>;
}
