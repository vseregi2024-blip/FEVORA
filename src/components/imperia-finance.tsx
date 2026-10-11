import Link from "next/link";

import { AppIcon, type AppIconName } from "@/components/ui/icons";
import { IconCircle } from "@/components/ui/imperia";

/** Project navigation is intentionally independent of financial balances.
 * The financial overview is the dedicated /capital route. */
export function ImperiaProjects() {
  const projects: Array<{ name: string; description: string; href: string; icon: AppIconName; tone: "primary" | "pink" | "orange" | "cyan" }> = [
    { name: "Семья", description: "Личные доходы, расходы и сбережения", href: "/family", icon: "home", tone: "primary" },
    { name: "Птицеводство", description: "Птица, корма, инкубация и продажи", href: "/poultry", icon: "flock", tone: "pink" },
    { name: "Товарка", description: "Товары, склад, продажи и прибыль", href: "/goods", icon: "sales", tone: "cyan" },
    { name: "Инфобизнес", description: "Курсы, обучение, расходы и аналитика", href: "/infobusiness", icon: "lightbulb", tone: "primary" },
    { name: "Косметология", description: "Клиенты, процедуры, препараты и финансы", href: "/cosmetology", icon: "sparkles", tone: "pink" },
  ];
  return <div className="imperia-projects-page"><header><div><Link href="/family/settings/sections" className="imperia-projects-back">← Разделы приложения</Link><p>Проекты</p><h1>Ваши направления</h1><span>Вся империя — в одном приложении.</span></div><Link href="/capital">Общий капитал <AppIcon name="arrow"/></Link></header><section>{projects.map((project) => <Link href={project.href} key={project.name}><IconCircle icon={project.icon} tone={project.tone} size="large"/><span><b>{project.name}</b><small>{project.description}</small><em>Активен</em></span><AppIcon name="arrow"/></Link>)}</section></div>;
}
