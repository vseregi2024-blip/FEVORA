import type { MoneyAccountKind, MoneyAccountType } from "@prisma/client";

type Value = { id?: string; name?: string; type?: MoneyAccountType; currency?: string; openingBalance?: string; targetAmount?: string; targetDate?: string; note?: string; isPrimary?: boolean };

export function MoneyAccountForm({ action, projectCode, kind, value = {}, submitLabel }: { action: (data: FormData) => void | Promise<void>; projectCode: string; kind: MoneyAccountKind; value?: Value; submitLabel: string }) {
  const wallet = kind === "WALLET";
  return <form action={action} className="transaction-form money-account-form">
    {value.id && <input type="hidden" name="id" value={value.id}/>}<input type="hidden" name="projectCode" value={projectCode}/><input type="hidden" name="kind" value={kind}/>
    <label>Название<input name="name" required autoFocus maxLength={80} defaultValue={value.name ?? ""} placeholder={wallet ? "Например: Mono" : "Например: На препараты"}/></label>
    {wallet ? <>
      <div className="form-grid"><label>Тип<select name="type" defaultValue={value.type ?? "CARD"}><option value="CASH">Наличные</option><option value="BANK">Банковский счёт</option><option value="CARD">Карта</option><option value="OTHER">Другой</option></select></label><label>Валюта<input name="currency" required minLength={3} maxLength={3} defaultValue={value.currency ?? "UAH"}/></label></div>
      <label>Стартовый остаток<input name="openingBalance" required inputMode="decimal" defaultValue={value.openingBalance ?? "0"}/><small>Начальное состояние, не доход.</small></label>
      <label className="money-checkbox"><input name="isPrimary" type="checkbox" defaultChecked={value.isPrimary}/><span>Основной кошелёк проекта</span></label>
    </> : <>
      <input type="hidden" name="type" value="OTHER"/><input type="hidden" name="openingBalance" value="0"/>
      <div className="form-grid"><label>Целевая сумма <small>необязательно</small><input name="targetAmount" inputMode="decimal" defaultValue={value.targetAmount ?? ""}/></label><label>Срок <small>необязательно</small><input name="targetDate" type="date" defaultValue={value.targetDate ?? ""}/></label></div>
      <label>Валюта<input name="currency" required minLength={3} maxLength={3} defaultValue={value.currency ?? "UAH"}/></label>
    </>}
    <label>Комментарий <small>необязательно</small><textarea name="note" maxLength={500} defaultValue={value.note ?? ""}/></label>
    <button className="button primary">{submitLabel}</button>
  </form>;
}
