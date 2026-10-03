import Link from "next/link";

import { AppIcon } from "@/components/ui/icons";
import { IconCircle } from "@/components/ui/imperia";

type Envelope = { id: string; name: string; current: string; target: string | null; progress: number | null };
type Category = { name: string; amount: string; percent: number };
const periodLabels = { MONTH: "Этот месяц", THREE_MONTHS: "3 месяца", YEAR: "Этот год", CUSTOM: "Период" } as const;

export function ImperiaHome({ balance, income, expense, result, envelopes, goalProgress, categories, period, notice }: { balance: string; income: string; expense: string; result: string; envelopes: Envelope[]; goalProgress: number; categories: Category[]; period: keyof typeof periodLabels; notice?: string | null }) {
  const featuredEnvelope = envelopes[0] ?? null;
  const chartItems = categories.slice(0, 8);
  const analyticsHref = `/family/analytics?period=${period === "CUSTOM" ? "MONTH" : period}`;

  return <div className="imperia-home">
    {notice && <p className="imperia-home-notice">{notice}</p>}

    <Link href="/money" className="imperia-home-capital" aria-label={`Капитал: ${balance}. Открыть управление деньгами`}>
      <IconCircle icon="cash" tone="primary" size="large" className="imperia-home-capital-icon"/>
      <div className="imperia-home-capital-copy"><span>Капитал <AppIcon name="arrow"/></span><strong>{balance}</strong></div>
      <div className="imperia-home-capital-insight"><b>{result}</b><span>результат за период</span></div>
      <span className="imperia-home-capital-open"><AppIcon name="arrow"/></span>
      <div className="imperia-home-progress"><i style={{ width: `${goalProgress}%` }}/></div>
      <small className="imperia-home-capital-caption">На пути к финансовой свободе</small><em>{goalProgress}%</em>
    </Link>

    <section className="imperia-home-panel imperia-home-goals">
      <header><IconCircle icon="target" tone="pink" size="large"/><div><h2>Конверты <AppIcon name="arrow"/></h2></div><Link href="/money?project=FAMILY#envelopes">Все конверты <AppIcon name="arrow"/></Link></header>
      {featuredEnvelope ? <Link href={`/money/${featuredEnvelope.id}`} className="imperia-home-goal-row"><span><b>{featuredEnvelope.name}</b>{featuredEnvelope.target && <small>{featuredEnvelope.current} из {featuredEnvelope.target}</small>}</span><div className="imperia-home-progress"><i style={{ width: `${featuredEnvelope.progress ?? 0}%` }}/></div><strong>{featuredEnvelope.progress === null ? featuredEnvelope.current : `${featuredEnvelope.progress}%`}</strong></Link> : <Link href="/money/new?project=FAMILY&kind=ENVELOPE" className="imperia-home-goal-empty"><span><b>Создайте первый конверт</b><small>Резерв и прогресс появятся здесь</small></span><strong>＋</strong></Link>}
    </section>

    <section className="imperia-home-panel imperia-home-analytics">
      <header><Link href={analyticsHref} className="imperia-home-heading" aria-label={`Открыть аналитику: ${periodLabels[period]}`}><AppIcon name="analytics"/><h2>Аналитика <AppIcon name="arrow"/></h2></Link><details><summary>{periodLabels[period]} <AppIcon name="arrow"/></summary><nav><Link href="/family?period=MONTH">Этот месяц</Link><Link href="/family?period=THREE_MONTHS">3 месяца</Link><Link href="/family?period=YEAR">Этот год</Link><Link href={analyticsHref}>Подробнее</Link></nav></details></header>
      <div className="imperia-home-analytics-grid">
        <Link href={analyticsHref} aria-label="Открыть аналитику доходов"><article><IconCircle icon="trendUp" tone="cyan"/><span><small>Доходы</small><strong>{income}</strong><em>за период</em></span></article></Link>
        <Link href={analyticsHref} aria-label="Открыть аналитику расходов"><article><IconCircle icon="trendDown" tone="pink"/><span><small>Расходы</small><strong>{expense}</strong><em>за период</em></span></article></Link>
        <div className="imperia-home-chart" aria-label="Расходы по категориям">
          {chartItems.length ? chartItems.map((item) => <span key={item.name} title={`${item.name}: ${item.amount}`}><i style={{ height: `${Math.max(12, item.percent)}%` }}/><small>{item.name}</small></span>) : <p>За выбранный период расходов нет</p>}
        </div>
      </div>
    </section>

    <section className="imperia-home-idea">
      <IconCircle icon="lightbulb" tone="orange" size="large"/>
      <div><h2>Идея дня</h2><p>Маленькие шаги каждый день создают большую империю.</p></div>
      <div className="imperia-sunrise" aria-hidden="true"><i/><span/><b/></div>
      <em>Развитие<br/>начинается<br/>с тебя</em>
    </section>
  </div>;
}
