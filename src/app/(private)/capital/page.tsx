import Link from "next/link";
import { FinanceModule, MoneyAccountKind, TransactionType } from "@prisma/client";

import { AppIcon } from "@/components/ui/icons";
import { formatMoney, minorUnitsToMoney, moneyToMinorUnits } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth";
import { getMoneyOverview } from "@/server/money";

type Period = "TODAY" | "WEEK" | "MONTH" | "CUSTOM";

const directions: Array<[FinanceModule, string]> = [
  [FinanceModule.COSMETOLOGY, "Косметология"],
  [FinanceModule.POULTRY, "Птицеводство"],
  [FinanceModule.FAMILY, "Семья"],
  [FinanceModule.INFOBUSINESS, "Инфобизнес"],
  [FinanceModule.GOODS, "Товарка"],
];

const value = (item: string | string[] | undefined) => typeof item === "string" ? item : undefined;
const dateValue = (date: Date) => date.toISOString().slice(0, 10);

function bounds(period: Period, from?: string, to?: string) {
  const now = new Date();
  const start = new Date(now); start.setHours(0, 0, 0, 0);
  const end = new Date(now); end.setHours(23, 59, 59, 999);
  if (period === "WEEK") start.setDate(start.getDate() - 6);
  if (period === "MONTH") start.setDate(1);
  if (period === "CUSTOM") return { from: from ? new Date(`${from}T00:00:00.000Z`) : undefined, to: to ? new Date(`${to}T23:59:59.999Z`) : undefined };
  return { from: start, to: end };
}

export default async function CapitalPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser(); const params = await searchParams;
  const requestedPeriod = value(params.period);
  const period: Period = requestedPeriod === "WEEK" || requestedPeriod === "MONTH" || requestedPeriod === "CUSTOM" ? requestedPeriod : "TODAY";
  const { from, to } = bounds(period, value(params.from), value(params.to));
  const [money, transactions] = await Promise.all([
    getMoneyOverview(user.id),
    prisma.transaction.findMany({
      where: { userId: user.id, deletedAt: null, type: { in: [TransactionType.INCOME, TransactionType.EXPENSE] }, ...(from || to ? { operationDate: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}) },
      select: { amount: true, currency: true, module: true, type: true },
    }),
  ]);
  const active = money.accounts.filter((account) => account.isActive);
  const currencies = [...new Set([...active.map((account) => account.currency), ...transactions.map((transaction) => transaction.currency), user.defaultCurrency])];
  const capital = currencies.map((currency) => {
    const total = active.filter((account) => account.currency === currency && account.kind === MoneyAccountKind.WALLET).reduce((sum, account) => sum + account.balanceMinor, 0n);
    const reserved = active.filter((account) => account.currency === currency && account.kind === MoneyAccountKind.ENVELOPE).reduce((sum, account) => sum + account.balanceMinor, 0n);
    return { currency, total, reserved, free: total - reserved };
  });
  const resultByCurrency = currencies.map((currency) => {
    const scoped = transactions.filter((transaction) => transaction.currency === currency);
    const income = scoped.filter((transaction) => transaction.type === TransactionType.INCOME).reduce((sum, transaction) => sum + moneyToMinorUnits(transaction.amount.toString()), 0n);
    const expense = scoped.filter((transaction) => transaction.type === TransactionType.EXPENSE).reduce((sum, transaction) => sum + moneyToMinorUnits(transaction.amount.toString()), 0n);
    return { currency, income, expense, result: income - expense };
  });
  const directionResults = directions.map(([module, label]) => {
    const scoped = transactions.filter((transaction) => transaction.module === module && transaction.currency === user.defaultCurrency);
    const result = scoped.reduce((sum, transaction) => sum + (transaction.type === TransactionType.INCOME ? moneyToMinorUnits(transaction.amount.toString()) : -moneyToMinorUnits(transaction.amount.toString())), 0n);
    return { module, label, result };
  });
  const periodLabels: Record<Period, string> = { TODAY: "Сегодня", WEEK: "Неделя", MONTH: "Месяц", CUSTOM: "Другой период" };
  const analytics = new URLSearchParams({ period });
  if (period === "CUSTOM") { if (value(params.from)) analytics.set("from", value(params.from)!); if (value(params.to)) analytics.set("to", value(params.to)!); }

  return <div className="imperia-capital-page">
    <header className="page-header"><div><p className="eyebrow">FEVORA · IMPERIA</p><h1>Капитал</h1><p className="muted">Сколько у меня сейчас денег и как выглядит общий финансовый результат.</p></div><Link href="/safe" className="button secondary">Открыть Сейф</Link></header>
    <section className="imperia-capital-total"><AppIcon name="money"/><div><small>Общий капитал</small>{capital.map((item) => <strong key={item.currency}>{formatMoney(minorUnitsToMoney(item.total), item.currency)}</strong>)}<p>Сумма всех активных Wallet. Конверты не добавляют деньги.</p></div></section>
    <section className="imperia-capital-distribution"><header><p className="eyebrow">Структура капитала</p><Link href="/money/envelopes">Конверты <AppIcon name="arrow"/></Link></header>{capital.map((item) => <div key={item.currency}><article><small>Всего денег</small><b>{formatMoney(minorUnitsToMoney(item.total), item.currency)}</b></article><article><small>В конвертах</small><b>{formatMoney(minorUnitsToMoney(item.reserved), item.currency)}</b></article><article><small>Свободно</small><b>{formatMoney(minorUnitsToMoney(item.free), item.currency)}</b></article></div>)}</section>
    <section className="imperia-capital-result"><header><div><p className="eyebrow">Финансовый результат</p><h2>{periodLabels[period]}</h2></div><Link href={`/analytics?${analytics.toString()}`} className="button secondary">Открыть аналитику</Link></header><form action="/capital" className="imperia-capital-period"><label>Период<select name="period" defaultValue={period}><option value="TODAY">Сегодня</option><option value="WEEK">Неделя</option><option value="MONTH">Месяц</option><option value="CUSTOM">Другой период</option></select></label><label>С<input name="from" type="date" defaultValue={value(params.from) ?? (period === "CUSTOM" ? "" : dateValue(from!))}/></label><label>По<input name="to" type="date" defaultValue={value(params.to) ?? (period === "CUSTOM" ? "" : dateValue(to!))}/></label><button className="button primary">Показать</button></form>{resultByCurrency.map((item) => <div className="imperia-capital-result-values" key={item.currency}><article><small>Доходы</small><b className="income">{formatMoney(minorUnitsToMoney(item.income), item.currency)}</b></article><article><small>Расходы</small><b className="expense">{formatMoney(minorUnitsToMoney(item.expense), item.currency)}</b></article><article><small>Результат</small><b className={item.result < 0n ? "expense" : "income"}>{formatMoney(minorUnitsToMoney(item.result), item.currency)}</b></article></div>)}</section>
    <section className="imperia-capital-directions"><header><div><p className="eyebrow">Откуда пришли деньги</p><h2>Вклад направлений</h2></div><small>Результат операций за выбранный период, не баланс проектов.</small></header><div>{directionResults.map((item) => <article key={item.module}><span>{item.label}</span><b className={item.result < 0n ? "expense" : item.result > 0n ? "income" : ""}>{item.result > 0n ? "+" : ""}{formatMoney(minorUnitsToMoney(item.result), user.defaultCurrency)}</b></article>)}</div></section>
  </div>;
}
