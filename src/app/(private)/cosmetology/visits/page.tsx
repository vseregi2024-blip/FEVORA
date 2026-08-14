import Link from "next/link";

import { CosmetologyCalendar } from "@/components/cosmetology-calendar";
import { todayInputValue } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { requireUser } from "@/server/auth";
import { getCosmetologyAppointments, getCosmetologyDashboard } from "@/server/cosmetology";

import { createCosmetologyAppointmentAction } from "../actions";

export default async function VisitsPage() {
  const user = await requireUser();
  const [dashboard, appointments] = await Promise.all([getCosmetologyDashboard(user.id), getCosmetologyAppointments(user.id)]);
  const calendarAppointments = appointments.map((item) => ({
    id: item.id,
    operationDate: item.operationDate.toISOString().slice(0, 10),
    scheduledTime: item.scheduledTime,
    durationMinutes: item.durationMinutes,
    procedureName: item.procedureName,
    clientName: item.client.displayName ?? `${item.client.lastName} ${item.client.firstName}`,
    status: item.status,
  }));

  return <><header className="page-header"><div><p className="eyebrow">Косметология · Календарь</p><h1>Записи клиентов</h1><p className="muted">Запись не создаёт доход и не списывает товар. Закройте процедуру после фактического выполнения.</p></div><Link href="/cosmetology" className="button secondary">Назад</Link></header>
    <CosmetologyCalendar appointments={calendarAppointments}/>
    <section id="new-appointment" className="section-header"><div><p className="eyebrow">Новая запись</p><h2>Записать клиента</h2></div><Link href="/cosmetology/procedures" className="text-link">Настроить услуги</Link></section>
    <section className="family-grid"><article className="app-card"><form action={createCosmetologyAppointmentAction} className="compact-form"><label>Клиент<select name="clientId" defaultValue=""><option value="">Новый или не выбран</option>{dashboard.clients.map((client) => <option key={client.id} value={client.id}>{client.displayName ?? `${client.lastName} ${client.firstName}`} {client.phone !== "Не указан" ? `· ${client.phone}` : ""}</option>)}</select></label><div className="form-grid"><label>Имя нового клиента<input name="clientName" placeholder="Например, Оля"/></label><label>Телефон<input name="phone" type="tel" placeholder="Необязательно"/></label></div><label>Instagram / ссылка<input name="contactValue" placeholder="Необязательно"/></label><label>Услуга<select name="procedureTemplateId" defaultValue=""><option value="">Ввести вручную</option>{dashboard.templates.map((template) => <option key={template.id} value={template.id}>{template.name}{template.basePrice ? ` · ${formatMoney(template.basePrice.toString())}` : ""}</option>)}</select></label><div className="form-grid"><label>Или название услуги<input name="procedureName" placeholder="Чистка лица"/></label><label>Плановая цена<input name="plannedAmount" inputMode="decimal" placeholder="Из прайса"/></label></div><div className="form-grid"><label>Дата<input name="operationDate" type="date" required defaultValue={todayInputValue()}/></label><label>Время<input name="scheduledTime" type="time" min="08:00" max="20:00"/></label></div><label>Длительность<select name="durationMinutes" defaultValue="60"><option value="15">15 мин</option><option value="30">30 мин</option><option value="45">45 мин</option><option value="60">1 час</option><option value="75">1 ч 15 мин</option><option value="90">1 ч 30 мин</option><option value="120">2 часа</option></select></label><fieldset><legend>Предоплата — укажите только полученные суммы</legend><div className="form-grid"><label>Наличные<input name="cashAmount" inputMode="decimal" defaultValue="0"/></label><label>Monobank<input name="monoAmount" inputMode="decimal" defaultValue="0"/></label><label>ПриватБанк<input name="privatAmount" inputMode="decimal" defaultValue="0"/></label></div></fieldset><label>Заметка<input name="comment" placeholder="Необязательно"/></label><button className="button primary">Создать запись</button></form></article><article className="app-card"><h2>Как это работает</h2><p className="muted">Выберите услугу, дату и время. Предоплата сохраняется отдельно, а доход и расходники появятся только при закрытии процедуры.</p><p className="summary-note">В календаре можно открыть любую запись и завершить процедуру по факту.</p></article></section>
  </>;
}
