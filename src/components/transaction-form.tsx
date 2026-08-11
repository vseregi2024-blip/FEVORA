"use client";

import { FinanceModule, TransactionType } from "@prisma/client";
import { useState } from "react";

type Category = { id: string; name: string; module: FinanceModule };
type InitialValues = { id?: string; type: TransactionType; amount: string; operationDate: string; module: FinanceModule; categoryId: string | null; description: string | null };

const typeLabels: Record<TransactionType, string> = { INCOME: "Дохід", EXPENSE: "Витрата", SAVING_IN: "В накопичення", SAVING_OUT: "З накопичень", ADJUSTMENT: "Коригування" };
const moduleLabels: Record<FinanceModule, string> = { GENERAL: "Загальне", FAMILY: "Сімʼя", POULTRY: "Птахівництво" };

export function TransactionForm({ categories, initialValues, action, submitLabel }: { categories: Category[]; initialValues: InitialValues; action: (formData: FormData) => void | Promise<void>; submitLabel: string }) {
  const [module, setModule] = useState(initialValues.module);
  const [type, setType] = useState(initialValues.type);
  const availableCategories = categories.filter((category) => category.module === module);
  return <form action={action} className="transaction-form">
    {initialValues.id && <input type="hidden" name="id" value={initialValues.id} />}
    <label>Сума<input name="amount" type="text" inputMode="decimal" required autoFocus defaultValue={initialValues.amount} placeholder="0,00" /><small>{type === "ADJUSTMENT" ? "Для зменшення використайте знак мінус." : "До двох знаків після коми."}</small></label>
    <div className="form-grid"><label>Тип<select name="type" value={type} onChange={(event) => setType(event.target.value as TransactionType)}>{Object.entries(typeLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label>Дата<input name="operationDate" type="date" required defaultValue={initialValues.operationDate} /></label></div>
    <div className="form-grid"><label>Напрям<select name="module" value={module} onChange={(event) => setModule(event.target.value as FinanceModule)}>{Object.entries(moduleLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label>Категорія<select name="categoryId" defaultValue={initialValues.categoryId ?? ""} key={module}><option value="">Без категорії</option>{availableCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label></div>
    <label>Коментар<textarea name="description" rows={3} maxLength={500} defaultValue={initialValues.description ?? ""} placeholder="Необовʼязково" /></label>
    <button className="button primary" type="submit">{submitLabel}</button>
  </form>;
}
