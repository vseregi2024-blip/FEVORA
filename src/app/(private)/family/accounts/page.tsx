import Link from "next/link";

import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { requireUser } from "@/server/auth";
import { getFamilyAccounts } from "@/server/family";

import { createFamilyAccountAction, deleteFamilyAccountAction, updateFamilyAccountAction } from "../actions";

export default async function FamilyAccountsPage() {
  const user = await requireUser();
  const accounts = await getFamilyAccounts(user.id, true);

  return <>
    <header className="page-header"><div><Link href="/family" className="eyebrow family-home-link">← Дом</Link><h1>Счета</h1><p className="muted">Наличные, карты и другие способы оплаты.</p></div></header>
    <section className="app-card category-create"><h2>Создать счёт</h2><form action={createFamilyAccountAction} className="compact-form"><label>Название<input name="name" required autoFocus placeholder="Например: Карта"/></label><button className="button primary">Сохранить счёт</button></form></section>
    <section className="section-header"><div><p className="eyebrow">Мои счета</p><h2>{accounts.length} счетов</h2></div></section>
    <div className="family-reference-list family-clean-list family-account-list">
      {accounts.map((account) => <details key={account.id}>
        <summary><span className="family-reference-icon">▣</span><span><b>{account.name}</b><small>Семейный счёт</small></span><i>›</i></summary>
        <form action={updateFamilyAccountAction} className="compact-form family-reference-edit"><input type="hidden" name="id" value={account.id}/><label>Название<input name="name" required defaultValue={account.name}/></label><button className="button secondary category-save-button">Сохранить изменения</button></form>
        <div className="family-reference-delete"><ConfirmationDialog action={deleteFamilyAccountAction} fieldName="id" fieldValue={account.id} trigger="Удалить счёт" title={`Удалить счёт «${account.name}»?`} description="Финансовые операции сохранятся, но будут отображаться без счёта." confirmLabel="Удалить счёт" triggerClassName="text-button expense"/></div>
      </details>)}
      {accounts.length === 0 && <p className="empty">Добавьте наличные, карту или другой семейный счёт.</p>}
    </div>
  </>;
}
