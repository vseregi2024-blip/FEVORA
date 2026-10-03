import Link from "next/link";

import { AppIcon } from "@/components/ui/icons";

export default function CosmetologyQuickAddPage() {
  return <main className="cosmetology-quick-add">
    <header className="page-header"><div><p className="eyebrow">Косметология · Сегодня</p><h1>Что добавить?</h1><p className="muted">Одна операция — одно понятное действие.</p></div><Link href="/cosmetology/cash" className="button secondary">К кассе</Link></header>
    <section className="cosmetology-quick-add-grid" aria-label="Быстрое добавление">
      <Link href="/cosmetology/visits" className="income-action"><AppIcon name="sales"/><span><b>Оплата процедуры</b><small>Выберите клиента, услугу и полученную оплату.</small></span><AppIcon name="arrow"/></Link>
      <Link href="/cosmetology/expenses" className="expense-action"><AppIcon name="expense"/><span><b>Расход кабинета</b><small>Материалы, реклама, закупка или другой реальный расход.</small></span><AppIcon name="arrow"/></Link>
    </section>
    <Link href="/cosmetology/clients/new" className="cosmetology-quick-add-client"><AppIcon name="clients"/><span><b>Новый клиент</b><small>Создать карточку клиента перед записью.</small></span><AppIcon name="arrow"/></Link>
  </main>;
}
