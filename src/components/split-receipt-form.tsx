"use client";

import type { ComponentProps } from "react";
import { useMemo, useState } from "react";

import { minorUnitsToMoney, moneyToMinorUnits } from "@/lib/money";

type Category = { id: string; name: string };
type Account = { id: string; name: string };
type Row = { key: number; id?: string; categoryId: string; amount: string; description: string };
type Value = { id?: string; date: string; description: string; totalAmount: string; accountId: string; items?: Array<{ id?: string; categoryId: string; amount: string; description: string }> };

const cents = (value: string) => { try { return /^\d+(?:[.,]\d{0,2})?$/.test(value.trim()) ? moneyToMinorUnits(value || "0") : 0n; } catch { return 0n; } };

export function SplitReceiptForm({ categories, accounts, action, value }: { categories: Category[]; accounts: Account[]; action: ComponentProps<"form">["action"]; value: Value }) {
  const initialRows = value.items?.length ? value.items.map((item, key) => ({ ...item, key })) : [{ key: 0, categoryId: "", amount: "", description: "" }, { key: 1, categoryId: "", amount: "", description: "" }];
  const [rows, setRows] = useState<Row[]>(initialRows);
  const [total, setTotal] = useState(value.totalAmount);
  const [nextKey, setNextKey] = useState(initialRows.length);
  const distributed = useMemo(() => rows.reduce((sum, row) => sum + cents(row.amount), 0n), [rows]);
  const declared = cents(total);
  const remaining = declared - distributed;
  const valid = declared > 0n && remaining === 0n && rows.length >= 2 && rows.every((row) => row.categoryId && cents(row.amount) > 0n);
  const change = (key: number, field: keyof Row, fieldValue: string) => setRows((items) => items.map((row) => row.key === key ? { ...row, [field]: fieldValue } : row));
  const addPart = () => {
    setRows((items) => [...items, { key: nextKey, categoryId: "", amount: "", description: "" }]);
    setNextKey((key) => key + 1);
  };

  return <form action={action} className="transaction-form split-receipt-form">
    {value.id ? (
      <input type="hidden" name="id" value={value.id}/>
    ) : null}
    <section className="split-receipt-basics">
      <label className="amount-field"><span>Сумма чека</span><span className="money-input"><input name="totalAmount" inputMode="decimal" required autoFocus placeholder="0,00" value={total} onChange={(event) => setTotal(event.target.value)}/><b>₴</b></span></label>
      <label><span>Кошелёк оплаты</span><select name="accountId" required defaultValue={value.accountId}><option value="" disabled>Выберите кошелёк</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label>
      <div className="split-receipt-meta"><label>Дата<input name="operationDate" type="date" defaultValue={value.date} required/></label><label>Комментарий<input name="description" defaultValue={value.description} maxLength={500} placeholder="Необязательно"/></label></div>
    </section>
    <div className="split-summary" aria-live="polite"><span>Сумма чека <b>{minorUnitsToMoney(declared)}</b></span><span>Распределено <b>{minorUnitsToMoney(distributed)}</b></span><span className={remaining === 0n ? "income" : "expense"}>Осталось <b>{minorUnitsToMoney(remaining)}</b></span></div>
    <div className="split-list">{rows.map((row, index) => <section className="split-row" key={row.key}>
      <input type="hidden" name={`id-${row.key}`} value={row.id ?? ""}/>
      <div className="split-row-heading"><span>Часть {index + 1}</span>{rows.length > 2 && <button className="text-button expense" type="button" onClick={() => setRows((items) => items.filter((item) => item.key !== row.key))}>Удалить</button>}</div>
      <label>Категория<select name={`categoryId-${row.key}`} required value={row.categoryId} onChange={(event) => change(row.key, "categoryId", event.target.value)}><option value="" disabled>Выберите категорию</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
      <label>Сумма<input name={`amount-${row.key}`} required inputMode="decimal" placeholder="0,00" value={row.amount} onChange={(event) => change(row.key, "amount", event.target.value)}/></label>
      <label className="split-row-comment">Комментарий<input name={`description-${row.key}`} maxLength={500} placeholder="Необязательно" value={row.description} onChange={(event) => change(row.key, "description", event.target.value)}/></label>
    </section>)}</div>
    <div className="page-actions split-actions">{rows.length < 12 && <button type="button" className="button secondary split-add-part" onClick={addPart}>+ Добавить часть</button>}<button className="button primary" disabled={!valid}>Сохранить чек</button></div>
    {!valid && <small className="split-hint">Укажите категории и суммы: итог частей должен совпасть с суммой чека.</small>}
  </form>;
}
