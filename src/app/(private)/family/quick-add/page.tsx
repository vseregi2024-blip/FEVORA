import Link from "next/link";

import { AppIcon } from "@/components/ui/icons";

export default function FamilyQuickAddPage() {
  return <main className="family-quick-add">
    <header className="page-header money-analytics-header"><div><Link href="/family" className="project-return">← Дом</Link><h1>Добавить операцию</h1><p className="muted">Только доход или расход — без лишних шагов.</p></div></header>
    <section className="family-quick-add-grid" aria-label="Выбор операции">
      <Link href="/family/new?type=EXPENSE" className="family-quick-add-expense"><AppIcon name="expense"/><span><b>Расход</b><small>Покупка, платёж или перевод денег.</small></span><AppIcon name="arrow"/></Link>
      <Link href="/family/new?type=INCOME" className="family-quick-add-income"><AppIcon name="trendUp"/><span><b>Доход</b><small>Деньги, которые поступили в семью.</small></span><AppIcon name="arrow"/></Link>
    </section>
  </main>;
}
