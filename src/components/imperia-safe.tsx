import Link from "next/link";

import { AppIcon } from "@/components/ui/icons";

type Wallet = { id: string; name: string; currency: string; balance: string; type: string };

export function ImperiaSafe({ todayIncome, todayExpense, todayResult, wallets, allocations }: { todayIncome: string; todayExpense: string; todayResult: string; wallets: Wallet[]; allocations: Array<{ currency: string; total: string; allocated: string; free: string }> }) {
  return <div className="imperia-safe-page">
    <header className="page-header"><div><p className="eyebrow">FEVORA · IMPERIA</p><h1>Сейф</h1><p className="muted">Что у меня сейчас с деньгами</p></div><Link href="/analytics" className="button secondary">Аналитика</Link></header>
    <section className="imperia-safe-today"><header><span><AppIcon name="calendar"/><h2>Сегодня</h2></span></header><div><article><small>Пришло</small><b className="income">{todayIncome}</b></article><article><small>Ушло</small><b className="expense">{todayExpense}</b></article><article><small>Итог</small><b className={todayResult.startsWith("-") ? "expense" : "income"}>{todayResult}</b></article></div></section>
    <section className="imperia-safe-wallets"><header><div><p className="eyebrow">Где лежат деньги</p><h2>Кошельки</h2></div><Link href="/money/new?kind=WALLET">Управлять <AppIcon name="arrow"/></Link></header>{wallets.length ? <div>{wallets.map((wallet) => <Link href={`/money/${wallet.id}`} key={wallet.id}><span className="imperia-safe-wallet-icon">{wallet.type === "CASH" ? "₴" : wallet.type === "CARD" ? "◈" : "Б"}</span><span><b>{wallet.name}</b><small>Реальный остаток</small></span><strong>{wallet.balance}</strong><AppIcon name="arrow"/></Link>)}</div> : <p className="empty">Создайте первый кошелёк, чтобы видеть реальный остаток.</p>}</section>
    <Link href="/money/envelopes" className="imperia-safe-allocation"><span><p className="eyebrow">Распределение денег</p><h2>Деньги и конверты</h2></span><AppIcon name="arrow"/>{allocations.map((item) => <div key={item.currency}><span>Всего денег <b>{item.total}</b></span><span>В конвертах <b>{item.allocated}</b></span><span>Свободно <b>{item.free}</b></span></div>)}</Link>
  </div>;
}
