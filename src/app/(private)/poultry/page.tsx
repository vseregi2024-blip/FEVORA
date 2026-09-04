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
  const { report, batches, inventory, eggs, incubations } = await getPoultryDashboard(user.id, "MONTH");
  const active = batches.filter((batch) => batch.status === "ACTIVE");
  const headcount = active.reduce((sum, batch) => sum + batch.currentQuantity, 0);
  const today = new Date().toISOString().slice(0, 10);
  const collectedToday = eggs.filter((item) => item.operationDate.toISOString().slice(0, 10) === today).reduce((sum, item) => sum + item.quantity, 0);
  const lowStock = inventory.filter((item) => item.current <= Number(item.product.minimumStockKg));
  const activeIncubations = incubations.filter((item) => item.status === "ACTIVE");
  const attention = lowStock.length ? `${lowStock.length} поз. корма заканчиваются` : null;
  const feedPreview = [...inventory].sort((a, b) => b.current - a.current).slice(0, 3);

  return <>
    <header className="page-header compact-page-header"><div><p className="eyebrow">Сегодня</p><h1>Птицеводство</h1><p className="muted">{new Date().toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })}</p></div><Link href="/poultry/settings" className="poultry-settings-button" aria-label="Настройки птицеводства" title="Настройки">⚙</Link></header>
    <Link href="/poultry/flock" className="balance-card compact-flock-hero"><span>Поголовье сейчас</span><strong>{headcount} голов</strong><p>{active.length} активных групп · открыть птицу →</p></Link>
    <section className="compact-section"><h2>Главное</h2><div className="metric-grid daily-metrics"><article><span>Яиц сегодня</span><strong>{collectedToday}</strong></article><article><span>Продажи за месяц</span><strong className="income">{formatMoney(report.income)}</strong></article><article><span>Инкубации</span><strong>{activeIncubations.length}</strong></article></div></section>
    <section className="compact-section"><div className="compact-section-heading"><h2>Остатки корма</h2><Link href="/poultry/feed/stock" className="text-link">Все →</Link></div>{feedPreview.length ? <div className="overview-feed-list">{feedPreview.map((item) => <Link href={`/poultry/feed/stock/${item.product.id}`} key={item.product.id}><span>{item.product.name}</span><strong>{item.current.toFixed(1)} кг</strong></Link>)}</div> : <Link href="/poultry/feed#buy-feed" className="attention-row">Добавить первый корм →</Link>}</section>
    <section className="compact-section"><h2>Быстрые действия</h2><div className="quick-grid four-actions">{quickActions.map(([href, icon, label]) => <Link href={href} className="quick-action" key={href}><AppIcon name={icon}/><span>{label}</span></Link>)}</div></section>
    <section className="compact-section"><h2>Требует внимания</h2><Link href={attention ? "/poultry/feed/stock?status=low" : activeIncubations.length ? "/poultry/incubation" : "/poultry"} className={`attention-row ${attention ? "warning" : "success"}`}><span>{attention ? "!" : "✓"}</span><b>{attention ?? (activeIncubations.length ? `${activeIncubations.length} активн. инкубаций · открыть` : "Всё в порядке")}</b></Link></section>
  </>;
}
