import Link from "next/link";

import { AppIcon, type AppIconName } from "@/components/ui/icons";
import { IconCircle } from "@/components/ui/imperia";

const securityItems: Array<{ icon: AppIconName; title: string; description: string; status: string }> = [
  { icon: "lock", title: "Вход по паролю", description: "Доступ защищён паролем", status: "Активен" },
  { icon: "fingerprint", title: "Биометрический вход", description: "Подключение ещё не настроено", status: "Не подключён" },
];

export default function SecuritySettingsPage() {
  return <main className="imperia-settings-detail-page">
    <header><Link href="/family/settings" className="imperia-sections-back">← Настройки</Link><IconCircle icon="shield" tone="cyan" size="large"/><div><p>Настройки FEVORA</p><h1>Безопасность</h1><span>Защита твоих данных</span></div></header>
    <section>{securityItems.map((item) => <article key={item.title}><AppIcon name={item.icon}/><span><b>{item.title}</b><small>{item.description}</small></span><em className={item.status === "Активен" ? "is-active" : ""}>{item.status}</em></article>)}</section>
  </main>;
}
