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
  groupKey: string;
};

type DayPoint = {
  date: string;
  income: string;
  expense: string;
  result: string;
  count: number;
};

type CategoryGroup = {
  key: string;
  type: "INCOME" | "EXPENSE";
  category: string;
  amount: string;
  count: number;
};

const dateLabel = (date: string, options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" }) => new Date(`${date}T12:00:00`).toLocaleDateString("ru-RU", options);

const operationsLabel = (count: number) => {
  const lastTwoDigits = count % 100;
  const lastDigit = count % 10;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return `${count} операций`;
  if (lastDigit === 1) return `${count} операция`;
  if (lastDigit >= 2 && lastDigit <= 4) return `${count} операции`;
  return `${count} операций`;
};

function OperationRow({ item, showDate = false }: { item: AnalyticsTransaction; showDate?: boolean }) {
  return <article className="imperia-ledger-operation">
    <i className={item.type === "INCOME" ? "income" : "expense"}/>
    <span>
      <b>{item.category}</b>
      {item.description && item.description !== item.category && <small>{item.description}</small>}
      <em>{showDate ? `${dateLabel(item.date)} · ` : ""}{item.module} · {item.wallet}</em>
    </span>
    <strong className={item.type === "INCOME" ? "income" : "expense"}>{item.type === "INCOME" ? "+" : "−"}{item.amount}</strong>
  </article>;
}

export function ImperiaAnalyticsDetails({ income, expense, result, count, transactions, points, categories }: { income: string; expense: string; result: string; count: number; transactions: AnalyticsTransaction[]; points: DayPoint[]; categories: CategoryGroup[] }) {
  const [view, setView] = useState<"DAYS" | "CATEGORIES">("DAYS");

  return <>
    <section className="imperia-analytics-summary">
      <article><small>Поступления</small><b className="income">{income}</b></article>
      <article><small>Расходы</small><b className="expense">{expense}</b></article>
      <article><small>Разница</small><b className={result.startsWith("-") ? "expense" : "income"}>{result}</b></article>
      <article><small>Внесено</small><b>{operationsLabel(count)}</b></article>
    </section>

    <section className="imperia-ledger">
      <header>
        <div><small>Сверка операций</small><h2>Все ли доходы и расходы внесены?</h2></div>
        <nav aria-label="Вид аналитики">
          <button type="button" className={view === "DAYS" ? "active" : ""} onClick={() => setView("DAYS")}>По дням</button>
          <button type="button" className={view === "CATEGORIES" ? "active" : ""} onClick={() => setView("CATEGORIES")}>По категориям</button>
        </nav>
      </header>

      {view === "DAYS" && <div className="imperia-ledger-days">
        {points.map((point) => {
          const dayTransactions = transactions.filter((item) => item.date === point.date);
          const expenseCount = dayTransactions.filter((item) => item.type === "EXPENSE").length;
          return <details key={point.date} open>
            <summary>
              <span><b>{dateLabel(point.date, { day: "numeric", month: "long", weekday: "short" })}</b><small>{operationsLabel(point.count)} · расходов: {expenseCount}</small></span>
              <span className="imperia-ledger-day-totals"><em className="income">+{point.income}</em><em className="expense">−{point.expense}</em><strong className={point.result.startsWith("-") ? "expense" : "income"}>{point.result}</strong></span>
            </summary>
            <div>{dayTransactions.map((item) => <OperationRow key={item.id} item={item}/>)}</div>
          </details>;
        })}
        {!points.length && <p className="empty">За выбранный период операций нет.</p>}
      </div>}

      {view === "CATEGORIES" && <div className="imperia-ledger-categories">
        {categories.map((group) => <details key={group.key}>
          <summary>
            <i className={group.type === "INCOME" ? "income" : "expense"}>{group.type === "INCOME" ? "+" : "−"}</i>
            <span><b>{group.category}</b><small>{operationsLabel(group.count)}</small></span>
            <strong className={group.type === "INCOME" ? "income" : "expense"}>{group.type === "INCOME" ? "+" : "−"}{group.amount}</strong>
          </summary>
          <div>{transactions.filter((item) => item.groupKey === group.key).map((item) => <OperationRow key={item.id} item={item} showDate/>)}</div>
        </details>)}
        {!categories.length && <p className="empty">За выбранный период операций нет.</p>}
      </div>}
    </section>
  </>;
}
