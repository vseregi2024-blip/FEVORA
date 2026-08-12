import Link from "next/link";
import { notFound } from "next/navigation";

import { AppCard, StatusBadge } from "@/components/ui/app-card";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { formatMoney } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth";
import { poultryAgeDays } from "@/features/poultry/calculations";
import { dateFromInput, todayInputValue } from "@/lib/dates";

const movementLabels = { ADD: "Добавлено", SALE: "Продажа", MORTALITY: "Падёж", FAMILY_USE: "Для семьи", TRANSFER: "Перевод", ADJUSTMENT: "Корректировка" } as const;

export default async function PoultryBatchPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const batch = await prisma.poultryBatch.findFirst({
    where: { id, userId: user.id, deletedAt: null },
    include: {
      movements: { where: { deletedAt: null }, orderBy: { operationDate: "desc" } },
      feedUsages: { include: { lot: { include: { product: true } } }, orderBy: { operationDate: "desc" } },
      sales: { where: { deletedAt: null }, orderBy: { operationDate: "desc" } },
      poultryOperationalExpenses: { include: { transaction: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!batch) notFound();

  const feedCost = batch.feedUsages.reduce((total, usage) => total + Number(usage.lot.costPerBag) * usage.bags, 0);
  const salesIncome = batch.sales.reduce((total, sale) => total + Number(sale.totalAmount), 0);
  const operationCost = batch.poultryOperationalExpenses.reduce((total, expense) => total + Number(expense.transaction.amount), 0);
  const totalCost = feedCost + operationCost;

  return <>
    <header className="page-header"><div><p className="eyebrow">Птицеводство · Партия</p><h1>{batch.name}</h1><p className="muted">{batch.birdType}{batch.breed ? ` · ${batch.breed}` : ""}</p></div><Link href="/poultry/flock" className="button secondary">К партиям</Link></header>
    <section className="metric-grid"><article><span>Сейчас</span><strong>{batch.currentQuantity} гол.</strong></article><article><span>Возраст</span><strong>{poultryAgeDays(batch.startDate, dateFromInput(todayInputValue()))} дн.</strong></article><article><span>Старт</span><strong>{batch.startingQuantity} гол.</strong></article><article><span>Статус</span><StatusBadge tone={batch.status === "ACTIVE" ? "success" : "neutral"}>{batch.status === "ACTIVE" ? "Активна" : "Завершена"}</StatusBadge></article></section>
    <SectionHeader eyebrow="Карточка партии" title="Основное" />
    <AppCard><dl className="settings"><div><dt>Дата начала</dt><dd>{batch.startDate.toLocaleDateString("ru-RU")}</dd></div><div><dt>Источник</dt><dd>{batch.source === "PURCHASE" ? "Покупка" : batch.source === "INCUBATION" ? "Инкубация" : "Другое"}</dd></div>{batch.comment && <div><dt>Комментарий</dt><dd>{batch.comment}</dd></div>}</dl></AppCard>
    <SectionHeader eyebrow="Финансы" title="По этой партии" />
    <section className="metric-grid"><article><span>Корм</span><strong className="expense">{formatMoney(feedCost.toString())}</strong></article><article><span>Расходы</span><strong className="expense">{formatMoney(operationCost.toString())}</strong></article><article><span>Продажи</span><strong className="income">{formatMoney(salesIncome.toString())}</strong></article><article><span>Результат</span><strong>{formatMoney((salesIncome - totalCost).toString())}</strong></article></section>
    <SectionHeader eyebrow="Поголовье" title="Движения" />
    {batch.movements.length ? <div className="transaction-list">{batch.movements.map((movement) => <article className="transaction-row" key={movement.id}><span><b>{movementLabels[movement.type]}</b><small>{movement.operationDate.toLocaleDateString("ru-RU")}{movement.comment ? ` · ${movement.comment}` : ""}</small></span><strong>{movement.type === "ADD" ? "+" : "−"}{movement.quantity} гол.</strong></article>)}</div> : <EmptyState title="Движений пока нет" description="Здесь появятся продажи, падёж, перевод или другое изменение партии." />}
    <SectionHeader eyebrow="Корма" title="Выдано партии" />
    {batch.feedUsages.length ? <div className="transaction-list">{batch.feedUsages.map((usage) => <article className="transaction-row" key={usage.id}><span><b>{usage.lot.product.name}</b><small>{usage.operationDate.toLocaleDateString("ru-RU")}{usage.comment ? ` · ${usage.comment}` : ""}</small></span><strong>{usage.bags} меш.</strong></article>)}</div> : <EmptyState title="Корм ещё не назначен" description="Назначьте мешок в разделе «Корма и склад»." />}
    <SectionHeader eyebrow="Продажи" title="Доход от партии" action={<Link href={`/poultry/sales?batchId=${batch.id}`} className="button primary">Продать птицу</Link>} />
    {batch.sales.length ? <div className="transaction-list">{batch.sales.map((sale) => <Link className="transaction-row" href={`/poultry/sales/${sale.id}`} key={sale.id}><span><b>{sale.itemName}</b><small>{sale.operationDate.toLocaleDateString("ru-RU")}{sale.buyer ? ` · ${sale.buyer}` : ""}</small></span><strong className="income">+{formatMoney(sale.totalAmount.toString())}</strong></Link>)}</div> : <EmptyState title="Продаж пока нет" description="Нажмите «Продать птицу»: FEVORA создаст связанный доход и уменьшит только эту партию." />}
  </>;
}
