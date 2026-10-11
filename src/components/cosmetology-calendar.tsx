"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { AppIcon } from "@/components/ui/icons";
import { IconCircle } from "@/components/ui/imperia";

import styles from "./cosmetology-calendar.module.css";

export type CalendarAppointment = { id: string; operationDate: string; scheduledTime: string | null; durationMinutes: number | null; procedureName: string; clientName: string; status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW" };
export type CalendarFinancialEvent = { id: string; operationDate: string; type: "INCOME" | "EXPENSE"; amount: string; category: string; module: string; wallet: string };
type CalendarView = "month" | "day" | "week" | "list";
type ListStatus = "SCHEDULED" | "ARCHIVED";
type EventFilter = "ALL" | "APPOINTMENT" | "INCOME" | "EXPENSE";

const dayFormatter = new Intl.DateTimeFormat("ru-RU", { weekday: "long", day: "numeric", month: "long" });
const monthFormatter = new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" });
const dateFormatter = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", year: "numeric" });
const weekdayFormatter = new Intl.DateTimeFormat("ru-RU", { weekday: "short" });
const hours = Array.from({ length: 13 }, (_, index) => index + 8);
const statusLabels = { SCHEDULED: "Запланировано", COMPLETED: "Выполнено", CANCELLED: "Отменено", NO_SHOW: "Не пришла" } as const;

function parseDate(value: string) { return new Date(`${value}T12:00:00`); }
function dateKey(value: Date) { return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`; }
function addDays(value: Date, days: number) { const next = new Date(value); next.setDate(next.getDate() + days); return next; }
function addMonths(value: Date, months: number) { const next = new Date(value); next.setMonth(next.getMonth() + months); return next; }
function startOfWeek(value: Date) { return addDays(value, 1 - (value.getDay() || 7)); }
function timeOffset(value: string | null) { if (!value) return 0; const [hour, minute] = value.split(":").map(Number); return Math.max(0, Math.min(720, (hour - 8) * 60 + minute)); }
function appointmentStyle(item: CalendarAppointment) { const offset = timeOffset(item.scheduledTime); return { top: `${(offset / 60) * 72}px`, height: `${Math.max(38, ((item.durationMinutes ?? 60) / 60) * 72 - 4)}px` }; }
function appointmentLabel(item: CalendarAppointment) { return [item.scheduledTime, item.durationMinutes ? `${item.durationMinutes} мин` : ""].filter(Boolean).join(" · "); }
function CalendarEvent({ item }: { item: CalendarAppointment }) { return <Link href={`/cosmetology/visits/${item.id}`} className={`${styles.event} ${styles[`status${item.status}`]}`} style={appointmentStyle(item)} title={`${item.clientName}: ${item.procedureName}`}><b>{item.scheduledTime ?? "Без времени"}</b><span>{item.clientName}</span><small>{item.procedureName}</small></Link>; }
function FinancialEvent({ item }: { item: CalendarFinancialEvent }) { const income = item.type === "INCOME"; return <article className={`${styles.financialEvent} ${income ? styles.incomeEvent : styles.expenseEvent}`}><span>{income ? "↑ Доход" : "↓ Расход"}</span><b>{item.category}</b><small>{item.module} · {item.wallet}</small><strong>{income ? "+" : "−"}{item.amount} UAH</strong></article>; }

export function CosmetologyCalendar({ appointments, financialEvents, onNewAppointment, onNewTransaction, initialDate }: { appointments: CalendarAppointment[]; financialEvents: CalendarFinancialEvent[]; onNewAppointment: (draft?: { date?: string; time?: string }) => void; onNewTransaction: (type: "INCOME" | "EXPENSE", date: string) => void; initialDate?: string }) {
  const [view, setView] = useState<CalendarView>(initialDate ? "day" : "month");
  const [selectedDate, setSelectedDate] = useState(() => initialDate ? parseDate(initialDate) : new Date());
  const [listStatus, setListStatus] = useState<ListStatus>("SCHEDULED");
  const [filter, setFilter] = useState<EventFilter>("ALL");
  const [addOpen, setAddOpen] = useState(false);
  const selectedKey = dateKey(selectedDate);
  const todayKey = dateKey(new Date());
  const weekStart = startOfWeek(selectedDate);
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const currentMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  const monthStart = startOfWeek(currentMonth);
  const monthDays = Array.from({ length: 42 }, (_, index) => addDays(monthStart, index));
  const datedAppointments = useMemo(() => appointments.filter((item) => item.scheduledTime), [appointments]);
  const unscheduledAppointments = useMemo(() => appointments.filter((item) => !item.scheduledTime && item.status === "SCHEDULED"), [appointments]);
  const dayAppointments = datedAppointments.filter((item) => item.operationDate === selectedKey).sort((a, b) => (a.scheduledTime ?? "").localeCompare(b.scheduledTime ?? ""));
  const selectedDayItems = appointments.filter((item) => item.operationDate === selectedKey).sort((a, b) => (a.scheduledTime ?? "").localeCompare(b.scheduledTime ?? ""));
  const selectedFinancial = financialEvents.filter((item) => item.operationDate === selectedKey && (filter === "ALL" || filter === item.type));
  const upcoming = [...appointments].filter((item) => item.status === "SCHEDULED" && item.operationDate >= todayKey).sort((a, b) => `${a.operationDate}-${a.scheduledTime ?? ""}`.localeCompare(`${b.operationDate}-${b.scheduledTime ?? ""}`)).slice(0, 3);
  const listAppointments = [...appointments].filter((item) => listStatus === "SCHEDULED" ? item.status === "SCHEDULED" : item.status !== "SCHEDULED").sort((a, b) => `${a.operationDate}-${a.scheduledTime ?? ""}`.localeCompare(`${b.operationDate}-${b.scheduledTime ?? ""}`));

  function changePeriod(direction: number) { setSelectedDate(view === "month" ? addMonths(selectedDate, direction) : addDays(selectedDate, view === "week" ? direction * 7 : direction)); }

  return <section className={styles.calendar}>
    <header className={styles.hero}>
      <div className={styles.heroTitle}><IconCircle icon="calendar" tone="pink" size="large"/><span><h1>Календарь</h1><p>Планируй. Развивай. Успевай.</p></span></div>
      <button type="button" className={styles.newButton} onClick={() => setAddOpen(true)} aria-label="Добавить событие">＋ <span>Добавить</span></button>
    </header>

    <div className={styles.toolbar}>
      <div className={styles.viewSwitch} aria-label="Вид календаря"><button type="button" className={view === "month" ? styles.active : ""} onClick={() => setView("month")}>Месяц</button><button type="button" className={view === "day" ? styles.active : ""} onClick={() => setView("day")}>День</button><button type="button" className={view === "week" ? styles.active : ""} onClick={() => setView("week")}>Неделя</button><button type="button" className={view === "list" ? styles.active : ""} onClick={() => setView("list")}>Список</button></div>
      {view !== "list" && <div className={styles.dateControls}><button type="button" onClick={() => setSelectedDate(new Date())}>Сегодня</button><button type="button" aria-label="Предыдущий период" onClick={() => changePeriod(-1)}><AppIcon name="arrow"/></button><button type="button" aria-label="Следующий период" onClick={() => changePeriod(1)}><AppIcon name="arrow"/></button></div>}
    </div>
    <div className={styles.eventFilters} aria-label="Фильтр событий">{([ ["ALL", "Все"], ["APPOINTMENT", "Записи"], ["INCOME", "Доходы"], ["EXPENSE", "Расходы"] ] as const).map(([value, label]) => <button type="button" key={value} className={filter === value ? styles.active : ""} onClick={() => setFilter(value)}>{label}</button>)}</div>

    {view === "month" && <>
      <section className={styles.monthCard}>
        <div className={styles.monthHeader}><b>{monthFormatter.format(currentMonth)}</b><span>{selectedDayItems.length} записей на выбранный день</span></div>
        <div className={styles.weekdays}>{["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((day) => <span key={day}>{day}</span>)}</div>
        <div className={styles.monthGrid}>{monthDays.map((day) => { const key = dateKey(day); const hasAppointments = appointments.some((item) => item.operationDate === key); const types = financialEvents.filter((item) => item.operationDate === key).map((item) => item.type); return <button type="button" key={key} className={`${day.getMonth() === currentMonth.getMonth() ? "" : styles.otherMonth} ${key === selectedKey ? styles.selectedDate : ""} ${key === todayKey ? styles.today : ""}`} onClick={() => { setSelectedDate(day); setView("day"); }}><span>{day.getDate()}</span><i>{(filter === "ALL" || filter === "APPOINTMENT") && hasAppointments && <b className={styles.dotAppointment}/>} {(filter === "ALL" || filter === "INCOME") && types.includes("INCOME") && <b className={styles.dotINCOME}/>} {(filter === "ALL" || filter === "EXPENSE") && types.includes("EXPENSE") && <b className={styles.dotEXPENSE}/>}</i></button>; })}</div>
      </section>

      <section className={styles.upcoming}><header><h2><AppIcon name="calendar"/>Ближайшие записи</h2><button type="button" onClick={() => setView("list")}>Все записи <AppIcon name="arrow"/></button></header>{upcoming.length ? <div>{upcoming.map((item) => <Link href={`/cosmetology/visits/${item.id}`} key={item.id}><small>{item.operationDate === todayKey ? "Сегодня" : dateFormatter.format(parseDate(item.operationDate))} {item.scheduledTime ?? ""}</small><b>{item.clientName}</b><span>{item.procedureName}</span><AppIcon name="arrow"/></Link>)}</div> : <p>Ближайших записей пока нет.</p>}</section>

    </>}

    {view === "day" && <><section className={styles.timelineCard}><div className={styles.periodTitle}><h2>{dayFormatter.format(selectedDate)}</h2><p className={styles.tapHint}>Нажмите на нужное время, чтобы создать запись</p></div><div className={styles.scheduleWrap}><div className={styles.schedule}><div className={styles.hourLabels}>{hours.map((hour) => <span key={hour} style={{ top: `${(hour - 8) * 72}px` }}>{String(hour).padStart(2, "0")}:00</span>)}</div><div className={styles.dayColumn}>{hours.slice(0, -1).map((hour) => { const time = `${String(hour).padStart(2, "0")}:00`; return <button type="button" className={styles.slotButton} key={time} style={{ top: `${(hour - 8) * 72}px` }} aria-label={`Создать запись на ${time}`} onClick={() => onNewAppointment({ date: selectedKey, time })}><span>＋ Запись на {time}</span></button>; })}{(filter === "ALL" || filter === "APPOINTMENT") && dayAppointments.map((item) => <CalendarEvent item={item} key={item.id}/>)}</div></div>{!dayAppointments.length && <p className={styles.empty}>Свободный день — выберите удобное время в сетке.</p>}</div></section><section className={styles.agenda}><header><div><AppIcon name="money"/><h2>Финансовые события дня</h2></div></header>{selectedFinancial.length ? <div className={styles.financialList}>{selectedFinancial.map((item) => <FinancialEvent item={item} key={item.id}/>)}</div> : <p className={styles.empty}>Финансовых событий нет.</p>}<button type="button" className={styles.dayAdd} onClick={() => setAddOpen(true)}>+ Добавить событие</button></section></>}

    {view === "week" && <section className={styles.timelineCard}><div className={styles.periodTitle}><h2>{dateFormatter.format(weekStart)} — {dateFormatter.format(weekDays[6])}</h2><p className={styles.tapHint}>Проведите влево и нажмите на свободный час</p></div><div className={styles.weekWrap}><div className={styles.weekHeader}>{weekDays.map((day) => <button type="button" key={dateKey(day)} onClick={() => { setSelectedDate(day); setView("day"); }} className={dateKey(day) === selectedKey ? styles.selectedDay : ""}><span>{weekdayFormatter.format(day)}</span><b>{day.getDate()}</b></button>)}</div><div className={styles.weekSchedule}>{hours.map((hour) => <span className={styles.weekHour} key={hour} style={{ top: `${(hour - 8) * 72}px` }}>{String(hour).padStart(2, "0")}:00</span>)}{weekDays.map((day) => { const key = dateKey(day); return <div className={styles.weekColumn} key={key}>{hours.slice(0, -1).map((hour) => { const time = `${String(hour).padStart(2, "0")}:00`; return <button type="button" className={styles.weekSlotButton} key={time} style={{ top: `${(hour - 8) * 72}px` }} aria-label={`Создать запись ${key} в ${time}`} onClick={() => onNewAppointment({ date: key, time })}/>; })}{datedAppointments.filter((item) => item.operationDate === key).map((item) => <CalendarEvent item={item} key={item.id}/>)}</div>; })}</div></div></section>}

    {view === "list" && <section className={styles.listCard}><div className={styles.listTabs}><button type="button" className={listStatus === "SCHEDULED" ? styles.active : ""} onClick={() => setListStatus("SCHEDULED")}>Ближайшие</button><button type="button" className={listStatus === "ARCHIVED" ? styles.active : ""} onClick={() => setListStatus("ARCHIVED")}>Архив</button></div><div className={styles.list}>{(filter === "ALL" || filter === "APPOINTMENT") && listAppointments.map((item) => <Link href={`/cosmetology/visits/${item.id}`} key={item.id} className={styles.listItem}><span><b>{dateFormatter.format(parseDate(item.operationDate))}</b><small>{appointmentLabel(item) || "Время не указано"}</small></span><span><b>{item.clientName}</b><small>{item.procedureName}</small></span><strong className={styles[`badge${item.status}`]}>{statusLabels[item.status]}</strong></Link>)}{(filter === "ALL" || filter === "INCOME" || filter === "EXPENSE") && financialEvents.filter((item) => filter === "ALL" || item.type === filter).map((item) => <FinancialEvent item={item} key={item.id}/>)}{!listAppointments.length && !financialEvents.length && <p className={styles.empty}>Событий в этом разделе пока нет.</p>}</div></section>}

    {addOpen && <div className={styles.addBackdrop} onMouseDown={() => setAddOpen(false)}><section className={styles.addMenu} role="dialog" aria-modal="true" aria-label="Что добавить" onMouseDown={(event) => event.stopPropagation()}><h2>Что добавить?</h2><button type="button" onClick={() => { setAddOpen(false); onNewAppointment({ date: selectedKey }); }}>Запись клиента</button><button type="button" onClick={() => onNewTransaction("INCOME", selectedKey)}>Доход</button><button type="button" onClick={() => onNewTransaction("EXPENSE", selectedKey)}>Расход</button></section></div>}

    {unscheduledAppointments.length > 0 && view !== "list" && <div className={styles.unscheduled}><b>Без времени</b>{unscheduledAppointments.map((item) => <Link href={`/cosmetology/visits/${item.id}`} key={item.id}>{item.clientName} · {item.procedureName}</Link>)}</div>}
  </section>;
}
