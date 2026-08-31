"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { AppIcon, type AppIconName } from "@/components/ui/icons";

const globalLinks: Array<[string, string, AppIconName]> = [["/dashboard", "Главная", "home"], ["/projects", "Проекты", "projects"], ["/add", "Добавить", "add"], ["/reports", "Отчёты", "reports"], ["/settings", "Настройки", "settings"]];
const familyLinks: Array<[string, string, AppIconName]> = [["/family", "Обзор", "home"], ["/family/operations", "Операции", "operations"], ["#family-actions", "Добавить", "add"], ["/family/savings", "Накопления", "savings"], ["/family/analytics", "Аналитика", "analytics"]];
const poultryLinks: Array<[string, string, AppIconName]> = [["/poultry", "Обзор", "home"], ["/poultry/flock", "Птица", "flock"], ["#poultry-actions", "Добавить", "add"], ["/poultry/feed", "Корм", "feed"], ["/poultry/analytics", "Аналитика", "analytics"]];
const poultryActions: Array<[string,string,AppIconName]> = [["/poultry/eggs?returnTo=%2Fpoultry#collect","Яйца","incubation"],["/poultry/feed?returnTo=%2Fpoultry#assign-feed","Кормление","feed"],["/poultry/incubation?returnTo=%2Fpoultry#new","Инкубация","incubation"],["/poultry/flock?returnTo=%2Fpoultry#new-batch","Добавить птицу","flock"],["/poultry/flock?returnTo=%2Fpoultry#transfer","Перевести","operations"],["/poultry/flock?returnTo=%2Fpoultry#movement","Падёж","expense"],["/poultry/flock?returnTo=%2Fpoultry#slaughter","Забой","flock"],["/poultry/sales?returnTo=%2Fpoultry","Продажа","sales"],["/poultry/expenses?returnTo=%2Fpoultry#new","Расход","money"]];

export function MobileBottomNavigation() {
  const pathname = usePathname(); const router = useRouter();
  const inFamily = pathname.startsWith("/family"); const inPoultry = pathname.startsWith("/poultry"); const contextual = inFamily || inPoultry;
  const [open, setOpen] = useState(false);
  useEffect(() => { if (!open) return; const close = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false); window.addEventListener("keydown", close); return () => window.removeEventListener("keydown", close); }, [open]);
  const links = inFamily ? familyLinks : inPoultry ? poultryLinks : globalLinks;
  const navLabel = inFamily ? "Навигация проекта Дом" : inPoultry ? "Навигация Птицеводства" : "Основная навигация";
  return <>
    <nav className={`bottom-nav ${contextual ? "family-bottom-nav" : ""}`} aria-label={navLabel}>{links.map(([href,label,icon],index)=>index===2 ? <button type="button" key={href} className="nav-add" aria-label={contextual ? `Добавить в ${inFamily ? "Дом" : "Птицеводство"}` : "Добавить"} aria-expanded={contextual ? open : undefined} onClick={()=>contextual ? setOpen(true) : router.push("/add")}><AppIcon name={icon}/><span>{label}</span></button> : <Link href={href} key={href} aria-current={pathname===href || (href!=="/family" && href!=="/poultry" && pathname.startsWith(`${href}/`)) ? "page" : undefined}><AppIcon name={icon}/><span>{label}</span></Link>)}</nav>
    {inFamily && open && <div className="family-sheet-backdrop" onMouseDown={()=>setOpen(false)}><section className="family-action-sheet" role="dialog" aria-modal="true" onMouseDown={(event)=>event.stopPropagation()}><div className="sheet-handle"/><div className="sheet-heading"><div><p className="eyebrow">Быстрое действие</p><h2>Добавить в Дом</h2></div><button type="button" className="sheet-close" onClick={()=>setOpen(false)} aria-label="Закрыть">×</button></div><div className="sheet-primary-actions"><Link href="/family/new?type=EXPENSE" onClick={()=>setOpen(false)} className="sheet-action expense-action"><AppIcon name="expense"/><span><b>Расход</b><small>Сумма и категория</small></span></Link><Link href="/family/new?type=INCOME" onClick={()=>setOpen(false)} className="sheet-action income-action"><AppIcon name="money"/><span><b>Доход</b><small>Пополнение бюджета</small></span></Link></div><div className="sheet-secondary-actions"><Link href="/family/receipts/new" onClick={()=>setOpen(false)}>Разделить чек</Link><Link href="/family/recurring" onClick={()=>setOpen(false)}>Обязательный платёж</Link></div></section></div>}
    {inPoultry && open && <div className="family-sheet-backdrop" onMouseDown={()=>setOpen(false)}><section className="family-action-sheet poultry-action-sheet" role="dialog" aria-modal="true" onMouseDown={(event)=>event.stopPropagation()}><div className="sheet-handle"/><div className="sheet-heading"><div><p className="eyebrow">Быстрое действие</p><h2>Птицеводство</h2></div><button type="button" className="sheet-close" onClick={()=>setOpen(false)} aria-label="Закрыть">×</button></div><div className="poultry-sheet-grid">{poultryActions.map(([href,label,icon])=><Link href={href} key={href} onClick={()=>setOpen(false)}><AppIcon name={icon}/><span>{label}</span></Link>)}</div></section></div>}
  </>;
}
