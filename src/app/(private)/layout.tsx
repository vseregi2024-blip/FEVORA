import Link from "next/link";

import { logoutAction } from "./actions";
import { AppIcon } from "@/components/ui/icons";
import { requireUser } from "@/server/auth";

export const dynamic = "force-dynamic";

const links = [
  ["/dashboard", "Главная", "home"],
  ["/projects", "Проекты", "projects"],
  ["/add", "Добавить", "add"],
  ["/reports", "Отчёты", "reports"],
  ["/settings", "Настройки", "settings"],
] as const;

export default async function PrivateLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();
  return <div className="app-shell"><aside className="sidebar"><Link href="/dashboard" className="brand">FEVORA</Link><p className="sidebar-caption">Личный учёт без лишнего</p><nav>{links.map(([href, label, icon]) => <Link href={href} key={href} className={href === "/add" ? "nav-add" : ""}><AppIcon name={icon}/><span>{label}</span></Link>)}</nav><div className="profile"><span>{user.name || user.email}</span><form action={logoutAction}><button className="text-button">Выйти</button></form></div></aside><main className="app-main">{children}</main><nav className="bottom-nav" aria-label="Основная навигация">{links.map(([href, label, icon]) => <Link href={href} key={href} className={href === "/add" ? "nav-add" : ""}><AppIcon name={icon}/><span>{label}</span></Link>)}</nav></div>;
}
