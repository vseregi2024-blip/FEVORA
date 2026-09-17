"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { AppIcon, type AppIconName } from "@/components/ui/icons";
import { useFamilyTheme } from "@/components/family-theme-toggle";
import { FamilyVoiceEntry } from "@/components/family-voice-entry";

const globalLinks: Array<[string, string, AppIconName]> = [["/dashboard", "Главная", "home"], ["/projects", "Проекты", "projects"], ["/add", "Добавить", "add"], ["/reports", "Отчёты", "reports"], ["/settings", "Настройки", "settings"]];
const imperiaLinks: Array<[string, string, AppIconName]> = [["/family", "Касса", "home"], ["/cosmetology/clients", "Клиенты", "projects"], ["#imperia-actions", "Добавить", "add"], ["/family/analytics", "Финансы", "analytics"], ["/family/settings", "Настройки", "settings"]];
const poultryLinks: Array<[string, string, AppIconName]> = [["/poultry", "Обзор", "home"], ["/poultry/flock", "Птица", "flock"], ["#poultry-actions", "Добавить", "add"], ["/poultry/feed", "Корм", "feed"], ["/poultry/analytics", "Аналитика", "analytics"]];
const poultryActions: Array<[string,string,AppIconName]> = [["/poultry/eggs?returnTo=%2Fpoultry#collect","Сбор яиц","incubation"],["/poultry/sales?returnTo=%2Fpoultry#new-sale","Продажа","sales"],["/poultry/expenses?returnTo=%2Fpoultry#new","Расход","money"],["/poultry/feed?returnTo=%2Fpoultry#buy-feed","Покупка корма","feed"],["/poultry/feed?returnTo=%2Fpoultry#assign-feed","Использование корма","feed"],["/poultry/flock?returnTo=%2Fpoultry#movement","Событие птицы","flock"],["/poultry/incubation?returnTo=%2Fpoultry#new","Новая инкубация","incubation"]];

export function MobileBottomNavigation() {
  const pathname = usePathname(); const router = useRouter();
  const inFamily = pathname.startsWith("/family"); const inCosmetology = pathname.startsWith("/cosmetology"); const inImperia = inFamily || inCosmetology; const inPoultry = pathname.startsWith("/poultry"); const contextual = inImperia || inPoultry;
  useFamilyTheme();
  const [open, setOpen] = useState(false);
  useEffect(() => { if (!open) return; const close = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false); window.addEventListener("keydown", close); return () => window.removeEventListener("keydown", close); }, [open]);
  const links = inImperia ? imperiaLinks : inPoultry ? poultryLinks : globalLinks;
  const navLabel = inImperia ? "Навигация IMPERIA" : inPoultry ? "Навигация Птицеводства" : "Основная навигация";
  return <>
    <nav className={`bottom-nav ${contextual ? "family-bottom-nav" : ""}`} aria-label={navLabel}>{links.map(([href,label,icon],index)=>index===2 ? <button type="button" key={href} className="nav-add" aria-label={inImperia ? "Добавить в IMPERIA" : inPoultry ? "Добавить в Птицеводство" : "Добавить"} aria-expanded={contextual ? open : undefined} onClick={()=>contextual ? setOpen(true) : router.push("/add")}><AppIcon name={icon}/><span>{label}</span></button> : <Link href={href} key={href} aria-current={pathname===href || (href !== "/family" && pathname.startsWith(`${href}/`)) ? "page" : undefined}><AppIcon name={icon}/><span>{label}</span></Link>)}</nav>
    {inFamily && <FamilyVoiceEntry/>}
    {inImperia && open && <div className="family-sheet-backdrop" onMouseDown={()=>setOpen(false)}><section className="family-action-sheet" role="dialog" aria-modal="true" aria-label="Добавить в IMPERIA" onMouseDown={(event)=>event.stopPropagation()}><div className="sheet-handle"/><div className="sheet-heading"><div><p className="eyebrow">FEVORA · IMPERIA</p><h2>Что добавить?</h2></div><button type="button" className="sheet-close" onClick={()=>setOpen(false)} aria-label="Закрыть">×</button></div><div className="sheet-primary-actions"><Link href="/cosmetology/visits" onClick={()=>setOpen(false)} className="sheet-action income-action"><AppIcon name="sales"/><span><b>Запись клиента</b><small>Услуга, дата и оплата</small></span></Link><Link href="/family/new?type=EXPENSE" onClick={()=>setOpen(false)} className="sheet-action expense-action"><AppIcon name="expense"/><span><b>Расход</b><small>Покупка или платёж</small></span></Link></div><div className="sheet-secondary-actions"><Link href="/cosmetology/clients/new" onClick={()=>setOpen(false)}><AppIcon name="projects"/><span>Новый клиент</span></Link><Link href="/family/new?type=INCOME" onClick={()=>setOpen(false)}><AppIcon name="money"/><span>Другой доход</span></Link><Link href="/family/receipts/new" onClick={()=>setOpen(false)}><AppIcon name="operations"/><span>Разделить чек</span></Link><Link href="/family/recurring/new" onClick={()=>setOpen(false)}><AppIcon name="reports"/><span>Обязательный платёж</span></Link></div></section></div>}
    {inPoultry && open && <div className="family-sheet-backdrop" onMouseDown={()=>setOpen(false)}><section className="family-action-sheet poultry-action-sheet" role="dialog" aria-modal="true" onMouseDown={(event)=>event.stopPropagation()}><div className="sheet-handle"/><div className="sheet-heading"><div><p className="eyebrow">Быстрое действие</p><h2>Птицеводство</h2></div><button type="button" className="sheet-close" onClick={()=>setOpen(false)} aria-label="Закрыть">×</button></div><div className="poultry-sheet-grid">{poultryActions.map(([href,label,icon])=><Link href={href} key={href} onClick={()=>setOpen(false)}><AppIcon name={icon}/><span>{label}</span></Link>)}</div></section></div>}
  </>;
}
