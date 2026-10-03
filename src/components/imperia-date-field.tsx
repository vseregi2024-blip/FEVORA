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

function toManualValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${day}.${month}.${year}`;
}

function fromInputValue(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function fromManualValue(value: string) {
  const matched = value.trim().match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!matched) return null;
  const [, dayText, monthText, yearText] = matched;
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);
  const date = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (year < 1900 || date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day || date > today) return null;
  return date;
}

type ImperiaDateFieldProps = {
  name: string;
  label: string;
  defaultValue?: string;
  optional?: boolean;
  mode?: "calendar" | "birthDate";
};

export function ImperiaDateField({ name, label, defaultValue, optional = false, mode = "calendar" }: ImperiaDateFieldProps) {
  const initial = fromInputValue(defaultValue);
  const [selected, setSelected] = useState<Date | null>(initial);
  const [month, setMonth] = useState(() => initial ?? new Date());
  const [open, setOpen] = useState(false);
  const [manualValue, setManualValue] = useState(() => initial ? toManualValue(initial) : "");
  const days = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7;
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return [...Array(offset).fill(null), ...Array.from({ length: count }, (_, index) => index + 1)];
  }, [month]);

  const choose = (day: number) => {
    const chosen = new Date(month.getFullYear(), month.getMonth(), day);
    setSelected(chosen);
    setManualValue(toManualValue(chosen));
    setOpen(false);
  };

  const changeManualValue = (value: string) => {
    const cleaned = value.replace(/[^\d.]/g, "").slice(0, 10);
    setManualValue(cleaned);
    const parsed = fromManualValue(cleaned);
    setSelected(parsed);
    if (parsed) setMonth(parsed);
  };

  const clear = () => {
    setSelected(null);
    setManualValue("");
    setOpen(false);
  };

  const chooseToday = () => {
    const today = new Date();
    setMonth(today);
    setSelected(today);
    setManualValue(toManualValue(today));
    setOpen(false);
  };

  const hasCompleteInvalidManualValue = mode === "birthDate" && manualValue.trim().length >= 10 && !selected;

  return <div className={`imperia-date-field${mode === "birthDate" ? " imperia-date-field-manual" : ""}`}>
    <span className="imperia-field-label">{label} {optional && <small>необязательно</small>}</span>
    <input type="hidden" name={name} value={selected ? toInputValue(selected) : ""}/>
    {mode === "birthDate" ? <>
      <input className="imperia-date-manual-input" type="text" inputMode="numeric" autoComplete="bday" placeholder="дд.мм.гггг" value={manualValue} onChange={(event) => changeManualValue(event.target.value)} aria-label={`${label}, формат день.месяц.год`} aria-invalid={hasCompleteInvalidManualValue}/>
      <span className="imperia-date-help">Введите дату вручную — календарь можно открыть при необходимости.</span>
      {hasCompleteInvalidManualValue && <span className="imperia-date-error" role="alert">Проверьте дату: используйте формат дд.мм.гггг.</span>}
      <button type="button" className="imperia-date-calendar-button" onClick={() => setOpen((value) => !value)} aria-expanded={open}>{open ? "Закрыть календарь" : "Выбрать в календаре"}<i aria-hidden="true">▦</i></button>
    </> : <button type="button" className={`imperia-date-trigger${selected ? " has-value" : ""}`} onClick={() => setOpen((value) => !value)} aria-expanded={open}>
      <span>{selected ? valueFormatter.format(selected) : "Выберите дату"}</span><i aria-hidden="true">▦</i>
    </button>}
    {open && <div className="imperia-calendar" role="dialog" aria-label={`Календарь: ${label}`}>
      <header><button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Предыдущий месяц">‹</button><strong>{monthFormatter.format(month)}</strong><button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="Следующий месяц">›</button></header>
      <div className="imperia-calendar-grid">{weekDays.map((day) => <b key={day}>{day}</b>)}{days.map((day, index) => day === null ? <i key={`blank-${index}`}/> : <button type="button" key={day} className={selected?.getFullYear() === month.getFullYear() && selected?.getMonth() === month.getMonth() && selected?.getDate() === day ? "selected" : ""} onClick={() => choose(day)}>{day}</button>)}</div>
      <footer>{optional && <button type="button" onClick={clear}>Очистить</button>}<button type="button" onClick={chooseToday}>Сегодня</button></footer>
    </div>}
  </div>;
}
