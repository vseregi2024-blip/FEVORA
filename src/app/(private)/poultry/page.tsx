import Link from "next/link";

import { AppIcon } from "@/components/ui/icons";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/app-card";
import { formatMoney } from "@/lib/money";
import { requireUser } from "@/server/auth";
import { getPoultryDashboard } from "@/server/poultry";

const periods = { TODAY: "Сегодня", WEEK: "Неделя", MONTH: "Месяц", YEAR: "Год" } as const;
const sections = [
  ["/poultry/flock", "flock", "Поголовье", "Партии и движения"],
  ["/poultry/incubation", "incubation", "Инкубация", "Закладки и вывод"],
  ["/poultry/feed", "feed", "Корма и склад", "Мешки и назначения"],
  ["/poultry/sales", "sales", "Продажи", "Доходы от продаж"],
  ["/poultry/expenses", "expense", "Операционные расходы", "Материалы и содержание"],
  ["/reports?project=poultry", "money", "Финансы", "Отчёт по проекту"],
] as const;

export default async function PoultryPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const params = await searchParams;
  const period = (typeof params.period === "string" && params.period in periods ? params.period : "MONTH") as keyof typeof periods;
  const { report, batches, lots, sales } = await getPoultryDashboard(user.id, period);
  return <><header className="page-header"><div><p className="eyebrow">Проект</p><h1>Птицеводство</h1><p className="muted">Финансы, птица и склад — без двойного учёта.</p></div><Link href="/add" className="button primary">＋</Link></header><form className="period-tabs" action="/poultry">{Object.entries(periods).map(([value, label]) => <button key={value} name="period" value={value} className={period === value ? "active" : ""}>{label}</button>)}</form><section className="metric-grid poultry-summary"><article><span>Доходы</span><strong className="income">{formatMoney(report.income)}</strong></article><article><span>Расходы</span><strong className="expense">{formatMoney(report.expense)}</strong></article><article><span>Результат</span><strong>{formatMoney(report.result)}</strong></article><article><span>Активные партии</span><strong>{batches.filter((batch) => batch.status === "ACTIVE").length}</strong></article></section><SectionHeader eyebrow="Разделы" title="Что нужно сделать?"/><section className="poultry-section-grid">{sections.map(([href, icon, title, description]) => <Link href={href} key={href} className="poultry-section-card"><AppIcon name={icon}/><b>{title}</b><span>{description}</span></Link>)}</section><SectionHeader eyebrow="Сейчас" title="Короткая сводка" action={<Link href="/finance?module=POULTRY" className="text-link">История</Link>}/><section className="family-grid"><article className="app-card"><div className="card-title"><h3>Корм на складе</h3><StatusBadge tone="neutral">Мешки</StatusBadge></div><strong>{lots.reduce((total, lot) => total + lot.availableBags, 0)} меш.</strong><p className="muted">Доступно из {lots.reduce((total, lot) => total + lot.purchasedBags, 0)} купленных.</p><Link href="/poultry/feed" className="text-link">Открыть склад →</Link></article><article className="app-card"><div className="card-title"><h3>Последние продажи</h3><StatusBadge tone="success">{sales.length}</StatusBadge></div>{sales.slice(0, 2).map((sale) => <div className="mini-list" key={sale.id}><div><b>{sale.itemName}</b><span>{sale.operationDate.toLocaleDateString("ru-RU")} · {formatMoney(sale.totalAmount.toString())}</span></div></div>)}{sales.length === 0 && <p className="muted">Продаж пока нет.</p>}<Link href="/poultry/sales" className="text-link">Все продажи →</Link></article></section></>;
}
