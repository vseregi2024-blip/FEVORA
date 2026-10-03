import Link from "next/link";
import { MoneyAccountKind } from "@prisma/client";

import { formatMoney, minorUnitsToMoney, moneyToMinorUnits } from "@/lib/money";
import { requireUser } from "@/server/auth";
import { getMoneyOverview } from "@/server/money";

export default async function EnvelopesPage() {
  const user = await requireUser(); const overview = await getMoneyOverview(user.id);
  const envelopes = overview.accounts.filter((account) => account.isActive && account.kind === MoneyAccountKind.ENVELOPE);
  return <><header className="page-header"><div><Link href="/safe" className="eyebrow">← Сейф</Link><h1>Конверты</h1><p className="muted">На что часть денег зарезервирована.</p></div><Link href="/money/new?kind=ENVELOPE" className="button primary">＋ Конверт</Link></header><section className="imperia-finance-accounts"><header><span><small>Распределение денег</small><b>Активные конверты</b></span></header>{envelopes.length ? <div>{envelopes.map((account) => { const target = account.targetAmount ? moneyToMinorUnits(account.targetAmount.toString()) : null; const progress = target && target > 0n ? Math.min(100, Number(account.balanceMinor * 100n / target)) : null; const remaining = target ? (target - account.balanceMinor > 0n ? target - account.balanceMinor : 0n) : null; return <Link href={`/money/${account.id}`} key={account.id}><span className="imperia-finance-account-icon">{account.icon || "✦"}</span><span><b>{account.name}</b><small>{target ? `Накоплено ${formatMoney(minorUnitsToMoney(account.balanceMinor), account.currency)} из ${formatMoney(account.targetAmount!.toString(), account.currency)} · ${progress}% · осталось ${formatMoney(minorUnitsToMoney(remaining!), account.currency)}` : `Зарезервировано ${formatMoney(minorUnitsToMoney(account.balanceMinor), account.currency)}`}</small></span><strong>{formatMoney(minorUnitsToMoney(account.balanceMinor), account.currency)}</strong></Link>; })}</div> : <p className="empty">Конвертов пока нет.</p>}</section></>;
}
