import { FinanceModule, MoneyAccountKind } from "@prisma/client";
import Link from "next/link";

import { requireUser } from "@/server/auth";
import { getCategories } from "@/server/finance";
import { getMoneyOverview } from "@/server/money";

import { createSafeTransactionAction } from "../actions";

const directions = [{ value: FinanceModule.FAMILY, label: "Семья" }, { value: FinanceModule.COSMETOLOGY, label: "Косметология" }, { value: FinanceModule.POULTRY, label: "Птицеводство" }, { value: FinanceModule.GOODS, label: "Товарка" }, { value: FinanceModule.INFOBUSINESS, label: "Инфобизнес" }];

export default async function SafeNewTransactionPage({ searchParams }: { searchParams: Promise<{ type?: string; date?: string; module?: string; returnTo?: string }> }) {
  const user = await requireUser(); const query = await searchParams; const type = query.type === "EXPENSE" ? "EXPENSE" : "INCOME"; const [overview, categories] = await Promise.all([getMoneyOverview(user.id), getCategories(user.id)]);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(query.date ?? "") ? query.date! : new Date().toISOString().slice(0, 10);
  const selectedModule = directions.some((item) => item.value === query.module) ? query.module! : FinanceModule.FAMILY;
  return <main className="money-entry-page"><header className={`money-entry-header ${type === "EXPENSE" ? "expense" : "income"}`}><Link href={query.returnTo?.startsWith("/cosmetology/visits") ? query.returnTo : "/safe"}>Отменить</Link><h1>{type === "EXPENSE" ? "Новый расход" : "Новый доход"}</h1><span/></header><form action={createSafeTransactionAction} className="transaction-form"><input type="hidden" name="type" value={type}/><input type="hidden" name="returnTo" value={query.returnTo ?? ""}/><label>Сумма<input name="amount" required inputMode="decimal" placeholder="0,00"/></label><div className="form-grid"><label>Направление<select name="module" defaultValue={selectedModule}>{directions.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label><label>Кошелёк<select name="moneyAccountId" required defaultValue=""><option value="" disabled>Выберите кошелёк</option>{overview.accounts.filter((item) => item.isActive && item.kind === MoneyAccountKind.WALLET).map((item) => <option value={item.id} key={item.id}>{item.name} · {item.currency}</option>)}</select></label></div><label>Категория<select name="categoryId" defaultValue=""><option value="">Без категории</option>{categories.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><label>Дата<input type="date" name="operationDate" required defaultValue={date}/></label><label>Комментарий<input name="description" placeholder="Необязательно"/></label><button className="button primary wide">Сохранить</button></form></main>;
}
