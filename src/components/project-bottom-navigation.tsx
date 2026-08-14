"use client";

import Link from "next/link";
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
      { href: "/poultry", label: "Главная", icon: "home" },
      { href: "/poultry/flock", label: "Птица", icon: "flock" },
      { href: "/poultry/sales", label: "Добавить", icon: "add", isAdd: true },
      { href: "/poultry/feed", label: "Корма", icon: "feed" },
      { href: "/reports?project=poultry", label: "Финансы", icon: "reports" },
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

  return <nav className="bottom-nav" aria-label={navigation.label}>{navigation.links.map((link) => {
    const active = isActive(pathname, link.href, link.isAdd);
    return <Link href={link.href} key={`${link.href}-${link.label}`} className={link.isAdd ? "nav-add" : ""} style={active ? { color: "var(--sage)" } : undefined}><AppIcon name={link.icon}/><span>{link.label}</span></Link>;
  })}</nav>;
}
