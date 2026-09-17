import Link from "next/link";

import { ClientAnamnesisFields } from "@/components/client-anamnesis-fields";
import { LoyaltyClientCard } from "@/components/loyalty-client-card";
import { dateToInput, todayInputValue } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { requireUser } from "@/server/auth";
import { clientMarks, clientSources, getCosmetologyClient, getCosmetologyClients } from "@/server/cosmetology";

import { createTreatmentPlanAction, updateCosmetologyClientAction } from "../../actions";

type ClientQuery = { loyaltySearch?: string; loyaltyError?: string; loyaltyLinked?: string; loyaltyUnlinked?: string; loyaltyPage?: string };

export default async function ClientPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<ClientQuery> }) {
  const user = await requireUser();
  const { id } = await params;
  const query = await searchParams;
  const [client, clients] = await Promise.all([getCosmetologyClient(user.id, id), getCosmetologyClients(user.id)]);
  const displayName = client.displayName ?? `${client.firstName} ${client.lastName}`.trim();

  return <>
    <header className="page-header"><div><p className="eyebrow">IMPERIA · Клиент</p><h1>{displayName}</h1><p className="muted">Контакты, анамнез, программа лояльности, история и план процедур.</p></div><Link href="/cosmetology/clients" className="button secondary">К клиентам</Link></header>
    {query.loyaltyLinked && <p className="notice">Клиент подключён к Beauty Bonus Club.</p>}
    {query.loyaltyUnlinked && <p className="notice">Связь удалена. Клиенты и бонусы не изменены.</p>}
    <section className="metric-grid family-summary"><article><span>Посещений</span><strong>{client.summary.visits}</strong></article><article><span>Оплаты</span><strong className="income">{formatMoney(client.summary.paid)}</strong></article><article><span>Средний чек</span><strong>{formatMoney(client.summary.average)}</strong></article><article><span>Последний визит</span><strong>{client.summary.lastVisit ? client.summary.lastVisit.toLocaleDateString("ru-RU") : "—"}</strong></article></section>

    <LoyaltyClientCard clientId={client.id} loyaltyClientId={client.loyaltyClientId} phone={client.phone} searchPhone={query.loyaltySearch} errorMessage={query.loyaltyError} historyPage={Number(query.loyaltyPage) || 1}/>

    <section className="family-grid">
      <article className="app-card"><h2>Карточка клиента</h2><form action={updateCosmetologyClientAction} className="compact-form"><input type="hidden" name="id" value={client.id}/><label>Имя и фамилия<input name="fullName" required defaultValue={displayName}/></label><div className="form-grid"><label>Телефон<input name="phone" required defaultValue={client.phone}/></label><label>Дата рождения<input name="birthDate" type="date" defaultValue={client.birthDate ? dateToInput(client.birthDate) : ""}/></label></div><div className="form-grid"><label>Способ связи<select name="contactMethod" defaultValue={client.contactMethod}><option value="PHONE">Телефон</option><option value="VIBER">Viber</option><option value="WHATSAPP">WhatsApp</option><option value="TELEGRAM">Telegram</option><option value="INSTAGRAM">Instagram</option><option value="TIKTOK">TikTok</option></select></label><label>Прямая ссылка / username<input name="contactValue" defaultValue={client.contactValue ?? ""}/></label></div><div className="form-grid"><label>Источник<select name="source" defaultValue={client.source ?? ""}><option value="">Не указан</option>{clientSources.map((source) => <option key={source}>{source}</option>)}</select></label>{client.loyaltyClientId ? <input type="hidden" name="referrerId" value={client.referrerId ?? ""}/> : <label>Кто порекомендовал <small>локальная отметка</small><select name="referrerId" defaultValue={client.referrerId ?? ""}><option value="">Никто / неизвестно</option>{clients.filter((item) => item.id !== client.id).map((item) => <option key={item.id} value={item.id}>{item.displayName ?? `${item.firstName} ${item.lastName}`.trim()}</option>)}</select></label>}</div><label>Статус<select name="status" defaultValue={client.status}><option value="NEW">Новый</option><option value="REGULAR">Постоянный</option><option value="VIP">VIP</option><option value="POTENTIAL">Потенциальный</option><option value="INACTIVE">Не возвращается</option></select></label><fieldset><legend>Особые отметки</legend>{clientMarks.map((mark) => <label className="checkbox-label" key={mark}><input name="specialMarks" type="checkbox" value={mark} defaultChecked={client.specialMarks.includes(mark)}/>{mark}</label>)}</fieldset><label>Заметки о клиенте<textarea name="notes" defaultValue={client.notes ?? ""}/></label><ClientAnamnesisFields allergies={client.allergies ?? ""} contraindications={client.contraindications ?? ""} medicalNotes={client.medicalNotes ?? ""}/><button className="button primary">Сохранить карточку</button></form></article>
      <article className="app-card treatment-plan-card"><p className="eyebrow">Планировали</p><h2>План процедур</h2><p className="muted">Что рекомендуем сделать клиенту дальше.</p><form action={createTreatmentPlanAction} className="compact-form"><input type="hidden" name="clientId" value={client.id}/><label>Процедура или рекомендация<input name="title" required placeholder="Биоревитализация"/></label><div className="form-grid"><label>Ориентировочная дата<input name="plannedDate" type="date" defaultValue={todayInputValue()}/></label><label>Статус<select name="status"><option value="RECOMMENDED">Рекомендовано</option><option value="SCHEDULED">Запланировано</option><option value="COMPLETED">Выполнено</option><option value="CANCELLED">Отменено</option></select></label></div><label>Заметка<textarea name="note" placeholder="Что обсудили с клиентом"/></label><button className="button secondary">Добавить в план</button></form><div className="mini-list">{client.planItems.map((item) => <div key={item.id}><span><b>{item.title}</b><small>{item.plannedDate?.toLocaleDateString("ru-RU") ?? "Без даты"} · {item.status}</small></span></div>)}</div>{!client.planItems.length && <p className="empty">План пока не заполнен.</p>}</article>
    </section>

    <section className="section-header"><div><p className="eyebrow">История процедур</p><h2>Что и когда делали</h2></div><Link className="text-link" href="/cosmetology/visits">Новая процедура</Link></section><div className="transaction-list">{client.visits.map((visit) => <Link href={`/cosmetology/visits/${visit.id}`} className="transaction-row" key={visit.id}><span><b>{visit.procedureName}</b><small>{visit.operationDate.toLocaleDateString("ru-RU")} · себестоимость {formatMoney(visit.costAmount.toString())}</small></span><strong className="income">+{formatMoney(visit.paidAmount.toString())}</strong></Link>)}</div>{!client.visits.length && <p className="empty">Процедур пока нет.</p>}
  </>;
}
