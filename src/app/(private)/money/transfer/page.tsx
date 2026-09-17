import { randomUUID } from "node:crypto";
import { FinanceModule } from "@prisma/client";
import Link from "next/link";

import { todayInputValue } from "@/lib/dates";
import { formatMoney, minorUnitsToMoney } from "@/lib/money";
import { requireUser } from "@/server/auth";
import { getMoneyTransferWorkspace } from "@/server/money";
import { createInternalAllocationAction } from "../actions";

const allowed = new Set<FinanceModule>(Object.values(FinanceModule).filter((code) => code !== "GENERAL"));
export default async function MoneyTransferPage({ searchParams }: { searchParams: Promise<{ project?: string; error?: string }> }) {
  const user = await requireUser();
  const query = await searchParams;
  const project = allowed.has(query.project as FinanceModule) ? query.project as FinanceModule : FinanceModule.FAMILY;
  const data = await getMoneyTransferWorkspace(user.id);
  const options = (selectedProject: typeof data.projects[number]) => data.accounts.filter((account) => account.projectId === selectedProject.id);
  const accountOptions = data.projects.flatMap(options);
  return <><header className="page-header"><div><Link href={`/money?project=${project}`} className="eyebrow">← Назад</Link><h1>Перевести деньги</h1><p className="muted">Выберите, где деньги находятся сейчас и куда их переместить. Это не доход и не расход.</p></div><Link href="/money/transfers" className="button secondary">История</Link></header>{query.error && <p className="form-error">{query.error}</p>}<section className="money-transfer-capital">{data.summaries.map((summary) => <span key={summary.currency}>Общий капитал: <b>{formatMoney(minorUnitsToMoney(summary.total), summary.currency)}</b></span>)}</section>{accountOptions.length >= 2 ? <form action={createInternalAllocationAction} className="transaction-form"><input type="hidden" name="projectCode" value={project}/><input type="hidden" name="idempotencyKey" value={randomUUID()}/><label>Откуда<select name="sourceAccountId" required defaultValue=""><option value="" disabled>Выберите источник</option>{data.projects.map((item) => options(item).length ? <optgroup key={item.id} label={item.name}>{options(item).map((account) => <option key={account.id} value={account.id}>{account.name} · {formatMoney(minorUnitsToMoney(account.balanceMinor), account.currency)}</option>)}</optgroup> : null)}</select></label><label>Куда<select name="targetAccountId" required defaultValue=""><option value="" disabled>Выберите назначение</option>{data.projects.map((item) => options(item).length ? <optgroup key={item.id} label={item.name}>{options(item).map((account) => <option key={account.id} value={account.id}>{account.name} · {account.kind === "ENVELOPE" ? "конверт" : "кошелёк"} · {account.currency}</option>)}</optgroup> : null)}</select></label><div className="form-grid"><label>Сумма<input name="amount" required inputMode="decimal" placeholder="20 000"/></label><label>Дата<input name="operationDate" type="date" required defaultValue={todayInputValue()}/></label></div><label>Комментарий <small>необязательно</small><input name="comment" maxLength={500} placeholder="Например: на сбережения"/></label><div className="money-form-actions"><Link href={`/money?project=${project}`} className="button secondary">Отмена</Link><button className="button primary">Перевести</button></div></form> : <p className="empty">Создайте минимум два активных кошелька или конверта. Они могут находиться в разных проектах.</p>}</>;
}
