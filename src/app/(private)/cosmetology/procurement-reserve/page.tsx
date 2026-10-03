import Link from "next/link";

import { requireUser } from "@/server/auth";
import { getCosmetologyProcurementReserveHistory } from "@/server/cosmetology";
import { formatMoney } from "@/lib/money";

export default async function ProcurementReservePage() {
  const user = await requireUser();
  const { envelope, entries } = await getCosmetologyProcurementReserveHistory(user.id);
  const current = envelope ? entries.reduce((sum, entry) => sum.add(entry.amount), envelope.openingBalance) : null;
  return <><header className="page-header"><div><p className="eyebrow">Косметология · Резерв</p><h1>На закупку</h1><p className="muted">Пополнения от процедур и использование при закупках.</p></div><Link href="/cosmetology" className="button secondary">К кабинету</Link></header>{!envelope ? <p className="empty">Конверт «На закупку» не найден.</p> : <><section className="app-card"><p className="eyebrow">Текущий резерв</p><h2>{formatMoney(current!.toString())}</h2></section><div className="transaction-list">{entries.map((entry) => { const source = entry.transaction?.cosmetologyVisit ? `Процедура: ${entry.transaction.cosmetologyVisit.procedureName}` : entry.transaction?.cosmetologyLot ? `Закупка: ${entry.transaction.cosmetologyLot.item.name}` : entry.transaction?.description ?? "Корректировка резерва"; return <article className="transaction-row" key={entry.id}><span><b>{source}</b><small>{entry.operationDate.toLocaleDateString("ru-RU")}</small></span><strong className={entry.amount.gte(0) ? "income" : "expense"}>{entry.amount.gte(0) ? "+" : "−"}{formatMoney(entry.amount.abs().toString())}</strong></article>; })}</div>{!entries.length && <p className="empty">История резерва пока пуста.</p>}</>}</>;
}
