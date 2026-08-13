import Link from "next/link";

import { AppIcon } from "@/components/ui/icons";
import { SectionHeader } from "@/components/ui/section-header";
import { dateFromInput, todayInputValue } from "@/lib/dates";
import { formatMoney, minorUnitsToMoney, moneyToMinorUnits } from "@/lib/money";
import { requireUser } from "@/server/auth";
import { getFinancialSummary, getTransactions } from "@/server/finance";
import { getGoodsDashboard } from "@/server/goods";

const moduleNames = { FAMILY: "Семья", POULTRY: "Птицеводство", GENERAL: "Общее", GOODS: "Товарка" } as const;
export default async function DashboardPage() {
  const user = await requireUser(); const today = todayInputValue(); const monthStart = `${today.slice(0, 7)}-01`;
  const [allTime, month, recent, goods] = await Promise.all([getFinancialSummary(user.id), getFinancialSummary(user.id, dateFromInput(monthStart), dateFromInput(today)), getTransactions(user.id), getGoodsDashboard(user.id, "MONTH")]);
  const result = minorUnitsToMoney(moneyToMinorUnits(month.income) - moneyToMinorUnits(month.expense));
  return <>
    <header className="page-header"><div><p className="eyebrow">FEVORA · мои деньги</p><h1>Здравствуйте{user.name ? `, ${user.name}` : ""}</h1><p className="muted">Спокойный взгляд на финансы и хозяйство.</p></div><Link href="/settings" className="button secondary">Настройки</Link></header>
    <section className="balance-card"><p>Общий баланс</p><strong>{formatMoney(allTime.balance, user.defaultCurrency)}</strong><span>Стартовый остаток и все активные операции</span></section>
    <section className="metric-grid"><article><span>Доходы за месяц</span><strong className="income">{formatMoney(month.income)}</strong></article><article><span>Расходы за месяц</span><strong className="expense">{formatMoney(month.expense)}</strong></article><article><span>Финансовый результат</span><strong>{formatMoney(result)}</strong></article></section>
    <SectionHeader eyebrow="Быстрые действия" title="Добавить запись"/><section className="quick-grid"><Link href="/family" className="quick-action"><AppIcon name="money"/><span>Расход семьи</span></Link><Link href="/poultry/feed" className="quick-action"><AppIcon name="feed"/><span>Купить корм</span></Link><Link href="/goods/sales" className="quick-action"><AppIcon name="sales"/><span>Продать товар</span></Link></section>
    <SectionHeader eyebrow="Проекты" title="Ваши направления" action={<Link href="/projects" className="text-link">Все проекты</Link>}/><section className="project-grid"><Link href="/family" className="project-card active"><b>Семья</b><span>Доходы, расходы, сбережения и обязательные платежи.</span><em>Открыть →</em></Link><Link href="/poultry" className="project-card active"><b>Птицеводство</b><span>Партии, корм, инкубация, продажи и финансы.</span><em>Открыть →</em></Link><Link href="/goods" className="project-card active"><b>Товарка</b><span>Склад: {goods.products.length} поз. · торговая прибыль за месяц {formatMoney(goods.report.profit)}.</span><em>Открыть →</em></Link></section>
    <SectionHeader eyebrow="История" title="Последние операции" action={<Link href="/finance" className="text-link">Весь журнал</Link>}/><div className="transaction-list">{recent.slice(0, 5).map((transaction) => <Link href={transaction.module === "GOODS" ? "/goods" : `/finance/${transaction.id}`} className="transaction-row" key={transaction.id}><span><b>{transaction.category?.name ?? "Без категории"}</b><small>{transaction.operationDate.toLocaleDateString("ru-RU")} · {moduleNames[transaction.module]}</small></span><strong className={transaction.type === "EXPENSE" || transaction.type === "SAVING_IN" ? "expense" : "income"}>{transaction.type === "EXPENSE" || transaction.type === "SAVING_IN" ? "−" : "+"}{formatMoney(transaction.amount.toString())}</strong></Link>)}{recent.length === 0 && <p className="empty">Операций пока нет. Добавьте первую запись.</p>}</div>
  </>;
}
