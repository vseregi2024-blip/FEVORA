import Link from "next/link";

import { AppIcon } from "@/components/ui/icons";
import { formatMoney } from "@/lib/money";
import { requireUser } from "@/server/auth";
import { getPoultryDashboard } from "@/server/poultry";

const quickActions = [
  ["/poultry/eggs?returnTo=%2Fpoultry#collect", "incubation", "Сбор яиц"],
  ["/poultry/feed?returnTo=%2Fpoultry#assign-feed", "feed", "Расход корма"],
  ["/poultry/sales?returnTo=%2Fpoultry#new-sale", "sales", "Продажа"],
  ["/poultry/flock?returnTo=%2Fpoultry#movement", "flock", "Событие птицы"],
] as const;

export default async function PoultryPage() {
  const user = await requireUser();
  const { report, batches, inventory, eggs } = await getPoultryDashboard(user.id, "TODAY");
  const active = batches.filter((batch) => batch.status === "ACTIVE");
  const headcount = active.reduce((sum, batch) => sum + batch.currentQuantity, 0);
  const collectedToday = eggs.reduce((sum, item) => sum + item.quantity, 0);
  const lowStock = inventory.filter((item) => item.current <= Number(item.product.minimumStockKg));
  const attention = lowStock.length ? `${lowStock.length} поз. корма заканчиваются` : null;

  return <>
    <header className="page-header compact-page-header"><div><p className="eyebrow">Сегодня</p><h1>Птицеводство</h1><p className="muted">{new Date().toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })}</p></div></header>
    <Link href="/poultry/flock" className="balance-card compact-flock-hero"><span>Поголовье сейчас</span><strong>{headcount} голов</strong><p>{active.length} активных групп · открыть птицу →</p></Link>
    <section className="compact-section"><h2>Коротко за сегодня</h2><div className="metric-grid daily-metrics"><article><span>Собрано яиц</span><strong>{collectedToday}</strong></article><article><span>Продажи</span><strong className="income">{formatMoney(report.income)}</strong></article><article><span>Расходы</span><strong className="expense">{formatMoney(report.expense)}</strong></article></div></section>
    <section className="compact-section"><h2>Быстрые действия</h2><div className="quick-grid four-actions">{quickActions.map(([href, icon, label]) => <Link href={href} className="quick-action" key={href}><AppIcon name={icon}/><span>{label}</span></Link>)}</div></section>
    <section className="compact-section"><h2>Требует внимания</h2><Link href={attention ? "/poultry/feed/stock?status=low" : "/poultry"} className={`attention-row ${attention ? "warning" : "success"}`}><span>{attention ? "!" : "✓"}</span><b>{attention ?? "Всё в порядке"}</b></Link></section>
  </>;
}
