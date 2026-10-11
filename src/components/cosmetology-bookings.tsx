"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { CosmetologyCalendar, type CalendarAppointment, type CalendarFinancialEvent } from "@/components/cosmetology-calendar";
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
  financialEvents: CalendarFinancialEvent[];
  clients: ClientOption[];
  templates: TemplateOption[];
  today: string;
  initialDate?: string;
  openAppointment?: boolean;
  createAppointment: (formData: FormData) => void | Promise<void>;
};

export function CosmetologyBookings({ appointments, financialEvents, clients, templates, today, initialDate, openAppointment = false, createAppointment }: BookingsProps) {
  const [isOpen, setIsOpen] = useState(openAppointment);
  const [appointmentDraft, setAppointmentDraft] = useState<{ date?: string; time?: string }>({ date: initialDate });
  const [clientQuery, setClientQuery] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [clientPickerOpen, setClientPickerOpen] = useState(false);
  const router = useRouter();
  const selectedClient = clients.find((client) => client.id === selectedClientId);
  const matchingClients = useMemo(() => {
    const query = clientQuery.trim().toLocaleLowerCase("uk-UA");
    const digits = query.replace(/\D/g, "");
    if (!query) return clients.slice(0, 8);
    return clients.filter((client) => client.name.toLocaleLowerCase("uk-UA").includes(query) || (digits.length > 0 && client.phone.replace(/\D/g, "").includes(digits))).slice(0, 12);
  }, [clientQuery, clients]);

  useEffect(() => {
    if (!openAppointment) return;
    setAppointmentDraft({ date: initialDate ?? today });
    setIsOpen(true);
  }, [initialDate, openAppointment, today]);

  function openNewAppointment(draft?: { date?: string; time?: string }) {
    setAppointmentDraft({ date: draft?.date ?? initialDate ?? today, time: draft?.time });
    setIsOpen(true);
  }

  function closeAppointment() {
    setIsOpen(false);
    if (openAppointment) router.replace(initialDate ? `/cosmetology/visits?date=${initialDate}` : "/cosmetology/visits");
  }

  return <>
    <CosmetologyCalendar appointments={appointments} financialEvents={financialEvents} initialDate={initialDate} onNewAppointment={openNewAppointment} onNewTransaction={(type, date) => router.push(`/safe/new?type=${type}&module=COSMETOLOGY&date=${date}&returnTo=${encodeURIComponent(`/cosmetology/visits?date=${date}`)}`)}/>
    {isOpen && <div className={styles.backdrop} role="presentation" onMouseDown={closeAppointment}>
      <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="new-appointment-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className={styles.header}><h2 id="new-appointment-title">Новая запись</h2><button type="button" className={styles.close} aria-label="Закрыть" onClick={closeAppointment}>×</button></header>
        <form action={createAppointment} className={`compact-form ${styles.form}`}>
          <div className={`${styles.primaryField} ${styles.clientPicker}`}>
            <label htmlFor="appointment-client-search">Клиент</label>
            <input name="clientId" type="hidden" value={selectedClientId} readOnly/>
            {selectedClient ? <div className={styles.selectedClient}><span><b>{selectedClient.name}</b>{selectedClient.phone !== "Не указан" && <small>{selectedClient.phone}</small>}</span><button type="button" onClick={() => { setSelectedClientId(""); setClientQuery(""); setClientPickerOpen(true); }}>Изменить</button></div> : <>
              <input id="appointment-client-search" type="search" autoComplete="off" inputMode="search" placeholder="Имя или последние 4 цифры телефона" value={clientQuery} onFocus={() => setClientPickerOpen(true)} onChange={(event) => { setClientQuery(event.target.value); setClientPickerOpen(true); }}/>
              {clientPickerOpen && <div className={styles.clientResults} role="listbox" aria-label="Найденные клиенты">{matchingClients.length ? matchingClients.map((client) => <button type="button" role="option" aria-selected="false" key={client.id} onMouseDown={(event) => event.preventDefault()} onClick={() => { setSelectedClientId(client.id); setClientQuery(client.name); setClientPickerOpen(false); }}><span>{client.name}</span>{client.phone !== "Не указан" && <small>{client.phone}</small>}</button>) : <p>Клиент не найден. Можно создать нового ниже.</p>}</div>}
            </>}
          </div>

          <details className={styles.quickOptional}><summary><span>+</span> Новый клиент</summary><div className="form-grid"><label>Имя<input name="clientName" placeholder="Оля"/></label><label>Телефон<input name="phone" type="tel" placeholder="+380…"/></label></div><label>Instagram<input name="contactValue" placeholder="@username"/></label></details>

          <label className={styles.primaryField}>Услуга<select name="procedureTemplateId" defaultValue=""><option value="">Выбрать услугу</option>{templates.map((template) => <option key={template.id} value={template.id}>{template.name}{template.basePrice ? ` · ${template.basePrice} грн` : ""}</option>)}</select></label>
          <details className={styles.quickOptional}><summary><span>+</span> Ввести услугу вручную</summary><label>Название<input name="procedureName" placeholder="Чистка"/></label></details>
          <label className={styles.primaryField}>Ориентировочная сумма<input name="plannedAmount" inputMode="decimal" placeholder="0,00"/></label>

          <div className={`form-grid ${styles.schedule}`}><label>Дата<input name="operationDate" type="date" required defaultValue={appointmentDraft.date ?? today}/></label><label>Время<input name="scheduledTime" type="time" min="08:00" max="20:00" defaultValue={appointmentDraft.time}/></label><label>Длительность<select name="durationMinutes" defaultValue="60"><option value="15">15 мин</option><option value="30">30 мин</option><option value="45">45 мин</option><option value="60">1 час</option><option value="75">1 ч 15 мин</option><option value="90">1 ч 30 мин</option><option value="120">2 часа</option></select></label></div>

          <details className={styles.optional}><summary>Предоплата <span>При необходимости</span></summary><div className={styles.prepayment}><CosmetologyPaymentComponentsFields legend="Способ оплаты" compact/></div></details>
          <details className={styles.optional}><summary>Заметка <span>+</span></summary><label className={styles.noteField}>Комментарий<input name="comment" placeholder="Коротко о записи"/></label></details>
          <button className="button primary">Создать запись</button>
        </form>
      </section>
    </div>}
  </>;
}
