"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import styles from "./cosmetology-calendar.module.css";

export type CalendarAppointment = {
  id: string;
  operationDate: string;
  scheduledTime: string | null;
  durationMinutes: number | null;
  procedureName: string;
  clientName: string;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
};

type CalendarView = "day" | "week" | "list";
type ListStatus = "SCHEDULED" | "ARCHIVED";

const dayFormatter = new Intl.DateTimeFormat("ru-RU", { weekday: "short", day: "numeric", month: "long" });
const monthFormatter = new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" });
const dateFormatter = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", year: "numeric" });
const weekdayFormatter = new Intl.DateTimeFormat("ru-RU", { weekday: "short" });
const hours = Array.from({ length: 13 }, (_, index) => index + 8);

function parseDate(value: string) {
  return new Date(`${value}T12:00:00`);
}

function dateKey(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(value: Date, days: number) {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfWeek(value: Date) {
  const day = value.getDay() || 7;
  return addDays(value, 1 - day);
}

function timeOffset(value: string | null) {
  if (!value) return 0;
  const [hoursPart, minutesPart] = value.split(":").map(Number);
  return Math.max(0, Math.min(720, (hoursPart - 8) * 60 + minutesPart));
}

function appointmentStyle(item: CalendarAppointment) {
  const offset = timeOffset(item.scheduledTime);
  const height = Math.max(38, ((item.durationMinutes ?? 60) / 60) * 72 - 4);
  return { top: `${(offset / 60) * 72}px`, height: `${height}px` };
}

function appointmentLabel(item: CalendarAppointment) {
  const duration = item.durationMinutes ? `${item.durationMinutes} мин` : "";
  return [item.scheduledTime, duration].filter(Boolean).join(" · ");
}

function CalendarEvent({ item }: { item: CalendarAppointment }) {
  return <Link href={`/cosmetology/visits/${item.id}`} className={`${styles.event} ${item.status !== "SCHEDULED" ? styles.completed : ""}`} style={appointmentStyle(item)} title={`${item.clientName}: ${item.procedureName}`}><b>{item.scheduledTime ?? "Без времени"}</b><span>{item.clientName}</span><small>{item.procedureName}</small></Link>;
}

export function CosmetologyCalendar({ appointments, onNewAppointment }: { appointments: CalendarAppointment[]; onNewAppointment: () => void }) {
  const [view, setView] = useState<CalendarView>("week");
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [listStatus, setListStatus] = useState<ListStatus>("SCHEDULED");
  const selectedKey = dateKey(selectedDate);
  const weekStart = startOfWeek(selectedDate);
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const currentMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  const monthStart = startOfWeek(currentMonth);
  const monthDays = Array.from({ length: 42 }, (_, index) => addDays(monthStart, index));
  const datedAppointments = useMemo(() => appointments.filter((item) => item.scheduledTime), [appointments]);
  const unscheduledAppointments = useMemo(() => appointments.filter((item) => !item.scheduledTime && item.status === "SCHEDULED"), [appointments]);
  const dayAppointments = datedAppointments.filter((item) => item.operationDate === selectedKey);
  const listAppointments = [...appointments].filter((item) => listStatus === "SCHEDULED" ? item.status === "SCHEDULED" : item.status !== "SCHEDULED").sort((left, right) => `${left.operationDate}-${left.scheduledTime ?? ""}`.localeCompare(`${right.operationDate}-${right.scheduledTime ?? ""}`));

  function changePeriod(direction: number) {
    setSelectedDate(addDays(selectedDate, view === "week" ? direction * 7 : direction));
  }

  return <section className="app-card">
    <div className={styles.header}>
      <div><p className="eyebrow">Календарь</p><h2>{view === "day" ? dayFormatter.format(selectedDate) : view === "week" ? `${dateFormatter.format(weekStart)} — ${dateFormatter.format(weekDays[6])}` : "Все записи"}</h2></div>
      <button type="button" className="button primary" onClick={onNewAppointment}>＋ Новая запись</button>
    </div>
    <div className={styles.controls}>
      <div className={styles.viewSwitch} aria-label="Вид календаря"><button type="button" className={view === "day" ? styles.active : ""} onClick={() => setView("day")}>День</button><button type="button" className={view === "week" ? styles.active : ""} onClick={() => setView("week")}>Неделя</button><button type="button" className={view === "list" ? styles.active : ""} onClick={() => setView("list")}>Список</button></div>
      {view !== "list" && <div className={styles.dateControls}><button type="button" aria-label="Предыдущий период" onClick={() => changePeriod(-1)}>←</button><button type="button" onClick={() => setSelectedDate(new Date())}>Сегодня</button><button type="button" aria-label="Следующий период" onClick={() => changePeriod(1)}>→</button></div>}
    </div>
    {view === "day" && <div className={styles.scheduleWrap}><div className={styles.schedule}><div className={styles.hourLabels}>{hours.map((hour) => <span key={hour} style={{ top: `${(hour - 8) * 72}px` }}>{String(hour).padStart(2, "0")}:00</span>)}</div><div className={styles.dayColumn}>{dayAppointments.map((item) => <CalendarEvent item={item} key={item.id}/>)}</div></div>{dayAppointments.length === 0 && <p className={styles.empty}>На этот день записей нет.</p>}</div>}
    {view === "week" && <div className={styles.weekWrap}><div className={styles.weekHeader}>{weekDays.map((day) => <button type="button" key={dateKey(day)} onClick={() => { setSelectedDate(day); setView("day"); }} className={dateKey(day) === selectedKey ? styles.selectedDay : ""}><span>{weekdayFormatter.format(day)}</span><b>{day.getDate()}</b></button>)}</div><div className={styles.weekSchedule}>{hours.map((hour) => <span className={styles.weekHour} key={hour} style={{ top: `${(hour - 8) * 72}px` }}>{String(hour).padStart(2, "0")}:00</span>)}{weekDays.map((day) => <div className={styles.weekColumn} key={dateKey(day)}>{datedAppointments.filter((item) => item.operationDate === dateKey(day)).map((item) => <CalendarEvent item={item} key={item.id}/>)}</div>)}</div></div>}
    {view === "list" && <><div className={styles.listTabs}><button type="button" className={listStatus === "SCHEDULED" ? styles.active : ""} onClick={() => setListStatus("SCHEDULED")}>Ближайшие</button><button type="button" className={listStatus === "ARCHIVED" ? styles.active : ""} onClick={() => setListStatus("ARCHIVED")}>Архив</button></div><div className={styles.list}>{listAppointments.map((item) => <Link href={`/cosmetology/visits/${item.id}`} key={item.id} className={styles.listItem}><span><b>{dateFormatter.format(parseDate(item.operationDate))}</b><small>{appointmentLabel(item) || "Время не указано"}</small></span><span><b>{item.clientName}</b><small>{item.procedureName}</small></span><strong>{item.status === "SCHEDULED" ? "Открыть →" : item.status === "COMPLETED" ? "Выполнено" : item.status === "NO_SHOW" ? "Не пришла" : "Отменено"}</strong></Link>)}{listAppointments.length === 0 && <p className={styles.empty}>Записей в этом разделе пока нет.</p>}</div></>}
    {unscheduledAppointments.length > 0 && view !== "list" && <div className={styles.unscheduled}><b>Без времени</b>{unscheduledAppointments.map((item) => <Link href={`/cosmetology/visits/${item.id}`} key={item.id}>{item.clientName} · {item.procedureName}</Link>)}</div>}
    <div className={styles.monthCard}><div className={styles.monthHeader}><b>{monthFormatter.format(currentMonth)}</b><span>{appointments.filter((item) => item.status === "SCHEDULED" && item.operationDate === selectedKey).length} записей на выбранный день</span></div><div className={styles.weekdays}>{["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((day) => <span key={day}>{day}</span>)}</div><div className={styles.monthGrid}>{monthDays.map((day) => { const key = dateKey(day); const count = appointments.filter((item) => item.operationDate === key && item.status === "SCHEDULED").length; return <button type="button" key={key} className={`${day.getMonth() === currentMonth.getMonth() ? "" : styles.otherMonth} ${key === selectedKey ? styles.selectedDate : ""}`} onClick={() => setSelectedDate(day)}>{day.getDate()}{count > 0 && <i>{count}</i>}</button>; })}</div></div>
  </section>;
}
