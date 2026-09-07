import Link from "next/link";
import { notFound } from "next/navigation";

import { AppCard, StatusBadge } from "@/components/ui/app-card";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { formatMoney } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/server/auth";
import { getPoultryDashboard } from "@/server/poultry";

const labels = { ADD: "Поступление", SALE: "Продажа", MORTALITY: "Падёж", FAMILY_USE: "Забой / для семьи", TRANSFER: "Перевод", ADJUSTMENT: "Сверка" } as const;

export default async function PoultryBatchPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(); const { id } = await params;
  const [dashboard, details] = await Promise.all([getPoultryDashboard(user.id, "ALL"), prisma.poultryBatch.findFirst({ where: { id, userId: user.id, deletedAt: null }, include: { movements: { where: { deletedAt: null }, orderBy: { operationDate: "desc" } }, originMovements: { where: { deletedAt: null }, include: { origin: true } }, eggCollections: { where: { deletedAt: null }, orderBy: { operationDate: "desc" } }, slaughters: { where: { deletedAt: null }, orderBy: { operationDate: "desc" } }, poultryOperationalExpenses: { where: { deletedAt: null, transaction: { deletedAt: null } }, include: { transaction: true } } } })]);
  const batch = dashboard.batches.find((item) => item.id === id); if (!batch || !details) notFound();
  const movementTotal = (type: keyof typeof labels) => details.movements.filter((item) => item.type === type).reduce((sum,item)=>sum+item.quantity,0);
  const income = batch.sales.reduce((sum,item)=>sum+Number(item.totalAmount),0);
  const originNames = [...new Map(details.originMovements.map((item)=>[item.origin.id, item.origin])).values()];
  const events = [...details.movements.map((item)=>({ id:item.id,date:item.operationDate,title:labels[item.type],detail:`${item.quantityDelta && item.quantityDelta > 0 ? "+" : "−"}${item.quantity} гол.${item.reason ? ` · ${item.reason}` : ""}`})), ...details.eggCollections.map((item)=>({id:item.id,date:item.operationDate,title:"Яйца",detail:`+${item.quantity}`}))].sort((a,b)=>b.date.getTime()-a.date.getTime());
  const returnTo = `/poultry/flock/${batch.id}`;
  const context = `batchId=${batch.id}&returnTo=${encodeURIComponent(returnTo)}`;

  return <>
    <header className="page-header"><div><p className="eyebrow">Паспорт птицы</p><h1>{batch.name}</h1><p className="muted">{batch.birdType} · происхождение {batch.startDate.toLocaleDateString("ru-RU")}</p></div><Link href="/poultry/flock" className="button secondary">К группам</Link></header>
    <section className="metric-grid poultry-summary"><article><span>Сейчас</span><strong>{batch.currentQuantity} гол.</strong></article><article><span>Возраст</span><strong>{batch.ageDays} дн.</strong></article><article><span>Было изначально</span><strong>{batch.startingQuantity}</strong></article><article><span>Статус</span><StatusBadge tone={batch.status === "ACTIVE" ? "success" : "neutral"}>{batch.status === "ACTIVE" ? "Активна" : "Завершена"}</StatusBadge></article></section>
    <div className="poultry-compact-stats"><span>Продано <b>{movementTotal("SALE")}</b></span><span>Падёж <b>{movementTotal("MORTALITY")}</b></span><span>Переведено <b>{movementTotal("TRANSFER")}</b></span><span>Забой <b>{movementTotal("FAMILY_USE")}</b></span></div>
    <details className="app-card poultry-batch-action-menu"><summary><b>＋ Действие с группой</b><span>Открыть</span></summary><div className="poultry-sheet-grid"><Link href={`/poultry/eggs?${context}#collect`}>Яйца</Link><Link href={`/poultry/feed?${context}#assign-feed`}>Кормление</Link><Link href={`/poultry/flock?${context}#movement`}>Падёж / изменение</Link><Link href={`/poultry/flock?${context}#transfer`}>Перевод</Link><Link href={`/poultry/flock?${context}#slaughter`}>Забой</Link><Link href={`/poultry/flock?${context}#reconcile`}>Сверка</Link><Link href={`/poultry/sales?${context}`}>Продажа</Link><Link href={`/poultry/expenses?${context}#new`}>Расход</Link></div></details>

    <SectionHeader eyebrow="Состав" title="Породы и происхождение" />
    <section className="family-grid"><AppCard><div className="mini-list">{batch.breeds.map((item)=><div key={item.id}><span>{item.name}</span><b>{item.quantity}</b></div>)}</div></AppCard><AppCard><h2>Источники птицы</h2>{originNames.map((origin)=><p className="muted" key={origin.id}>{origin.originDate.toLocaleDateString("ru-RU")} · {origin.type === "PURCHASE" ? "покупка" : origin.type === "INCUBATION" ? "инкубация" : origin.type === "GIFT" ? "подарок" : "другое"}</p>)}</AppCard></section>

    <SectionHeader eyebrow="Кормление" title="Нормы и использование" />
    <section className="family-grid"><AppCard><h2>Текущие нормы</h2>{batch.feedRates.length ? batch.feedRates.slice(0,5).map((rate)=><p key={rate.id}><b>{rate.product.name}</b><br/><small>{rate.dailyQuantity.toString()} {rate.unit === "KG" ? "кг" : rate.unit === "BAG" ? "меш." : rate.product.householdUnitName ?? "быт. ед."}/день · с {rate.effectiveFrom.toLocaleDateString("ru-RU")}</small></p>) : <p className="muted">Норма не задана.</p>}<Link href="/poultry/feed#feeding" className="text-link">Настроить →</Link></AppCard><AppCard><h2>Использование</h2><p>Фактически выдано: <b>{batch.productionCost.manualFeedCost.toFixed(2)} ₴</b></p><p>По нормам: <b>≈{batch.productionCost.estimatedFeedCost.toFixed(2)} ₴</b></p></AppCard></section>

    <SectionHeader eyebrow="Себестоимость" title="Накопленная производственная стоимость" />
    <section className="metric-grid poultry-summary"><article><span>Начальная / переводы</span><strong>{formatMoney(batch.productionCost.baseCost.toFixed(2))}</strong></article><article><span>Корм</span><strong>{formatMoney(batch.productionCost.feedCost.toFixed(2))}</strong></article><article><span>Расходы группы</span><strong>{formatMoney(batch.productionCost.directExpenses.toFixed(2))}</strong></article><article><span>Всего / голова</span><strong>{formatMoney(batch.productionCost.total.toFixed(2))}<small>{batch.currentQuantity ? ` ≈ ${formatMoney((batch.productionCost.total/batch.currentQuantity).toFixed(2))}/гол.` : ""}</small></strong></article></section>

    <SectionHeader eyebrow="Результат" title="Что дала группа" />
    <section className="metric-grid poultry-summary"><article><span>Доход</span><strong className="income">{formatMoney(income.toFixed(2))}</strong></article><article><span>Собрано яиц</span><strong>{details.eggCollections.reduce((sum,item)=>sum+item.quantity,0)}</strong></article><article><span>Для семьи</span><strong>{details.slaughters.filter((item)=>item.purpose === "FAMILY").reduce((sum,item)=>sum+item.quantity,0)}</strong></article><article><span>Продано птицы</span><strong>{movementTotal("SALE")}</strong></article></section>

    <SectionHeader eyebrow="История" title="Хронология" />
    {events.length ? <div className="transaction-list">{events.map((event)=><article className="transaction-row" key={`${event.title}-${event.id}`}><span><b>{event.title}</b><small>{event.date.toLocaleDateString("ru-RU")}</small></span><strong>{event.detail}</strong></article>)}</div> : <EmptyState title="Событий пока нет" description="История появится после первого действия." />}
  </>;
}
