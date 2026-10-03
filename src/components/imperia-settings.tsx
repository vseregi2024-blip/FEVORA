import Link from "next/link";

import { FamilyThemeToggle } from "@/components/family-theme-toggle";
import { AppIcon, type AppIconName } from "@/components/ui/icons";
import { IconCircle } from "@/components/ui/imperia";

type LogoutAction = (formData: FormData) => void | Promise<void>;

function StatusLine({ icon, label, status }: { icon: AppIconName; label: string; status: string }) {
  return <div className="imperia-settings-status"><AppIcon name={icon}/><span>{label}</span><em>{status}</em></div>;
}

function SettingsLink({ href, icon, title, subtitle }: { href: string; icon: AppIconName; title: string; subtitle?: string }) {
  return <Link href={href}><AppIcon name={icon}/><span><b>{title}</b>{subtitle && <small>{subtitle}</small>}</span><AppIcon name="arrow"/></Link>;
}

export function ImperiaSettings({ user, loyaltyConnected, logoutAction }: { user: { name: string | null; email: string; timezone: string; currency: string }; loyaltyConnected: boolean; logoutAction: LogoutAction }) {
  const name = user.name?.trim() || "Владелец FEVORA";
  const initial = name.charAt(0).toLocaleUpperCase("ru-RU");
  return <div className="imperia-settings-page">
    <details className="imperia-settings-profile">
      <summary><span className="imperia-settings-avatar">{initial}<i><AppIcon name="crown"/></i></span><span><b>{name}</b><small>Владелец FEVORA IMPERIA</small><em><AppIcon name="crown"/> Премиум</em></span><span className="imperia-profile-open">Данные профиля <AppIcon name="arrow"/></span></summary>
      <dl><div><dt>Email</dt><dd>{user.email}</dd></div><div><dt>Часовой пояс</dt><dd>{user.timezone}</dd></div><div><dt>Валюта</dt><dd>{user.currency}</dd></div></dl>
    </details>

    <section className="imperia-settings-card imperia-appearance"><IconCircle icon="palette" tone="primary" size="large"/><div className="imperia-settings-intro"><h2>Внешний вид</h2><p>Тема и визуальные настройки</p></div><FamilyThemeToggle/></section>

    <section className="imperia-settings-card"><IconCircle icon="bell" tone="pink" size="large"/><div className="imperia-settings-intro"><h2>Уведомления</h2><p>Будь в курсе важного</p></div><div className="imperia-settings-detail"><StatusLine icon="clients" label="Новые клиенты" status="Не настроено"/><StatusLine icon="money" label="Финансовые события" status="Не настроено"/><StatusLine icon="calendar" label="Напоминания и задачи" status="Не настроено"/></div></section>

    <section className="imperia-settings-card"><IconCircle icon="shield" tone="cyan" size="large"/><div className="imperia-settings-intro"><h2>Безопасность</h2><p>Защита твоих данных</p></div><div className="imperia-settings-detail"><StatusLine icon="lock" label="Вход по паролю" status="Активен"/><StatusLine icon="fingerprint" label="Биометрический вход" status="Не подключён"/></div></section>

    <section className="imperia-settings-card"><IconCircle icon="projects" tone="orange" size="large"/><div className="imperia-settings-intro"><h2>Разделы приложения</h2><p>Управление рабочими разделами</p></div><div className="imperia-settings-detail imperia-settings-links"><SettingsLink href="/projects" icon="projects" title="Проекты" subtitle="Семья, бизнес и косметология"/><SettingsLink href="/family/categories" icon="operations" title="Финансовые категории"/><SettingsLink href="/family/accounts" icon="cash" title="Счета и способы оплаты"/><SettingsLink href="/family/recurring" icon="calendar" title="Обязательные платежи"/><SettingsLink href="/cosmetology/procedures" icon="sparkles" title="Услуги"/><SettingsLink href="/cosmetology/inventory" icon="feed" title="Препараты и расходники"/></div></section>

    <section className="imperia-settings-card imperia-integration"><IconCircle icon="crown" tone="primary" size="large"/><div className="imperia-settings-intro"><h2>Интеграция лояльности</h2><p>Beauty Bonus Club</p></div><span className={loyaltyConnected ? "is-connected" : ""}><i/>{loyaltyConnected ? "Подключено" : "Не настроено"}</span><small>{loyaltyConnected ? "Программа лояльности доступна" : "Проверьте конфигурацию интеграции"}</small></section>

    <section className="imperia-settings-system"><SettingsLink href="/settings" icon="settings" title="Системные настройки" subtitle={`${user.timezone} · ${user.currency}`}/><SettingsLink href="/money" icon="money" title="Кошельки и конверты" subtitle="Все проекты"/><div className="imperia-settings-static"><AppIcon name="help"/><span><b>Помощь и поддержка</b><small>Раздел ещё не подключён</small></span></div><div className="imperia-settings-static"><AppIcon name="document"/><span><b>Условия использования</b><small>Правовая информация</small></span></div><form action={logoutAction}><button type="submit"><AppIcon name="logout"/><span>Выйти из аккаунта</span></button></form></section>
  </div>;
}
