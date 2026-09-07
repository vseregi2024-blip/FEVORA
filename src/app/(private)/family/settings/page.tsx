import Link from "next/link";

import { FamilyThemeToggle } from "@/components/family-theme-toggle";

export default function FamilySettingsPage() {
  return <><header className="page-header"><div><Link href="/family" className="eyebrow family-home-link">← Дом</Link><h1>Настройки</h1><p className="muted">Справочники, которыми не нужно пользоваться каждый день.</p></div></header><FamilyThemeToggle/><div className="family-settings-grid"><Link href="/family/categories" className="app-card"><b>Категории</b><span>Создание, иконки, порядок и удаление</span><em>Открыть →</em></Link><Link href="/family/accounts" className="app-card"><b>Счета и способы оплаты</b><span>Наличные, карты и другие семейные счета</span><em>Открыть →</em></Link><Link href="/family/recurring" className="app-card"><b>Обязательные платежи</b><span>Расписание, пауза и история</span><em>Открыть →</em></Link></div></>;
}
