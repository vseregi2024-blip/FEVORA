import Link from "next/link";

import { requireUser } from "@/server/auth";
import { updateProfileSettingsAction } from "./actions";

export default async function SettingsProfilePage({ searchParams }: { searchParams: Promise<{ error?: string; updated?: string }> }) {
  const user = await requireUser();
  const query = await searchParams;
  return <main className="imperia-settings-detail-page">
    <header><Link href="/family/settings" className="imperia-sections-back">← Настройки</Link><div><p>Настройки FEVORA</p><h1>Профиль и система</h1><span>Основные данные личного учёта.</span></div></header>
    {query.updated && <p className="notice">Настройки профиля сохранены ✓</p>}
    {query.error && <p className="form-error">{query.error}</p>}
    <section aria-label="Данные профиля">
      <article><span><b>Email</b><small>Учётная запись</small></span><em>{user.email}</em></article>
      <article><span><b>Часовой пояс</b><small>Время записей и операций</small></span><em>{user.timezone}</em></article>
      <article><span><b>Валюта</b><small>Основная валюта</small></span><em>{user.defaultCurrency}</em></article>
    </section>
    <form action={updateProfileSettingsAction} className="transaction-form imperia-profile-settings-form">
      <h2>Изменить профиль</h2>
      <label>Имя<input name="name" required maxLength={80} defaultValue={user.name ?? ""}/></label>
      <div className="form-grid"><label>Часовой пояс<select name="timezone" defaultValue={user.timezone}><option value="Europe/Kyiv">Киев</option><option value="Europe/Warsaw">Варшава</option><option value="Europe/London">Лондон</option><option value="UTC">UTC</option></select></label><label>Основная валюта<select name="defaultCurrency" defaultValue={user.defaultCurrency}><option value="UAH">UAH — гривна</option><option value="USD">USD — доллар</option><option value="EUR">EUR — евро</option></select></label></div>
      <p className="summary-note">Валюта по умолчанию не конвертирует и не изменяет уже сохранённые операции, кошельки или конверты.</p>
      <button className="button primary">Сохранить изменения</button>
    </form>
  </main>;
}
