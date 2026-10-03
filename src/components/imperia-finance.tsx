import Link from "next/link";

import { AppIcon, type AppIconName } from "@/components/ui/icons";
import { IconCircle } from "@/components/ui/imperia";

type Summary = { currency: string; total: string; free: string; allocated: string };
type ProjectBalance = { code: string; name: string; value: string; active: boolean };
type TransferSummary = { currency: string; incoming: string; outgoing: string };
type LegacySummary = { currency: string; income: string; expense: string; result: string };
type MoneyAccount = { id: string; name: string; subtitle: string; value: string; icon: string; primary?: boolean };

const projectIcons: Record<string, { icon: AppIconName; tone: string }> = {
  FAMILY: { icon: "home", tone: "primary" },
  POULTRY: { icon: "flock", tone: "pink" },
  GOODS: { icon: "sales", tone: "cyan" },
  INFOBUSINESS: { icon: "lightbulb", tone: "primary" },
  COSMETOLOGY: { icon: "sparkles", tone: "pink" },
};

function SummaryValues({ values, empty }: { values: Array<{ currency: string; value: string }>; empty: string }) {
  return <span className="imperia-finance-values">{values.length ? values.map((item) => <strong key={item.currency}>{item.value}</strong>) : <strong>{empty}</strong>}</span>;
}

export function ImperiaFinance({
  projectName,
  defaultValue,
  globalSummaries,
  summaries,
  projectBalances,
  transferSummary,
  legacySummary,
  wallets,
  envelopes,
  archived,
  notice,
  completedTransfer,
}: {
  projectName: string;
  defaultValue: string;
  globalSummaries: Array<{ currency: string; value: string }>;
  summaries: Summary[];
  projectBalances: ProjectBalance[];
  transferSummary: TransferSummary[];
  legacySummary: LegacySummary[];
  wallets: MoneyAccount[];
  envelopes: MoneyAccount[];
  archived: MoneyAccount[];
  notice?: string | null;
  completedTransfer?: { source: string; target: string } | null;
}) {
  const selected = projectBalances.find((project) => project.active);
  return <div className="imperia-finance-page">
    {notice && <p className="notice">{notice}</p>}
    {completedTransfer && <section className="notice money-transfer-success"><b>✓ Перевод выполнен</b><span>{completedTransfer.source}</span><span>{completedTransfer.target}</span></section>}

    <section className="imperia-finance-capital">
      <IconCircle icon="money" tone="primary" size="large"/>
      <div><span>Общий капитал</span><SummaryValues values={globalSummaries} empty={defaultValue}/><small>Все проекты FEVORA IMPERIA</small></div>
      <span className="imperia-finance-crown"><AppIcon name="crown"/><em>Финансовая свобода начинается с порядка.</em></span>
    </section>

    <Link href={`/money/transfer?project=${selected?.code ?? "FAMILY"}`} className="imperia-finance-transfer"><IconCircle icon="operations" tone="primary"/><span><b>Внутренние переводы</b><small>Между проектами и счетами</small></span><em>Перевести <AppIcon name="arrow"/></em></Link>

    <section className="imperia-finance-projects">
      <header><span><AppIcon name="briefcase"/><b>Баланс проектов</b></span><Link href="/projects">Все проекты <AppIcon name="arrow"/></Link></header>
      <div>{projectBalances.map((project) => { const visual = projectIcons[project.code] ?? projectIcons.FAMILY; return <Link href={`/money?project=${project.code}`} className={project.active ? "is-active" : ""} key={project.code}><IconCircle icon={visual.icon} tone={visual.tone as "primary" | "pink" | "orange" | "cyan" | "success"}/><span>{project.name}</span><strong>{project.value}</strong></Link>; })}</div>
    </section>

    <section className="imperia-finance-metrics">
      <article><small>Доступно сейчас</small><IconCircle icon="savings" tone="primary"/><SummaryValues values={summaries.map((item) => ({ currency: item.currency, value: item.free }))} empty={defaultValue}/><em>{projectName}</em></article>
      <article><small>Входящие переводы</small><IconCircle icon="trendUp" tone="success"/><SummaryValues values={transferSummary.map((item) => ({ currency: item.currency, value: item.incoming }))} empty={defaultValue}/><em className="income">Между проектами</em></article>
      <article><small>Исходящие переводы</small><IconCircle icon="trendDown" tone="pink"/><SummaryValues values={transferSummary.map((item) => ({ currency: item.currency, value: item.outgoing }))} empty={defaultValue}/><em className="expense">Между проектами</em></article>
    </section>

    {legacySummary.length > 0 && <section className="imperia-finance-dynamics"><header><span><AppIcon name="analytics"/><span><b>Динамика финансов</b><small>Существующий учёт · {projectName}</small></span></span><Link href={selected?.code === "FAMILY" ? "/family/operations" : `/finance?module=${selected?.code ?? "FAMILY"}`}>История <AppIcon name="arrow"/></Link></header><div>{legacySummary.map((item) => <article key={item.currency}><span><small>Доходы</small><strong className="income">{item.income}</strong></span><span><small>Расходы</small><strong className="expense">{item.expense}</strong></span><span><small>Результат</small><strong>{item.result}</strong></span></article>)}</div><p>{projectName === "Семья" ? "Результат автоматически доступен в основном кошельке «Доступно семье»." : "Существующие операции показаны отдельно и не переносятся в кошельки автоматически."}</p></section>}

    <MoneyAccountSection title="Кошельки" eyebrow="Где находятся деньги" href={`/money/new?project=${selected?.code ?? "FAMILY"}&kind=WALLET`} accounts={wallets} empty="Создайте кошелёк и укажите стартовый остаток."/>
    <MoneyAccountSection title="Конверты" eyebrow="Назначение денег" href={`/money/new?project=${selected?.code ?? "FAMILY"}&kind=ENVELOPE`} accounts={envelopes} empty="Конверты помогают распределить уже имеющиеся деньги."/>
    {archived.length > 0 && <details className="imperia-finance-archive"><summary>Архив · {archived.length}</summary><div>{archived.map((account) => <MoneyAccountRow key={account.id} account={account}/>)}</div></details>}
  </div>;
}

function MoneyAccountSection({ title, eyebrow, href, accounts, empty }: { title: string; eyebrow: string; href: string; accounts: MoneyAccount[]; empty: string }) {
  return <section id={title === "Конверты" ? "envelopes" : undefined} className="imperia-finance-accounts"><header><span><small>{eyebrow}</small><b>{title}</b></span><Link href={href}>＋ Добавить</Link></header>{accounts.length ? <div>{accounts.map((account) => <MoneyAccountRow key={account.id} account={account}/>)}</div> : <p>{empty}</p>}</section>;
}

function MoneyAccountRow({ account }: { account: MoneyAccount }) {
  return <Link href={`/money/${account.id}`}><span className="imperia-finance-account-icon">{account.icon}</span><span><b>{account.name}{account.primary ? " · основной" : ""}</b><small>{account.subtitle}</small></span><strong>{account.value}</strong><AppIcon name="arrow"/></Link>;
}

export function ImperiaProjects() {
  const projects: Array<{ name: string; description: string; href: string; icon: AppIconName; tone: "primary" | "pink" | "orange" | "cyan" }> = [
    { name: "Семья", description: "Личные доходы, расходы и сбережения", href: "/family", icon: "home", tone: "primary" },
    { name: "Птицеводство", description: "Птица, корма, инкубация и продажи", href: "/poultry", icon: "flock", tone: "pink" },
    { name: "Товарка", description: "Товары, склад, продажи и прибыль", href: "/goods", icon: "sales", tone: "cyan" },
    { name: "Инфобизнес", description: "Курсы, обучение, расходы и аналитика", href: "/infobusiness", icon: "lightbulb", tone: "primary" },
    { name: "Косметология", description: "Клиенты, процедуры, касса и прибыль", href: "/cosmetology", icon: "sparkles", tone: "pink" },
  ];
  return <div className="imperia-projects-page"><header><div><p>Проекты</p><h1>Ваши направления</h1><span>Вся империя — в одном приложении.</span></div><Link href="/money">Общий капитал <AppIcon name="arrow"/></Link></header><section>{projects.map((project) => <Link href={project.href} key={project.name}><IconCircle icon={project.icon} tone={project.tone} size="large"/><span><b>{project.name}</b><small>{project.description}</small><em>Активен</em></span><AppIcon name="arrow"/></Link>)}</section></div>;
}
