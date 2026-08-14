import Link from "next/link";

import { requireUser } from "@/server/auth";
import { clientSources, getCosmetologyClients } from "@/server/cosmetology";
import { createCosmetologyClientAction } from "../../actions";

export default async function NewClientPage() {
  const user = await requireUser(); const clients = await getCosmetologyClients(user.id);
  return <><header className="page-header"><div><p className="eyebrow">Косметология · Клиент</p><h1>Новый клиент</h1></div><Link href="/cosmetology/clients" className="text-link">Назад</Link></header><form action={createCosmetologyClientAction} className="transaction-form"><div className="form-grid"><label>Имя<input name="firstName" required/></label><label>Фамилия<input name="lastName" required/></label></div><div className="form-grid"><label>Телефон<input name="phone" type="tel" required/></label><label>День рождения<input name="birthDate" type="date"/></label></div><label>Instagram / ссылка<input name="contactValue" placeholder="Необязательно"/></label><input type="hidden" name="contactMethod" value="INSTAGRAM"/><div className="form-grid"><label>Источник<select name="source"><option value="">Не указан</option>{clientSources.map(source=><option key={source}>{source}</option>)}</select></label><label>Кто порекомендовал<select name="referrerId" defaultValue=""><option value="">Неизвестно / не по рекомендации</option>{clients.map(client=><option key={client.id} value={client.id}>{client.displayName??`${client.firstName} ${client.lastName}`}</option>)}</select></label></div><input type="hidden" name="status" value="NEW"/><label>Теги через запятую<input name="tags" placeholder="чувствительный, сложный клиент"/></label><label>Заметки<input name="notes"/></label><label>Аллергии<input name="allergies"/></label><label>Противопоказания<input name="contraindications"/></label><label>Медицинские заметки<textarea name="medicalNotes"/></label><button className="button primary">Сохранить клиента</button></form></>;
}
