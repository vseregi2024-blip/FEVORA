"use client";

import { useState } from "react";
import Link from "next/link";

type Category = { id: string; name: string };
type Account = { id: string; name: string };
type Filters = { from?: string; to?: string; categoryId?: string; accountId?: string; type?: "INCOME" | "EXPENSE" };

export function FamilyOperationFilters({ categories, accounts, filters }: { categories: Category[]; accounts: Account[]; filters: Filters }) {
  const [open, setOpen] = useState(false); const activeCount = [filters.from || filters.to, filters.categoryId, filters.accountId, filters.type].filter(Boolean).length;
  return <><div className="operations-chips"><button type="button" onClick={() => setOpen(true)}>Период{filters.from || filters.to ? " · выбран" : ""}</button><Link href="/family/operations" className={!activeCount ? "active" : ""}>Все</Link><button type="button" onClick={() => setOpen(true)} className={activeCount ? "active" : ""}>Фильтр{activeCount ? ` · ${activeCount}` : ""}</button></div>{open && <div className="family-sheet-backdrop" onMouseDown={() => setOpen(false)}><section className="family-action-sheet filter-sheet" role="dialog" aria-modal="true" aria-label="Фильтры операций" onMouseDown={(event) => event.stopPropagation()}><div className="sheet-handle"/><div className="sheet-heading"><div><p className="eyebrow">Операции</p><h2>Фильтр</h2></div><button type="button" className="sheet-close" onClick={() => setOpen(false)} aria-label="Закрыть">×</button></div><form className="compact-form" action="/family/operations"><div className="form-grid"><label>С<input name="from" type="date" defaultValue={filters.from}/></label><label>По<input name="to" type="date" defaultValue={filters.to}/></label></div><label>Тип<select name="type" defaultValue={filters.type ?? ""}><option value="">Все операции</option><option value="EXPENSE">Расходы</option><option value="INCOME">Доходы</option></select></label><label>Категория<select name="categoryId" defaultValue={filters.categoryId ?? ""}><option value="">Все категории</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label>Счёт<select name="accountId" defaultValue={filters.accountId ?? ""}><option value="">Все счета</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label><div className="page-actions"><Link href="/family/operations" className="button secondary">Сбросить фильтры</Link><button className="button primary">Показать</button></div></form></section></div>}</>;
}
