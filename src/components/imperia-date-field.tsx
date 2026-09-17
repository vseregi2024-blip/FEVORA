"use client";

import { useMemo, useState } from "react";

const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const monthFormatter = new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" });
const valueFormatter = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" });

function toInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromInputValue(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function ImperiaDateField({ name, label, defaultValue, optional = false }: { name: string; label: string; defaultValue?: string; optional?: boolean }) {
  const initial = fromInputValue(defaultValue);
  const [selected, setSelected] = useState<Date | null>(initial);
  const [month, setMonth] = useState(() => initial ?? new Date());
  const [open, setOpen] = useState(false);
  const days = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7;
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return [...Array(offset).fill(null), ...Array.from({ length: count }, (_, index) => index + 1)];
  }, [month]);

  const choose = (day: number) => {
    setSelected(new Date(month.getFullYear(), month.getMonth(), day));
    setOpen(false);
  };

  return <div className="imperia-date-field">
    <span className="imperia-field-label">{label} {optional && <small>необязательно</small>}</span>
    <input type="hidden" name={name} value={selected ? toInputValue(selected) : ""}/>
    <button type="button" className={`imperia-date-trigger${selected ? " has-value" : ""}`} onClick={() => setOpen((value) => !value)} aria-expanded={open}>
      <span>{selected ? valueFormatter.format(selected) : "Выберите дату"}</span><i aria-hidden="true">▦</i>
    </button>
    {open && <div className="imperia-calendar" role="dialog" aria-label={`Календарь: ${label}`}>
      <header><button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Предыдущий месяц">‹</button><strong>{monthFormatter.format(month)}</strong><button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="Следующий месяц">›</button></header>
      <div className="imperia-calendar-grid">{weekDays.map((day) => <b key={day}>{day}</b>)}{days.map((day, index) => day === null ? <i key={`blank-${index}`}/> : <button type="button" key={day} className={selected?.getFullYear() === month.getFullYear() && selected?.getMonth() === month.getMonth() && selected?.getDate() === day ? "selected" : ""} onClick={() => choose(day)}>{day}</button>)}</div>
      <footer>{optional && <button type="button" onClick={() => { setSelected(null); setOpen(false); }}>Очистить</button>}<button type="button" onClick={() => { const today = new Date(); setMonth(today); setSelected(today); setOpen(false); }}>Сегодня</button></footer>
    </div>}
  </div>;
}
