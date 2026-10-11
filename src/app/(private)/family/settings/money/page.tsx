import { MoneyAccountKind } from "@prisma/client";
import Link from "next/link";

import { AppIcon } from "@/components/ui/icons";
import { formatMoney, minorUnitsToMoney } from "@/lib/money";
import { requireUser } from "@/server/auth";
import { getMoneyOverview } from "@/server/money";

const returnTo = "/family/settings/money";

export default async function MoneySettingsPage() {
  const user = await requireUser();
  const overview = await getMoneyOverview(user.id);
  const wallets = overview.accounts.filter((account) => account.isActive && account.kind === MoneyAccountKind.WALLET);
  const envelopes = overview.accounts.filter((account) => account.isActive && account.kind === MoneyAccountKind.ENVELOPE);
  const accountHref = (id: string) => `/money/${id}?returnTo=${returnTo}`;
  const createHref = (kind: MoneyAccountKind) => `/money/new?project=FAMILY&kind=${kind}&returnTo=${returnTo}`;
  const list = (items: typeof wallets, empty: string) => items.length ? <div>{items.map((account) => <Link href={accountHref(account.id)} key={account.id}><span className="imperia-finance-account-icon">{account.kind === MoneyAccountKind.ENVELOPE ? account.icon || "✦" : "₴"}</span><span><b>{account.name}</b><small>{account.project.name} · {account.kind === MoneyAccountKind.WALLET ? "физические деньги" : "резерв"}</small></span><strong>{formatMoney(minorUnitsToMoney(account.balanceMinor), account.currency)}</strong><AppIcon name="arrow"/></Link>)}</div> : <p className="empty">{empty}</p>;
  return <main className="imperia-money-settings-page">
    <header><Link href="/family/settings/sections" className="imperia-sections-back">← Разделы приложения</Link><p>Настройка финансов</p><h1>Кошельки и конверты</h1><span>Кошелёк отвечает за место, где лежат реальные деньги. Конверт — за резерв.</span></header>
    <section className="imperia-finance-accounts"><header><span><small>Физические деньги</small><b>Кошельки</b></span><Link href={createHref(MoneyAccountKind.WALLET)}>＋ Настроить</Link></header>{list(wallets, "Кошельков пока нет.")}</section>
    <section className="imperia-finance-accounts"><header><span><small>Резервы и цели</small><b>Конверты</b></span><Link href={createHref(MoneyAccountKind.ENVELOPE)}>＋ Настроить</Link></header>{list(envelopes, "Конвертов пока нет.")}</section>
  </main>;
}
