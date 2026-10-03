"use client";

import { useState } from "react";

import { CosmetologyCalendar, type CalendarAppointment } from "@/components/cosmetology-calendar";
import { CosmetologyPaymentComponentsFields } from "@/components/cosmetology-payment-components-fields";

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
  initialDate?: string;
  createAppointment: (formData: FormData) => void | Promise<void>;
};

export function CosmetologyBookings({ appointments, clients, templates, today, initialDate, createAppointment }: BookingsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return <>
    <CosmetologyCalendar appointments={appointments} initialDate={initialDate} onNewAppointment={() => setIsOpen(true)}/>
    {isOpen && <div className={styles.backdrop} role="presentation" onMouseDown={() => setIsOpen(false)}>
      <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="new-appointment-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className={styles.header}><h2 id="new-appointment-title">Новая запись</h2><button type="button" className={styles.close} aria-label="Закрыть" onClick={() => setIsOpen(false)}>×</button></header>
        <form action={createAppointment} className={`compact-form ${styles.form}`}>
          <label className={styles.primaryField}>Клиент<select name="clientId" defaultValue=""><option value="">Выбрать клиента</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}{client.phone !== "Не указан" ? ` · ${client.phone}` : ""}</option>)}</select></label>

          <details className={styles.optional}><summary>Новый клиент <span>+</span></summary><div className="form-grid"><label>Имя<input name="clientName" placeholder="Оля"/></label><label>Телефон<input name="phone" type="tel" placeholder="+380…"/></label></div><label>Instagram<input name="contactValue" placeholder="@username"/></label></details>

          <label className={styles.primaryField}>Услуга<select name="procedureTemplateId" defaultValue=""><option value="">Выбрать услугу</option>{templates.map((template) => <option key={template.id} value={template.id}>{template.name}{template.basePrice ? ` · ${template.basePrice} грн` : ""}</option>)}</select></label>
          <details className={styles.optional}><summary>Ввести услугу вручную <span>+</span></summary><div className="form-grid"><label>Название<input name="procedureName" placeholder="Чистка"/></label><label>Цена<input name="plannedAmount" inputMode="decimal" placeholder="0,00"/></label></div></details>

          <div className={`form-grid ${styles.schedule}`}><label>Дата<input name="operationDate" type="date" required defaultValue={today}/></label><label>Время<input name="scheduledTime" type="time" min="08:00" max="20:00"/></label><label>Длительность<select name="durationMinutes" defaultValue="60"><option value="15">15 мин</option><option value="30">30 мин</option><option value="45">45 мин</option><option value="60">1 час</option><option value="75">1 ч 15 мин</option><option value="90">1 ч 30 мин</option><option value="120">2 часа</option></select></label></div>

          <details className={styles.optional}><summary>Предоплата <span>При необходимости</span></summary><CosmetologyPaymentComponentsFields legend="Способ оплаты"/></details>
          <details className={styles.optional}><summary>Заметка <span>+</span></summary><label className={styles.noteField}>Комментарий<input name="comment" placeholder="Коротко о записи"/></label></details>
          <button className="button primary">Создать запись</button>
        </form>
      </section>
    </div>}
  </>;
}
