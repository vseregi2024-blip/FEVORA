import Link from "next/link";

import { requireUser } from "@/server/auth";
import { getFeedWorkspace } from "@/server/poultry";

const tabs = [["all", "Все"], ["grain", "Зерно"], ["compound", "Комбикорм"], ["additive", "Добавки"]] as const;

function category(type: string | null) {
  if (/grain|зерн|пшениц|кукуруз/i.test(type ?? "")) return "grain";
  if (/supplement|additive|добав|мук|дрож|фосфат|трикальц|бмвд/i.test(type ?? "")) return "additive";
  return "compound";
}

function categoryLabel(type: string | null) { const value = category(type); return value === "grain" ? "Зерно" : value === "additive" ? "Добавки" : "Комбикорм"; }

export default async function FeedStockPage({ searchParams }: { searchParams: Promise<{ category?: string; status?: string }> }) {
  const user = await requireUser();
  const data = await getFeedWorkspace(user.id);
  const query = await searchParams;
  const selected = tabs.some(([value]) => value === query.category) ? query.category ?? "all" : "all";
  const rows = data.inventory.filter((item) => (selected === "all" || category(item.product.type) === selected) && (query.status !== "low" || item.current <= Number(item.product.minimumStockKg))).sort((a, b) => Number(a.current > Number(a.product.minimumStockKg)) - Number(b.current > Number(b.product.minimumStockKg)) || a.product.name.localeCompare(b.product.name, "ru"));

  return <>
    <header className="page-header compact-page-header"><div><p className="eyebrow">Корм</p><h1>Склад кормов</h1><p className="muted">Расчёт по покупкам, использованию и корректировкам</p></div><Link href="/poultry/feed" className="button secondary">Корм</Link></header>
    <nav className="chip-tabs">{tabs.map(([value, label]) => <Link key={value} href={value === "all" ? "/poultry/feed/stock" : `/poultry/feed/stock?category=${value}`} className={selected === value ? "active" : ""}>{label}</Link>)}</nav>
    <div className="mobile-table" role="table" aria-label="Остатки кормов"><div className="mobile-table-head" role="row"><b>Наименование</b><b>Остаток</b><b>Статус</b></div>{rows.map((item) => { const low = item.current <= Number(item.product.minimumStockKg); return <Link href={`/poultry/feed/stock/${item.product.id}`} className="mobile-table-row" role="row" key={item.product.id}><span><b>{item.product.name}</b><small>{categoryLabel(item.product.type)}</small></span><strong>{item.current.toFixed(1)} кг</strong><span className={`status-badge ${low ? "warning" : "success"}`}>{low ? "Мало" : "В наличии"}</span></Link>; })}</div>
  </>;
}
