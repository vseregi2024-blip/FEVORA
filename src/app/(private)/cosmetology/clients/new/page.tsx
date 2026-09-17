import Link from "next/link";

import { ClientAnamnesisFields } from "@/components/client-anamnesis-fields";
import { ImperiaDateField } from "@/components/imperia-date-field";
import { requireUser } from "@/server/auth";
import { clientSources, getCosmetologyClients } from "@/server/cosmetology";
import { createCosmetologyClientAction } from "../../actions";

export default async function NewClientPage() {
  const user = await requireUser();
  const clients = await getCosmetologyClients(user.id);
  return <>
    <header className="page-header"><div><p className="eyebrow">IMPERIA · Клиенты</p><h1>Новый клиент</h1><p className="muted">Контакты, рекомендации и медицинская информация в одной карточке.</p></div><Link href="/cosmetology/clients" className="text-link">Закрыть</Link></header>
    <form action={createCosmetologyClientAction} className="transaction-form imperia-form client-profile-form">
      <label>Имя и фамилия<input name="fullName" required autoFocus placeholder="Например: Ирина Коваленко"/></label>
      <div className="form-grid"><label>Телефон<input name="phone" type="tel" required placeholder="+380…"/></label><ImperiaDateField name="birthDate" label="Дата рождения" optional/></div>
      <label>Прямая ссылка на Instagram<input name="contactValue" type="url" placeholder="https://instagram.com/…"/></label>
      <input type="hidden" name="contactMethod" value="INSTAGRAM"/>
      <div className="form-grid"><label>Источник<select name="source" defaultValue=""><option value="">Не указан</option>{clientSources.map((source) => <option key={source}>{source}</option>)}</select></label><label>Кто порекомендовал<select name="referrerId" defaultValue=""><option value="">Никто / неизвестно</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.displayName ?? `${client.firstName} ${client.lastName}`.trim()}</option>)}</select></label></div>
      <input type="hidden" name="status" value="NEW"/>
      <label>Заметки о клиенте<textarea name="notes" placeholder="Предпочтения, важные договорённости и особенности общения"/></label>
      <ClientAnamnesisFields/>
      <button className="button primary wide">Создать карточку клиента</button>
    </form>
  </>;
}
