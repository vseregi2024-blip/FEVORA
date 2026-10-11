import { randomUUID } from "node:crypto";
import { FinanceModule } from "@prisma/client";
import Link from "next/link";

import { todayInputValue } from "@/lib/dates";
import { formatMoney, minorUnitsToMoney } from "@/lib/money";
import { requireUser } from "@/server/auth";
import { getMoneyTransferWorkspace } from "@/server/money";
import { createInternalAllocationAction } from "../actions";

export default async function MoneyTransferPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await requireUser(); const query = await searchParams;
  const data = await getMoneyTransferWorkspace(user.id);
  const wallets = data.accounts.filter((account) => account.kind === "WALLET");
  const envelopes = data.accounts.filter((account) => account.kind === "ENVELOPE");
  const accountOptions = [...wallets, ...envelopes];
  const option = (account: (typeof data.accounts)[number], includeBalance: boolean) => <option key={account.id} value={account.id}>{account.name} · {account.kind === "ENVELOPE" ? "конверт" : "кошелёк"}{includeBalance ? ` · ${formatMoney(minorUnitsToMoney(account.balanceMinor), account.currency)}` : ""}</option>;
  return <><header className="page-header"><div><Link href="/safe" className="eyebrow">← Сейф</Link><h1>Перевести деньги</h1><p className="muted">Переместите деньги между реальными кошельками или зарезервируйте их в конверте. Это не доход и не расход.</p></div><Link href="/money/transfers" className="button secondary">История</Link></header>{query.error && <p className="form-error">{query.error}</p>}<section className="money-transfer-capital">{data.summaries.map((summary) => <span key={summary.currency}>Всего денег: <b>{formatMoney(minorUnitsToMoney(summary.total), summary.currency)}</b></span>)}</section>{accountOptions.length >= 2 ? <form action={createInternalAllocationAction} className="transaction-form"><input type="hidden" name="projectCode" value={FinanceModule.FAMILY}/><input type="hidden" name="idempotencyKey" value={randomUUID()}/><label>Откуда<select name="sourceAccountId" required defaultValue=""><option value="" disabled>Выберите источник</option>{wallets.length > 0 && <optgroup label="Кошельки">{wallets.map((account) => option(account, true))}</optgroup>}{envelopes.length > 0 && <optgroup label="Конверты">{envelopes.map((account) => option(account, true))}</optgroup>}</select></label><label>Куда<select name="targetAccountId" required defaultValue=""><option value="" disabled>Выберите назначение</option>{wallets.length > 0 && <optgroup label="Кошельки">{wallets.map((account) => option(account, false))}</optgroup>}{envelopes.length > 0 && <optgroup label="Конверты">{envelopes.map((account) => option(account, false))}</optgroup>}</select></label><div className="form-grid"><label>Сумма<input name="amount" required inputMode="decimal" placeholder="20 000"/></label><label>Дата<input name="operationDate" type="date" required defaultValue={todayInputValue()}/></label></div><label>Комментарий <small>необязательно</small><input name="comment" maxLength={500} placeholder="Например: в резерв"/></label><div className="money-form-actions"><Link href="/safe" className="button secondary">Отмена</Link><button className="button primary">Перевести</button></div></form> : <p className="empty">Создайте минимум два активных кошелька или конверта.</p>}</>;
}
