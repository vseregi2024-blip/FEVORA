import Link from "next/link";
import { FinanceModule, TransactionType } from "@prisma/client";

import { ImperiaAnalyticsDetails } from "@/components/imperia-analytics-details";
import { formatMoney, minorUnitsToMoney, moneyToMinorUnits } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth";
import { getCategories } from "@/server/finance";
import { getFamilyAccounts } from "@/server/family";

type Period = "TODAY" | "YESTERDAY" | "WEEK" | "MONTH" | "CUSTOM";
const modules: Array<[FinanceModule, string]> = [[FinanceModule.COSMETOLOGY, "Косметология"], [FinanceModule.POULTRY, "Птицеводство"], [FinanceModule.FAMILY, "Семья"], [FinanceModule.INFOBUSINESS, "Инфобизнес"], [FinanceModule.GOODS, "Товарка"]];
const value = (item: string | string[] | undefined) => typeof item === "string" ? item : undefined;
const inputDate = (date: Date) => date.toISOString().slice(0, 10);

function periodBounds(period: Period, from?: string, to?: string) {
  const now = new Date(); const start = new Date(now); start.setHours(0, 0, 0, 0);
  const end = new Date(now); end.setHours(23, 59, 59, 999);
  if (period === "YESTERDAY") { start.setDate(start.getDate() - 1); end.setDate(end.getDate() - 1); }
  if (period === "WEEK") start.setDate(start.getDate() - 6);
  if (period === "MONTH") start.setDate(1);
  if (period === "CUSTOM") return { from: from ? new Date(`${from}T00:00:00`) : undefined, to: to ? new Date(`${to}T23:59:59.999`) : undefined };
  return { from: start, to: end };
}

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser(); const params = await searchParams;
  const rawPeriod = value(params.period); const period: Period = rawPeriod === "YESTERDAY" || rawPeriod === "WEEK" || rawPeriod === "MONTH" || rawPeriod === "CUSTOM" ? rawPeriod : "TODAY";
  const typeParam = value(params.type); const type = typeParam === "INCOME" || typeParam === "EXPENSE" ? typeParam as TransactionType : undefined;
  const moduleParam = value(params.module); const module = modules.some(([code]) => code === moduleParam) ? moduleParam as FinanceModule : undefined;
  const categoryId = value(params.categoryId); const walletId = value(params.walletId); const { from, to } = periodBounds(period, value(params.from), value(params.to));
  const [categories, wallets, transactions] = await Promise.all([
    getCategories(user.id),
    getFamilyAccounts(user.id),
    prisma.transaction.findMany({ where: { userId: user.id, deletedAt: null, type: type ?? { in: [TransactionType.INCOME, TransactionType.EXPENSE] }, ...(module ? { module } : {}), ...(categoryId ? { categoryId } : {}), ...(walletId ? { familyAccountId: walletId } : {}), ...(from || to ? { operationDate: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}) }, include: { category: true, familyAccount: true, moneyAccount: true }, orderBy: [{ operationDate: "desc" }, { createdAt: "desc" }] }),
  ]);
  const income = transactions.filter((item) => item.type === TransactionType.INCOME).reduce((sum, item) => sum + moneyToMinorUnits(item.amount.toString()), 0n);
  const expense = transactions.filter((item) => item.type === TransactionType.EXPENSE).reduce((sum, item) => sum + moneyToMinorUnits(item.amount.toString()), 0n);
  const chart = new Map<string, { income: bigint; expense: bigint }>();
  for (const item of transactions) { const key = inputDate(item.operationDate); const bucket = chart.get(key) ?? { income: 0n, expense: 0n }; if (item.type === TransactionType.INCOME) bucket.income += moneyToMinorUnits(item.amount.toString()); else bucket.expense += moneyToMinorUnits(item.amount.toString()); chart.set(key, bucket); }
  const points = [...chart.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([date, item]) => ({ date, ...item }));
  const maximum = points.reduce((max, item) => item.income > max ? item.income : item.expense > max ? item.expense : max, 0n);
  const moduleLabels = new Map<FinanceModule, string>(modules);
  const dayGroups = new Map<string, Map<string, { type: "INCOME" | "EXPENSE"; category: string; currency: string; amount: bigint; count: number }>>();
  for (const item of transactions) {
    const date = inputDate(item.operationDate); const itemType = item.type as "INCOME" | "EXPENSE"; const category = item.category?.name ?? "Без категории"; const key = `${itemType}:${item.currency}:${category}`;
    const groups = dayGroups.get(date) ?? new Map(); const group = groups.get(key) ?? { type: itemType, category, currency: item.currency, amount: 0n, count: 0 };
    group.amount += moneyToMinorUnits(item.amount.toString()); group.count += 1; groups.set(key, group); dayGroups.set(date, groups);
  }
  const detailTransactions = transactions.map((item) => ({ id: item.id, date: inputDate(item.operationDate), type: item.type as "INCOME" | "EXPENSE", amount: formatMoney(item.amount.toString(), item.currency), category: item.category?.name ?? "Без категории", description: item.description, module: moduleLabels.get(item.module) ?? "Общее", wallet: item.moneyAccount?.name ?? item.familyAccount?.name ?? "Без кошелька" }));
  const detailPoints = points.map((point) => ({ date: point.date, income: formatMoney(minorUnitsToMoney(point.income)), expense: formatMoney(minorUnitsToMoney(point.expense)), incomeHeight: maximum ? Number(point.income * 100n / maximum) : 0, expenseHeight: maximum ? Number(point.expense * 100n / maximum) : 0, groups: [...(dayGroups.get(point.date)?.entries() ?? [])].map(([key, group]) => ({ key, type: group.type, category: group.category, amount: formatMoney(minorUnitsToMoney(group.amount), group.currency), count: group.count })) }));
  return <div className="imperia-analytics-page"><header className="page-header"><div><Link href="/safe" className="eyebrow">← Сейф</Link><h1>Аналитика</h1><p className="muted">Как деньги двигались, откуда пришли и куда ушли.</p></div></header>
    <form className="imperia-analytics-filters" action="/analytics"><label>Период<select name="period" defaultValue={period}><option value="TODAY">Сегодня</option><option value="YESTERDAY">Вчера</option><option value="WEEK">Неделя</option><option value="MONTH">Месяц</option><option value="CUSTOM">Произвольный</option></select></label><label>С<input name="from" type="date" defaultValue={value(params.from)}/></label><label>По<input name="to" type="date" defaultValue={value(params.to)}/></label><label>Направление<select name="module" defaultValue={module ?? ""}><option value="">Все</option>{modules.map(([code, label]) => <option value={code} key={code}>{label}</option>)}</select></label><label>Тип<select name="type" defaultValue={type ?? ""}><option value="">Все</option><option value="INCOME">Доход</option><option value="EXPENSE">Расход</option></select></label><label>Категория<select name="categoryId" defaultValue={categoryId ?? ""}><option value="">Все категории</option>{categories.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><label>Кошелёк<select name="walletId" defaultValue={walletId ?? ""}><option value="">Все кошельки</option>{wallets.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><button className="button primary">Показать</button></form>
    <ImperiaAnalyticsDetails income={formatMoney(minorUnitsToMoney(income))} expense={formatMoney(minorUnitsToMoney(expense))} result={formatMoney(minorUnitsToMoney(income - expense))} count={transactions.length} transactions={detailTransactions} points={detailPoints}/>
  </div>;
}
