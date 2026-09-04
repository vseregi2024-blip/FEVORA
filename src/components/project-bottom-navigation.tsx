"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

import { AppIcon, type AppIconName } from "@/components/ui/icons";

type NavigationLink = {
  href: string;
  label: string;
  icon: AppIconName;
  isAdd?: boolean;
};

type ProjectNavigation = {
  prefix: string;
  label: string;
  links: NavigationLink[];
};

const commonLinks: NavigationLink[] = [
  { href: "/dashboard", label: "Главная", icon: "home" },
  { href: "/projects", label: "Проекты", icon: "projects" },
  { href: "/add", label: "Добавить", icon: "add", isAdd: true },
  { href: "/reports", label: "Отчёты", icon: "reports" },
  { href: "/settings", label: "Настройки", icon: "settings" },
];

const projectNavigations: ProjectNavigation[] = [
  {
    prefix: "/cosmetology",
    label: "Навигация косметологии",
    links: [
      { href: "/cosmetology", label: "Главная", icon: "home" },
      { href: "/cosmetology/visits", label: "Записи", icon: "sales" },
      { href: "/cosmetology/visits", label: "Добавить", icon: "add", isAdd: true },
      { href: "/cosmetology/clients", label: "Клиенты", icon: "projects" },
      { href: "/cosmetology/inventory", label: "Товары", icon: "feed" },
    ],
  },
  {
    prefix: "/poultry",
    label: "Навигация птицеводства",
    links: [
      { href: "/poultry", label: "Обзор", icon: "home" },
      { href: "/poultry/flock", label: "Птица", icon: "flock" },
      { href: "/poultry/sales", label: "Добавить", icon: "add", isAdd: true },
      { href: "/poultry/feed", label: "Корм", icon: "feed" },
      { href: "/poultry/analytics", label: "Аналитика", icon: "analytics" },
    ],
  },
  {
    prefix: "/goods",
    label: "Навигация товарки",
    links: [
      { href: "/goods", label: "Главная", icon: "home" },
      { href: "/goods/inventory", label: "Склад", icon: "feed" },
      { href: "/goods/inventory", label: "Добавить", icon: "add", isAdd: true },
      { href: "/goods/sales", label: "Продажи", icon: "sales" },
      { href: "/reports?project=goods", label: "Финансы", icon: "reports" },
    ],
  },
  {
    prefix: "/infobusiness",
    label: "Навигация инфобизнеса",
    links: [
      { href: "/infobusiness", label: "Главная", icon: "home" },
      { href: "/infobusiness/products", label: "Курсы", icon: "projects" },
      { href: "/infobusiness/sales", label: "Добавить", icon: "add", isAdd: true },
      { href: "/infobusiness/expenses", label: "Расходы", icon: "expense" },
      { href: "/infobusiness/analytics", label: "Аналитика", icon: "reports" },
    ],
  },
  {
    prefix: "/family",
    label: "Навигация семейных финансов",
    links: [
      { href: "/family", label: "Главная", icon: "home" },
      { href: "/family?period=TODAY", label: "Сегодня", icon: "money" },
      { href: "/family", label: "Добавить", icon: "add", isAdd: true },
      { href: "/finance?module=FAMILY", label: "История", icon: "reports" },
      { href: "/family?period=YEAR", label: "Итоги", icon: "projects" },
    ],
  },
];

function isActive(pathname: string, href: string, isAdd?: boolean) {
  if (isAdd) return false;
  const hrefPath = href.split("?")[0];
  return pathname === hrefPath || (hrefPath !== "/" && pathname.startsWith(`${hrefPath}/`));
}

export function ProjectBottomNavigation() {
  const pathname = usePathname();
  const projectNavigation = projectNavigations.find(({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  const navigation = projectNavigation ?? { label: "Основная навигация", links: commonLinks };
  const inPoultry = pathname === "/poultry" || pathname.startsWith("/poultry/");
  const [poultryMenuOpen, setPoultryMenuOpen] = useState(false);
  const poultryActions: NavigationLink[] = [
    { href: "/poultry/eggs?returnTo=%2Fpoultry#collect", label: "Яйца", icon: "incubation" },
    { href: "/poultry/feed?returnTo=%2Fpoultry#assign-feed", label: "Корм", icon: "feed" },
    { href: "/poultry/incubation?returnTo=%2Fpoultry#new", label: "Инкубацию", icon: "incubation" },
    { href: "/poultry/flock?returnTo=%2Fpoultry#new-batch", label: "Птицу", icon: "flock" },
    { href: "/poultry/flock?returnTo=%2Fpoultry#transfer", label: "Перевод", icon: "operations" },
    { href: "/poultry/flock?returnTo=%2Fpoultry#movement", label: "Падёж", icon: "expense" },
    { href: "/poultry/flock?returnTo=%2Fpoultry#slaughter", label: "Забой", icon: "flock" },
    { href: "/poultry/sales?returnTo=%2Fpoultry#new-sale", label: "Продажу", icon: "sales" },
    { href: "/poultry/expenses?returnTo=%2Fpoultry#new", label: "Расход", icon: "money" },
  ];

  return <><nav className="bottom-nav" aria-label={navigation.label}>{navigation.links.map((link) => {
    const active = isActive(pathname, link.href, link.isAdd);
    if (link.isAdd && inPoultry) return <button type="button" key={`${link.href}-${link.label}`} className="nav-add" aria-label="Добавить в Птицеводство" aria-expanded={poultryMenuOpen} onClick={() => setPoultryMenuOpen(true)}><AppIcon name={link.icon}/><span>Добавить</span></button>;
    return <Link href={link.href} key={`${link.href}-${link.label}`} className={link.isAdd ? "nav-add" : ""} style={active ? { color: "var(--sage)" } : undefined}><AppIcon name={link.icon}/><span>{link.label}</span></Link>;
  })}</nav>{inPoultry && poultryMenuOpen && <div className="family-sheet-backdrop" onMouseDown={() => setPoultryMenuOpen(false)}><section className="family-action-sheet poultry-action-sheet" role="dialog" aria-modal="true" aria-label="Что добавить" onMouseDown={(event) => event.stopPropagation()}><div className="sheet-handle"/><div className="sheet-heading"><div><p className="eyebrow">Быстрое действие</p><h2>Что добавить?</h2></div><button type="button" className="sheet-close" onClick={() => setPoultryMenuOpen(false)} aria-label="Закрыть">×</button></div><div className="poultry-sheet-grid">{poultryActions.map((action, index) => <Link href={action.href} key={action.href} onClick={() => setPoultryMenuOpen(false)} className={index < 3 ? "primary-sheet-action" : ""}><AppIcon name={action.icon}/><span>{action.label}</span></Link>)}</div></section></div>}</>;
}
