import Link from "next/link";

import { formatMoney } from "@/lib/money";
import { AppIcon, type AppIconName } from "@/components/ui/icons";
import { IconCircle } from "@/components/ui/imperia";

type MonetaryMethod = "CASH" | "MONOBANK" | "PRIVATBANK" | "OTHER";
type CashComponent = { id: string; amount: { toString(): string }; method: string; comment: string | null; operationDate: Date; payment: { visit: { id: string; procedureName: string; client: { displayName: string | null; firstName: string; lastName: string } } } };
const methods: Array<{ id: MonetaryMethod; label: string; short: string; icon: AppIconName; tone: string }> = [
  { id: "CASH", label: "Наличные", short: "₴", icon: "cash", tone: "orange" },
  { id: "MONOBANK", label: "Monobank", short: "mono", icon: "cash", tone: "primary" },
  { id: "PRIVATBANK", label: "ПриватБанк", short: "П", icon: "cash", tone: "success" },
  { id: "OTHER", label: "Прочее", short: "•••", icon: "operations", tone: "primary" },
];
const methodLabels = Object.fromEntries(methods.map((item) => [item.id, item.label])) as Record<MonetaryMethod, string>;

function dateLabel(from: string, to: string) {
  if (from === to) return new Date(`${from}T12:00:00`).toLocaleDateString("ru-RU", { day: "numeric", month: "long", weekday: "short" });
  return `${new Date(`${from}T12:00:00`).toLocaleDateString("ru-RU")} — ${new Date(`${to}T12:00:00`).toLocaleDateString("ru-RU")}`;
}

export function ImperiaCash({ data, filter, preset }: { data: { total: string; totals: Record<MonetaryMethod, string>; certificateTotal: string; bonusTotal: string; balanced: boolean; components: CashComponent[] }; filter: { from: string; to: string; method: "ALL" | MonetaryMethod }; preset?: string }) {
  const range = `from=${filter.from}&to=${filter.to}`;
  const total = Number(data.total);
  const average = data.components.length ? total / data.components.length : 0;
  const bars = data.components.slice(0, 16).reverse().map((component) => Number(component.amount.toString()));
  const maxBar = Math.max(...bars, 1);
  return <div className="imperia-cash-page">
    {!data.balanced && <p className="form-error">Внимание: сумма способов оплаты не сходится с общей суммой.</p>}

    <section className="imperia-cash-hero">
      <div className="imperia-cash-title"><AppIcon name="calendar"/><span><b>{filter.from === filter.to ? "Сегодня" : "Выбранный период"}</b><small>{dateLabel(filter.from, filter.to)}</small></span></div>
      <IconCircle icon="cash" tone="primary" size="large"/>
      <div className="imperia-cash-total"><small>Поступления</small><strong>{formatMoney(data.total)}</strong><span>{data.components.length ? `${data.components.length} ${data.components.length === 1 ? "операция" : "операций"}` : "Денежных операций пока нет"}</span></div>
      <div className="imperia-cash-hero-stats"><span><small>Наличные</small><b>{formatMoney(data.totals.CASH)}</b></span><span><small>Безналичные</small><b>{formatMoney((Number(data.totals.MONOBANK) + Number(data.totals.PRIVATBANK) + Number(data.totals.OTHER)).toFixed(2))}</b></span></div>
      <Link href="/cosmetology/analytics" aria-label="Открыть аналитику"><AppIcon name="arrow"/></Link>
    </section>

    <section className="imperia-cash-wallets" aria-label="Денежные способы оплаты">{methods.map((method) => <Link href={`/cosmetology/cash?${range}&method=${method.id}`} key={method.id} className={filter.method === method.id ? "is-active" : ""}>
      <span className={`imperia-cash-method tone-${method.tone}`}>{method.short}</span><small>{method.label}</small><strong>{formatMoney(data.totals[method.id])}</strong><AppIcon name="arrow"/>
    </Link>)}</section>

    <section className="imperia-cash-revenue">
      <header><div><AppIcon name="analytics"/><span><h2>Выручка за день</h2><small>Поступления по операциям</small></span></div><span>{filter.from === filter.to ? "Сегодня" : "Период"}</span></header>
      <div className="imperia-cash-chart" aria-label="График выручки">{bars.length ? bars.map((amount, index) => <i key={`${amount}-${index}`} style={{ height: `${Math.max(8, (amount / maxBar) * 100)}%` }} title={formatMoney(amount.toFixed(2))}/>) : <p>Поступлений пока нет</p>}</div>
      <aside><span><small>Всего</small><b>{formatMoney(data.total)}</b></span><span><small>Средний чек</small><b>{formatMoney(average.toFixed(2))}</b></span><span><small>Транзакций</small><b>{data.components.length}</b></span></aside>
    </section>

    <section className="imperia-cash-filters">
      <nav aria-label="Быстрый период"><Link className={!preset && filter.from === filter.to ? "active" : ""} href="/cosmetology/cash">Сегодня</Link><Link className={preset === "yesterday" ? "active" : ""} href="/cosmetology/cash?preset=yesterday">Вчера</Link></nav>
      <details><summary>Другой период <AppIcon name="arrow"/></summary><form action="/cosmetology/cash" className="compact-form"><div className="form-grid"><label>Дата от<input type="date" name="from" required defaultValue={filter.from}/></label><label>Дата до<input type="date" name="to" required defaultValue={filter.to}/></label></div><label>Способ оплаты<select name="method" defaultValue={filter.method}><option value="ALL">Все</option>{methods.map((method) => <option key={method.id} value={method.id}>{method.label}</option>)}</select></label><button className="button primary">Показать</button></form></details>
    </section>

    <section className="imperia-cash-operations"><header><div><AppIcon name="operations"/><h2>Последние операции</h2></div><strong>{formatMoney(data.total)}</strong></header>{data.components.length ? <div>{data.components.map((component) => { const visit = component.payment.visit; const client = visit.client.displayName ?? `${visit.client.lastName} ${visit.client.firstName}`; return <Link href={`/cosmetology/visits/${visit.id}`} key={component.id}><IconCircle icon="clients" tone="success"/><span><b>{client}</b><small>{visit.procedureName}</small><em>{methodLabels[component.method as MonetaryMethod]}{component.comment ? ` · ${component.comment}` : ""}</em></span><strong>+{formatMoney(component.amount.toString())}<small>{component.operationDate.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</small></strong><AppIcon name="arrow"/></Link>; })}</div> : <p className="imperia-cash-empty">За выбранный период денежных поступлений нет.</p>}</section>
  </div>;
}
