"use client";

import { useState } from "react";

import { CosmetologyCalendar, type CalendarAppointment } from "@/components/cosmetology-calendar";

import styles from "./cosmetology-bookings.module.css";

type ClientOption = {
  id: string;
  name: string;
  phone: string;
};

type TemplateOption = {
  id: string;
  name: string;
  basePrice: string | null;
};

type BookingsProps = {
  appointments: CalendarAppointment[];
  clients: ClientOption[];
  templates: TemplateOption[];
  today: string;
  createAppointment: (formData: FormData) => void | Promise<void>;
};

export function CosmetologyBookings({ appointments, clients, templates, today, createAppointment }: BookingsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return <><CosmetologyCalendar appointments={appointments} onNewAppointment={() => setIsOpen(true)}/>{isOpen && <div className={styles.backdrop} role="presentation" onMouseDown={() => setIsOpen(false)}><section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="new-appointment-title" onMouseDown={(event) => event.stopPropagation()}><header className={styles.header}><div><p className="eyebrow">Новая запись</p><h2 id="new-appointment-title">Записать клиента</h2></div><button type="button" className={styles.close} aria-label="Закрыть" onClick={() => setIsOpen(false)}>×</button></header><form action={createAppointment} className="compact-form"><label>Клиент<select name="clientId" defaultValue=""><option value="">Новый или не выбран</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}{client.phone !== "Не указан" ? ` · ${client.phone}` : ""}</option>)}</select></label><div className="form-grid"><label>Имя нового клиента<input name="clientName" placeholder="Например, Оля"/></label><label>Телефон<input name="phone" type="tel" placeholder="Необязательно"/></label></div><label>Instagram / ссылка<input name="contactValue" placeholder="Необязательно"/></label><label>Услуга<select name="procedureTemplateId" defaultValue=""><option value="">Ввести вручную</option>{templates.map((template) => <option key={template.id} value={template.id}>{template.name}{template.basePrice ? ` · ${template.basePrice} грн` : ""}</option>)}</select></label><div className="form-grid"><label>Или название услуги<input name="procedureName" placeholder="Чистка лица"/></label><label>Плановая цена<input name="plannedAmount" inputMode="decimal" placeholder="Из прайса"/></label></div><div className="form-grid"><label>Дата<input name="operationDate" type="date" required defaultValue={today}/></label><label>Время<input name="scheduledTime" type="time" min="08:00" max="20:00"/></label></div><label>Длительность<select name="durationMinutes" defaultValue="60"><option value="15">15 мин</option><option value="30">30 мин</option><option value="45">45 мин</option><option value="60">1 час</option><option value="75">1 ч 15 мин</option><option value="90">1 ч 30 мин</option><option value="120">2 часа</option></select></label><fieldset><legend>Предоплата — укажите только полученные суммы</legend><div className="form-grid"><label>Наличные<input name="cashAmount" inputMode="decimal" defaultValue="0"/></label><label>Monobank<input name="monoAmount" inputMode="decimal" defaultValue="0"/></label><label>ПриватБанк<input name="privatAmount" inputMode="decimal" defaultValue="0"/></label></div></fieldset><label>Заметка<input name="comment" placeholder="Необязательно"/></label><button className="button primary">Создать запись</button></form></section></div>}</>;
}
