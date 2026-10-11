"use client";

import type { PropsWithChildren } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { AppIcon, type AppIconName } from "@/components/ui/icons";
import { QuickActionCard } from "@/components/ui/imperia";

type QuickLink = { href: string; label: string; subtitle: string; icon: AppIconName; tone: "primary" | "pink" | "orange"; matches: (pathname: string) => boolean };
const cosmetologyQuickLinks: QuickLink[] = [
  { href: "/cosmetology", label: "Кабинет", subtitle: "Мой кабинет", icon: "home", tone: "primary", matches: (pathname) => pathname === "/cosmetology" },
  { href: "/cosmetology/clients", label: "Клиенты", subtitle: "Мои люди", icon: "clients", tone: "orange", matches: (pathname) => pathname.startsWith("/cosmetology/clients") },
  { href: "/cosmetology/visits", label: "Календарь", subtitle: "Моё время", icon: "calendar", tone: "pink", matches: (pathname) => pathname.startsWith("/cosmetology/visits") },
  { href: "/cosmetology/inventory", label: "Препараты", subtitle: "Остатки и закупки", icon: "feed", tone: "orange", matches: (pathname) => pathname.startsWith("/cosmetology/inventory") },
];
const imperiaQuickLinks: QuickLink[] = [
  { href: "/cosmetology/clients", label: "Клиенты", subtitle: "Мои люди", icon: "clients", tone: "orange", matches: (pathname) => pathname.startsWith("/cosmetology/clients") },
  { href: "/projects", label: "Проекты", subtitle: "Развитие", icon: "briefcase", tone: "primary", matches: (pathname) => pathname.startsWith("/projects") },
  { href: "/cosmetology/visits", label: "Календарь", subtitle: "Моё время", icon: "calendar", tone: "pink", matches: (pathname) => pathname.startsWith("/cosmetology/visits") },
  { href: "/safe", label: "Сейф", subtitle: "Деньги и распределение", icon: "cash", tone: "orange", matches: (pathname) => pathname.startsWith("/safe") },
];

export function TopQuickNavigation({ pathname }: { pathname: string }) {
  const links = pathname.startsWith("/cosmetology") ? cosmetologyQuickLinks : imperiaQuickLinks;
  return <nav className="imperia-top-navigation" aria-label={pathname.startsWith("/cosmetology") ? "Разделы косметологии" : "Быстрые разделы IMPERIA"}>{links.map((item) => <QuickActionCard key={item.href} href={item.href} title={item.label} subtitle={item.subtitle} icon={item.icon} tone={item.tone} active={item.matches(pathname)}/>)}</nav>;
}

export function ImperiaAppShell({ children, userName }: PropsWithChildren<{ userName?: string | null }>) {
  const pathname = usePathname();
  const isImperia = pathname === "/projects" || pathname === "/capital" || pathname.startsWith("/capital/") || pathname === "/safe" || pathname.startsWith("/safe/") || pathname === "/analytics" || pathname.startsWith("/analytics/") || pathname === "/money" || pathname.startsWith("/money/") || pathname === "/family" || pathname.startsWith("/family/") || pathname === "/cosmetology" || pathname.startsWith("/cosmetology/");
  if (!isImperia) return children;
  const isClientProfile = /^\/cosmetology\/clients\/[^/]+$/.test(pathname);
  const isNewClient = pathname === "/cosmetology/clients/new";

  const initial = (userName?.trim().charAt(0) || "F").toLocaleUpperCase("ru-RU");
  return <div className={`imperia-shell${isClientProfile ? " imperia-client-profile-shell" : ""}${isNewClient ? " imperia-new-client-shell" : ""}`}>
    {!isClientProfile && <header className="imperia-app-header">
      <Link href="/family" className="imperia-brand" aria-label="FEVORA IMPERIA — Дом"><span className="imperia-crown"><img className="imperia-crown-logo" src="/icons/fevora-crown-512.png" alt=""/></span><span><b>FEVORA <em>IMPERIA</em></b><small>Больше, чем бизнес. Это ты.</small></span></Link>
      <div className="imperia-profile-tools"><span className="imperia-notification" aria-label="Уведомления"><AppIcon name="bell"/><i/></span><Link href="/family/settings" className="imperia-avatar" aria-label="Открыть настройки профиля">{initial}</Link></div>
    </header>}
    {!isClientProfile && <TopQuickNavigation pathname={pathname}/>}
    <div className="imperia-screen-content">{children}</div>
  </div>;
}
