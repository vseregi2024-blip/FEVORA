import Link from "next/link";

import { FinanceModule, TransactionType } from "@prisma/client";

import { formatMoney } from "@/lib/money";
import { requireUser } from "@/server/auth";
import { getCategories, getTransactions } from "@/server/finance";

const typeLabels: Record<TransactionType, string> = { INCOME: "Дохід", EXPENSE: "Витрата", SAVING_IN: "В накопичення", SAVING_OUT: "З накопичень", ADJUSTMENT: "Коригування" };
const moduleLabels: Record<FinanceModule, string> = { GENERAL: "Загальне", FAMILY: "Сімʼя", POULTRY: "Птахівництво" };
const getValue = (value: string | string[] | undefined) => typeof value === "string" ? value : undefined;

export default async function FinancePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const params = await searchParams;
  const type = getValue(params.type);
  const moduleParam = getValue(params.module);
  const filters = { from: getValue(params.from), to: getValue(params.to), type: Object.values(TransactionType).includes(type as TransactionType) ? type as TransactionType : undefined, module: Object.values(FinanceModule).includes(moduleParam as FinanceModule) ? moduleParam as FinanceModule : undefined, categoryId: getValue(params.categoryId), query: getValue(params.query) };
  const [categories, transactions] = await Promise.all([getCategories(user.id), getTransactions(user.id, filters)]);
  const notice = params.created ? "Операцію додано." : params.updated ? "Операцію оновлено." : params.deleted ? "Операцію видалено з розрахунків." : null;
  return <><header className="page-header"><div><p className="eyebrow">Фінанси</p><h1>Журнал операцій</h1></div><Link className="button primary" href="/finance/new">+ Додати</Link></header>{notice && <p className="notice" role="status">{notice}</p>}<form className="filters" action="/finance"><input name="query" type="search" placeholder="Пошук у коментарях" defaultValue={filters.query} /><input name="from" type="date" defaultValue={filters.from} /><input name="to" type="date" defaultValue={filters.to} /><select name="type" defaultValue={filters.type ?? ""}><option value="">Усі типи</option>{Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><select name="module" defaultValue={filters.module ?? ""}><option value="">Усі напрями</option>{Object.entries(moduleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><select name="categoryId" defaultValue={filters.categoryId ?? ""}><option value="">Усі категорії</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select><button className="button secondary">Фільтрувати</button></form><div className="transaction-list">{transactions.map((transaction) => <Link href={`/finance/${transaction.id}`} className="transaction-row" key={transaction.id}><span><b>{transaction.category?.name ?? "Без категорії"}</b><small>{transaction.operationDate.toLocaleDateString("uk-UA")} · {moduleLabels[transaction.module]} · {typeLabels[transaction.type]}</small>{transaction.description && <small>{transaction.description}</small>}</span><strong className={transaction.type === "EXPENSE" || transaction.type === "SAVING_IN" ? "expense" : "income"}>{transaction.type === "EXPENSE" || transaction.type === "SAVING_IN" ? "−" : ""}{formatMoney(transaction.amount.toString(), transaction.currency)}</strong></Link>)}{transactions.length === 0 && <p className="empty">За цими фільтрами операцій немає.</p>}</div></>;
}
