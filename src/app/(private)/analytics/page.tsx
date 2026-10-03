import Link from "next/link";
import { FinanceModule, TransactionType } from "@prisma/client";

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
    prisma.transaction.findMany({ where: { userId: user.id, deletedAt: null, type: type ?? { in: [TransactionType.INCOME, TransactionType.EXPENSE] }, ...(module ? { module } : {}), ...(categoryId ? { categoryId } : {}), ...(walletId ? { familyAccountId: walletId } : {}), ...(from || to ? { operationDate: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}) }, include: { category: true, familyAccount: true }, orderBy: [{ operationDate: "desc" }, { createdAt: "desc" }] }),
  ]);
  const income = transactions.filter((item) => item.type === TransactionType.INCOME).reduce((sum, item) => sum + moneyToMinorUnits(item.amount.toString()), 0n);
  const expense = transactions.filter((item) => item.type === TransactionType.EXPENSE).reduce((sum, item) => sum + moneyToMinorUnits(item.amount.toString()), 0n);
  const chart = new Map<string, { income: bigint; expense: bigint }>();
  for (const item of transactions) { const key = inputDate(item.operationDate); const bucket = chart.get(key) ?? { income: 0n, expense: 0n }; if (item.type === TransactionType.INCOME) bucket.income += moneyToMinorUnits(item.amount.toString()); else bucket.expense += moneyToMinorUnits(item.amount.toString()); chart.set(key, bucket); }
  const points = [...chart.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([date, item]) => ({ date, ...item }));
  const maximum = points.reduce((max, item) => item.income > max ? item.income : item.expense > max ? item.expense : max, 0n);
  return <div className="imperia-analytics-page"><header className="page-header"><div><Link href="/safe" className="eyebrow">← Сейф</Link><h1>Аналитика</h1><p className="muted">Как деньги двигались, откуда пришли и куда ушли.</p></div></header>
    <form className="imperia-analytics-filters" action="/analytics"><label>Период<select name="period" defaultValue={period}><option value="TODAY">Сегодня</option><option value="YESTERDAY">Вчера</option><option value="WEEK">Неделя</option><option value="MONTH">Месяц</option><option value="CUSTOM">Произвольный</option></select></label><label>С<input name="from" type="date" defaultValue={value(params.from)}/></label><label>По<input name="to" type="date" defaultValue={value(params.to)}/></label><label>Направление<select name="module" defaultValue={module ?? ""}><option value="">Все</option>{modules.map(([code, label]) => <option value={code} key={code}>{label}</option>)}</select></label><label>Тип<select name="type" defaultValue={type ?? ""}><option value="">Все</option><option value="INCOME">Доход</option><option value="EXPENSE">Расход</option></select></label><label>Категория<select name="categoryId" defaultValue={categoryId ?? ""}><option value="">Все категории</option>{categories.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><label>Кошелёк<select name="walletId" defaultValue={walletId ?? ""}><option value="">Все кошельки</option>{wallets.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><button className="button primary">Показать</button></form>
    <section className="imperia-analytics-summary"><article><small>Поступления</small><b className="income">{formatMoney(minorUnitsToMoney(income))}</b></article><article><small>Расходы</small><b className="expense">{formatMoney(minorUnitsToMoney(expense))}</b></article><article><small>Итог</small><b className={income - expense < 0n ? "expense" : "income"}>{formatMoney(minorUnitsToMoney(income - expense))}</b></article><article><small>Количество операций</small><b>{transactions.length}</b></article></section>
    <section className="imperia-analytics-chart"><header><h2>Движение денег</h2><small>Поступления и расходы по дням</small></header>{points.length ? <div className="imperia-analytics-bars">{points.map((point) => <article key={point.date}><div><i className="income" style={{ height: `${maximum ? Number(point.income * 100n / maximum) : 0}%` }} title={`Поступления: ${formatMoney(minorUnitsToMoney(point.income))}`}/><i className="expense" style={{ height: `${maximum ? Number(point.expense * 100n / maximum) : 0}%` }} title={`Расходы: ${formatMoney(minorUnitsToMoney(point.expense))}`}/></div><small>{new Date(`${point.date}T00:00:00`).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })}</small></article>)}</div> : <p className="empty">За выбранный период операций нет.</p>}</section>
  </div>;
}
