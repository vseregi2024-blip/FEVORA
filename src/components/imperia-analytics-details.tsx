"use client";

import { useState } from "react";

type AnalyticsTransaction = {
  id: string;
  date: string;
  type: "INCOME" | "EXPENSE";
  amount: string;
  category: string;
  description: string | null;
  module: string;
  wallet: string;
};

type DayPoint = {
  date: string;
  income: string;
  expense: string;
  incomeHeight: number;
  expenseHeight: number;
  groups: Array<{ key: string; type: "INCOME" | "EXPENSE"; category: string; amount: string; count: number }>;
};

type DialogState = { kind: "type"; type: "INCOME" | "EXPENSE" } | { kind: "day"; date: string } | null;

const dateLabel = (date: string, options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "2-digit" }) => new Date(`${date}T12:00:00`).toLocaleDateString("ru-RU", options);

const operationsLabel = (count: number) => {
  const lastTwoDigits = count % 100;
  const lastDigit = count % 10;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return `${count} операций`;
  if (lastDigit === 1) return `${count} операция`;
  if (lastDigit >= 2 && lastDigit <= 4) return `${count} операции`;
  return `${count} операций`;
};

export function ImperiaAnalyticsDetails({ income, expense, result, count, transactions, points }: { income: string; expense: string; result: string; count: number; transactions: AnalyticsTransaction[]; points: DayPoint[] }) {
  const [dialog, setDialog] = useState<DialogState>(null);
  const typedTransactions = dialog?.kind === "type" ? transactions.filter((item) => item.type === dialog.type) : [];
  const selectedDay = dialog?.kind === "day" ? points.find((point) => point.date === dialog.date) : undefined;

  return <>
    <section className="imperia-analytics-summary">
      <button type="button" onClick={() => setDialog({ kind: "type", type: "INCOME" })} aria-label="Показать все поступления за выбранный период"><small>Поступления</small><b className="income">{income}</b><span>Посмотреть операции</span></button>
      <button type="button" onClick={() => setDialog({ kind: "type", type: "EXPENSE" })} aria-label="Показать все расходы за выбранный период"><small>Расходы</small><b className="expense">{expense}</b><span>Посмотреть операции</span></button>
      <article><small>Итог</small><b className={result.startsWith("-") ? "expense" : "income"}>{result}</b></article>
      <article><small>Количество операций</small><b>{count}</b></article>
    </section>

    <section className="imperia-analytics-chart"><header><h2>Движение денег</h2><small>Нажмите на день для расшифровки</small></header>{points.length ? <div className="imperia-analytics-bars">{points.map((point) => <button type="button" key={point.date} onClick={() => setDialog({ kind: "day", date: point.date })} aria-label={`Открыть операции за ${dateLabel(point.date)}`}><div><i className="income" style={{ height: `${point.incomeHeight}%` }} title={`Поступления: ${point.income}`}/><i className="expense" style={{ height: `${point.expenseHeight}%` }} title={`Расходы: ${point.expense}`}/></div><small>{dateLabel(point.date)}</small></button>)}</div> : <p className="empty">За выбранный период операций нет.</p>}</section>

    {dialog && <div className="imperia-analytics-detail-backdrop" role="presentation" onMouseDown={() => setDialog(null)}><section className="imperia-analytics-detail" role="dialog" aria-modal="true" aria-labelledby="analytics-detail-title" onMouseDown={(event) => event.stopPropagation()}>
      <header><div><small>Расшифровка</small><h2 id="analytics-detail-title">{dialog.kind === "type" ? (dialog.type === "INCOME" ? "Поступления за период" : "Расходы за период") : dateLabel(dialog.date, { day: "numeric", month: "long", year: "numeric" })}</h2></div><button type="button" onClick={() => setDialog(null)} aria-label="Закрыть">×</button></header>

      {dialog.kind === "type" && <><div className="imperia-analytics-detail-total"><span>{dialog.type === "INCOME" ? "Всего поступило" : "Всего потрачено"}</span><strong className={dialog.type === "INCOME" ? "income" : "expense"}>{dialog.type === "INCOME" ? income : expense}</strong><small>{operationsLabel(typedTransactions.length)}</small></div><div className="imperia-analytics-operation-list">{typedTransactions.map((item) => <article key={item.id}><time>{dateLabel(item.date, { day: "numeric", month: "short" })}</time><span><b>{item.category}</b>{item.description && item.description !== item.category && <small>{item.description}</small>}<small>{item.module} · {item.wallet}</small></span><strong className={item.type === "INCOME" ? "income" : "expense"}>{item.type === "INCOME" ? "+" : "−"}{item.amount}</strong></article>)}{!typedTransactions.length && <p className="empty">Операций этого типа нет.</p>}</div></>}

      {dialog.kind === "day" && selectedDay && <><div className="imperia-analytics-day-totals"><article><small>Поступления</small><b className="income">{selectedDay.income}</b></article><article><small>Расходы</small><b className="expense">{selectedDay.expense}</b></article></div><div className="imperia-analytics-category-list">{selectedDay.groups.map((group) => <article key={group.key}><i className={group.type === "INCOME" ? "income" : "expense"}>{group.type === "INCOME" ? "Приход" : "Расход"}</i><span><b>{group.category}</b><small>{operationsLabel(group.count)}</small></span><strong className={group.type === "INCOME" ? "income" : "expense"}>{group.type === "INCOME" ? "+" : "−"}{group.amount}</strong></article>)}</div></>}
    </section></div>}
  </>;
}
