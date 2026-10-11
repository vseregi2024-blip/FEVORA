import { randomUUID } from "node:crypto";
import { MoneyAccountKind } from "@prisma/client";
import Link from "next/link";

import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { MoneyAccountForm } from "@/components/money-account-form";
import { dateToInput, todayInputValue } from "@/lib/dates";
import { formatMoney, minorUnitsToMoney, moneyToMinorUnits } from "@/lib/money";
import { requireUser } from "@/server/auth";
import { getCategories } from "@/server/finance";
import { getMoneyAccount, getMoneyTransferWorkspace } from "@/server/money";
import { calculateMoneyAccountBalance } from "@/features/money/calculations";
import { archiveMoneyAccountAction, deleteMoneyAccountAction, fundMoneyEnvelopeAction, updateMoneyAccountAction } from "../actions";

export default async function MoneyAccountPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; funded?: string; returnTo?: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const query = await searchParams;
  const returnTo = query.returnTo === "/family/settings/money" ? query.returnTo : undefined;
  const account = await getMoneyAccount(user.id, id);
  const categories = account.kind === "ENVELOPE" ? await getCategories(user.id, account.project.code) : [];
  const moneyWorkspace = account.kind === MoneyAccountKind.ENVELOPE ? await getMoneyTransferWorkspace(user.id) : null;
  const sourceWallets = moneyWorkspace?.accounts.filter((item) => item.kind === MoneyAccountKind.WALLET && item.currency === account.currency && item.availableBalanceMinor > 0n) ?? [];
  const balanceMinor = calculateMoneyAccountBalance({ openingBalance: account.openingBalance.toString(), entries: account.moneyLedgerEntries.map((entry) => ({ amount: entry.amount.toString(), reversedAt: entry.reversedAt })) });
  const targetMinor = account.targetAmount ? moneyToMinorUnits(account.targetAmount.toString()) : null;
  const progress = targetMinor && targetMinor > 0n ? Math.min(100, Number(balanceMinor * 100n / targetMinor)) : null;
  const remainingMinor = targetMinor ? (targetMinor > balanceMinor ? targetMinor - balanceMinor : 0n) : null;
  const hasHistory = account._count.moneyLedgerEntries + account._count.incomingTransfers + account._count.outgoingTransfers > 0;
  const backHref = returnTo ?? (account.kind === "ENVELOPE" ? "/money/envelopes" : "/safe");
  return <><header className="page-header"><div><Link href={backHref} className="eyebrow">← Назад</Link><h1>{account.name}</h1><p className="muted">{account.kind === "WALLET" ? "Настройки кошелька" : "Настройки конверта"}{!account.isActive ? " · в архиве" : ""}</p></div></header>{query.error && <p className="form-error">{query.error}</p>}{query.funded && <p className="notice">Сумма добавлена в конверт ✓</p>}{account.kind === MoneyAccountKind.ENVELOPE && <section className="money-envelope-funding">
    <div className="money-envelope-progress-card">
      <span><small>Уже в конверте</small><strong>{formatMoney(minorUnitsToMoney(balanceMinor), account.currency)}</strong></span>
      {targetMinor ? <><span><small>Цель</small><b>{formatMoney(account.targetAmount!.toString(), account.currency)}</b></span><div className="money-envelope-progress-track" aria-label={`Накоплено ${progress}%`}><i style={{ width: `${progress}%` }}/></div><p><b>{progress}%</b><span>Осталось {formatMoney(minorUnitsToMoney(remainingMinor!), account.currency)}</span></p></> : <p className="money-envelope-no-target">Укажите целевую сумму ниже — и здесь появится прогресс.</p>}
    </div>
    {account.isActive && <div className="money-envelope-add-card"><header><p className="eyebrow">ПОПОЛНЕНИЕ</p><h2>Добавить деньги в конверт</h2><span>Выберите кошелёк, где эти деньги лежат. Это резерв, а не новый расход.</span></header>{sourceWallets.length ? <form action={fundMoneyEnvelopeAction} className="money-envelope-add-form"><input type="hidden" name="targetAccountId" value={account.id}/><input type="hidden" name="operationDate" value={todayInputValue()}/><input type="hidden" name="idempotencyKey" value={randomUUID()}/>{returnTo && <input type="hidden" name="returnTo" value={returnTo}/>}<label>Из кошелька<select name="sourceAccountId" required defaultValue=""><option value="" disabled>Выберите кошелёк</option>{sourceWallets.map((wallet) => <option key={wallet.id} value={wallet.id}>{wallet.name} · свободно {formatMoney(minorUnitsToMoney(wallet.availableBalanceMinor), wallet.currency)}</option>)}</select></label><label>Сумма, которая уже есть<input name="amount" required inputMode="decimal" placeholder="Например: 10 000"/></label><button className="button primary">Добавить в конверт</button></form> : <p className="money-envelope-wallet-empty">Сначала создайте кошелёк и укажите, сколько денег в нём уже есть. Затем эту сумму можно распределить в конверт. <Link href="/money/new?kind=WALLET">Создать кошелёк →</Link></p>}</div>}
  </section>}<MoneyAccountForm action={updateMoneyAccountAction} projectCode={account.project.code} kind={account.kind} categories={categories} returnTo={returnTo} submitLabel="Сохранить изменения" value={{ id: account.id, name: account.name, type: account.type, currency: account.currency, openingBalance: account.openingBalance.toString(), targetAmount: account.targetAmount?.toString(), targetDate: account.targetDate ? dateToInput(account.targetDate) : undefined, note: account.note ?? undefined, icon: account.icon ?? undefined, categoryId: account.categoryId ?? undefined, isPrimary: account.isPrimary }}/><section className="danger-zone"><h2>{account.isActive ? "Архивирование" : "Восстановление"}</h2><p className="muted">История и остаток сохраняются. Архивный счёт нельзя использовать в новых распределениях.</p><form action={archiveMoneyAccountAction}><input type="hidden" name="id" value={account.id}/><input type="hidden" name="projectCode" value={account.project.code}/><input type="hidden" name="isActive" value={account.isActive ? "false" : "true"}/>{returnTo && <input type="hidden" name="returnTo" value={returnTo}/>}<button className="button secondary">{account.isActive ? "Переместить в архив" : "Вернуть из архива"}</button></form>{!hasHistory && account.openingBalance.isZero() && <ConfirmationDialog action={deleteMoneyAccountAction} fieldName="id" fieldValue={account.id} hiddenFields={returnTo ? { returnTo } : undefined} trigger="Удалить безвозвратно" title={`Удалить «${account.name}»?`} description="Это разрешено, потому что у счёта нет остатка и истории." confirmLabel="Удалить" triggerClassName="text-button expense"/>}</section></>;
}
