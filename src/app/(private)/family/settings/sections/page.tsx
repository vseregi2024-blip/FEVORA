import Link from "next/link";

import { AppIcon, type AppIconName } from "@/components/ui/icons";
import { IconCircle } from "@/components/ui/imperia";

const sections: Array<{ href: string; icon: AppIconName; tone: "primary" | "pink" | "orange" | "cyan"; title: string; subtitle: string }> = [
  { href: "/projects", icon: "projects", tone: "orange", title: "Проекты", subtitle: "Семья, бизнес и косметология" },
  { href: "/family/categories", icon: "operations", tone: "pink", title: "Финансовые категории", subtitle: "Доходы и расходы" },
  { href: "/family/accounts", icon: "cash", tone: "primary", title: "Счета и способы оплаты", subtitle: "Кошельки и способы оплаты" },
  { href: "/family/settings/money", icon: "money", tone: "cyan", title: "Кошельки и конверты", subtitle: "Настройка реальных денег и резервов" },
  { href: "/family/recurring", icon: "calendar", tone: "pink", title: "Обязательные платежи", subtitle: "Напоминания и регулярные расходы" },
  { href: "/cosmetology/procedures", icon: "sparkles", tone: "primary", title: "Услуги", subtitle: "Прайс и процедуры косметологии" },
  { href: "/cosmetology/inventory", icon: "feed", tone: "orange", title: "Препараты и расходники", subtitle: "Остатки и закупки" },
];

export default function ApplicationSectionsPage() {
  return <main className="imperia-sections-page">
    <header>
      <Link href="/family/settings" className="imperia-sections-back">← Настройки</Link>
      <p>Настройки FEVORA</p>
      <h1>Разделы приложения</h1>
      <span>Выберите раздел — он откроется отдельным экраном.</span>
    </header>
    <section aria-label="Рабочие разделы">
      {sections.map((section) => <Link href={section.href} key={section.href} className="imperia-sections-link">
        <IconCircle icon={section.icon} tone={section.tone} size="medium"/>
        <span><b>{section.title}</b><small>{section.subtitle}</small></span>
        <AppIcon name="arrow"/>
      </Link>)}
    </section>
  </main>;
}
