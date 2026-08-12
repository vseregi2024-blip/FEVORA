"use client";

import { useState } from "react";

type Category = { id: string; name: string; kind: "INCOME" | "EXPENSE" | "BOTH" };
type Value = { id?: string; type: "INCOME" | "EXPENSE"; amount: string; operationDate: string; categoryId: string; description: string };

export function FamilyOperationForm({ categories, value, action, submitLabel }: { categories: Category[]; value: Value; action: (formData: FormData) => void | Promise<void>; submitLabel: string }) {
  const [type, setType] = useState(value.type);
  const selectableCategories = categories.filter((category) => category.kind === type || category.kind === "BOTH");
  return <form className="transaction-form" action={action}>{value.id && <input type="hidden" name="id" value={value.id} />}<label>Сума<input name="amount" inputMode="decimal" autoFocus required defaultValue={value.amount} placeholder="0,00" /></label><div className="form-grid"><label>Тип<select name="type" value={type} onChange={(event) => setType(event.target.value as "INCOME" | "EXPENSE")}><option value="EXPENSE">Витрата</option><option value="INCOME">Дохід</option></select></label><label>Дата<input name="operationDate" type="date" required defaultValue={value.operationDate} /></label></div><label>Категорія<select name="categoryId" required defaultValue={value.categoryId} key={type}><option value="" disabled>Оберіть категорію</option>{selectableCategories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select><small>Категорію потрібно обрати — FEVORA не вгадує її автоматично.</small></label><label>Опис<input name="description" required maxLength={500} defaultValue={value.description} placeholder="Наприклад: АТБ" /></label><button className="button primary">{submitLabel}</button></form>;
}
