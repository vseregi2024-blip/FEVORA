import Link from "next/link";

import { AppIcon } from "@/components/ui/icons";
import { SectionHeader } from "@/components/ui/section-header";
import { formatMoney } from "@/lib/money";
import { requireUser } from "@/server/auth";
import { getPoultryDashboard } from "@/server/poultry";

const sections = [["/poultry/flock", "flock", "Птица", "Группы и движения"], ["/poultry/feed", "feed", "Корм", "Склад и нормы"], ["/poultry/eggs", "incubation", "Яйца", "Сбор и продажи"], ["/poultry/incubation", "incubation", "Инкубация", "Закладки и вывод"], ["/poultry/sales", "sales", "Продажи", "Птица, тушки, яйца"], ["/poultry/expenses", "expense", "Расходы", "Добавки и содержание"]] as const;

export default async function PoultryPage() {
  const user = await requireUser();
  const { report, batches, inventory, incubations, sales, eggs, slaughters } = await getPoultryDashboard(user.id, "MONTH");
  const active = batches.filter((batch) => batch.status === "ACTIVE");
  const headcount = active.reduce((sum, batch) => sum + batch.currentQuantity, 0);
  const byType = [...new Map(active.map((batch) => [batch.birdType, 0])).keys()].map((type) => ({ type, quantity: active.filter((batch) => batch.birdType === type).reduce((sum, batch) => sum + batch.currentQuantity, 0) }));
  const activeIncubations = incubations.filter((item) => item.status === "ACTIVE");
  return <>
    <header className="page-header"><div><p className="eyebrow">Проект</p><h1>Птицеводство</h1><p className="muted">Состояние домашнего хозяйства сейчас.</p></div><Link href="/poultry/flock#new-batch" className="button primary">＋</Link></header>

    <section className="balance-card poultry-flock-hero"><p>Поголовье сейчас</p><strong>{headcount} голов</strong><div className="poultry-type-summary">{byType.map((item) => <span key={item.type}>{item.type} <b>{item.quantity}</b></span>)}</div></section>

    <SectionHeader eyebrow="Корм" title="Расчётный запас" action={<Link href="/poultry/feed" className="text-link">Открыть склад</Link>} />
    <div className="transaction-list">{inventory.slice(0,4).map((item) => <article className="transaction-row" key={item.product.id}><span><b>{item.product.name}</b><small>использовано ≈{(item.manual+item.estimated).toFixed(1)} кг</small></span><strong>≈{Math.max(item.current,0).toFixed(1)} кг</strong></article>)}{!inventory.length && <p className="empty">Покупок корма пока нет.</p>}</div>

    <SectionHeader eyebrow="Сейчас" title="Что происходит" />
    <section className="poultry-now-grid">{active.slice(0,4).map((batch) => <Link href={`/poultry/flock/${batch.id}`} className="app-card" key={batch.id}><b>{batch.name}</b><strong>{batch.currentQuantity} гол.</strong><small>{batch.ageDays} дн. · себестоимость ≈{batch.currentQuantity ? formatMoney((batch.productionCost.total/batch.currentQuantity).toFixed(2)) : "—"}/гол.</small></Link>)}{activeIncubations.map((item) => <Link href={`/poultry/incubation/${item.id}`} className="app-card" key={item.id}><b>{item.name}</b><strong>{item.items.reduce((sum,row)=>sum+row.setQuantity,0)} яиц</strong><small>Инкубация идёт</small></Link>)}</section>

    <SectionHeader eyebrow="Разделы" title="Что нужно сделать?" />
    <section className="poultry-section-grid">{sections.map(([href, icon, title, description]) => <Link href={href} key={href} className="poultry-section-card"><AppIcon name={icon}/><b>{title}</b><span>{description}</span></Link>)}</section>

    <SectionHeader eyebrow="Этот месяц" title="Коротко" action={<Link href="/poultry/analytics" className="text-link">Аналитика →</Link>} />
    <section className="metric-grid poultry-summary"><article><span>Расходы</span><strong className="expense">{formatMoney(report.expense)}</strong></article><article><span>Продажи</span><strong className="income">{formatMoney(report.income)}</strong></article><article><span>Продано птицы</span><strong>{sales.filter((sale)=>sale.saleType === "LIVE_BIRD").reduce((sum,sale)=>sum+(sale.quantity??0),0)}</strong></article><article><span>Яйца / семья</span><strong>{eggs.reduce((sum,item)=>sum+item.quantity,0)} / {slaughters.filter((item)=>item.purpose === "FAMILY").reduce((sum,item)=>sum+item.quantity,0)}</strong></article></section>
  </>;
}
