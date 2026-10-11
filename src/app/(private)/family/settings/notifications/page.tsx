import Link from "next/link";

import { AppIcon, type AppIconName } from "@/components/ui/icons";
import { IconCircle } from "@/components/ui/imperia";

const notifications: Array<{ icon: AppIconName; title: string; description: string }> = [
  { icon: "clients", title: "Новые клиенты", description: "Уведомления ещё не настроены" },
  { icon: "money", title: "Финансовые события", description: "Уведомления ещё не настроены" },
  { icon: "calendar", title: "Напоминания и задачи", description: "Уведомления ещё не настроены" },
];

export default function NotificationsSettingsPage() {
  return <SettingsDetailPage title="Уведомления" subtitle="Будь в курсе важного" icon="bell" tone="pink" items={notifications}/>;
}

function SettingsDetailPage({ title, subtitle, icon, tone, items }: { title: string; subtitle: string; icon: AppIconName; tone: "pink" | "cyan"; items: Array<{ icon: AppIconName; title: string; description: string }> }) {
  return <main className="imperia-settings-detail-page">
    <header><Link href="/family/settings" className="imperia-sections-back">← Настройки</Link><IconCircle icon={icon} tone={tone} size="large"/><div><p>Настройки FEVORA</p><h1>{title}</h1><span>{subtitle}</span></div></header>
    <section>{items.map((item) => <article key={item.title}><AppIcon name={item.icon}/><span><b>{item.title}</b><small>{item.description}</small></span><em>Не настроено</em></article>)}</section>
  </main>;
}
