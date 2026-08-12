import Link from "next/link";
import { notFound } from "next/navigation";

import { AppCard, StatusBadge } from "@/components/ui/app-card";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { requireUser } from "@/server/auth";
import { getPoultryDashboard } from "@/server/poultry";
import { createBatchFromIncubationAction, updateIncubationItemAction } from "../../actions";

export default async function IncubationBatchPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const { incubations } = await getPoultryDashboard(user.id);
  const batch = incubations.find((item) => item.id === id);
  if (!batch) notFound();
  const eggs = batch.items.reduce((total, item) => total + item.setQuantity, 0);
  const hatched = batch.items.reduce((total, item) => total + item.hatchedQuantity, 0);

  return <>
    <header className="page-header"><div><p className="eyebrow">Птицеводство · Инкубация</p><h1>{batch.name}</h1><p className="muted">{batch.birdType} · заложена {batch.setDate.toLocaleDateString("ru-RU")}</p></div><Link href="/poultry/incubation" className="button secondary">К закладкам</Link></header>
    <section className="metric-grid"><article><span>Заложено</span><strong>{eggs} яиц</strong></article><article><span>Вылупилось</span><strong className="income">{hatched}</strong></article><article><span>Пород</span><strong>{batch.items.length}</strong></article><article><span>Статус</span><StatusBadge tone={batch.status === "ACTIVE" ? "success" : "neutral"}>{batch.status === "ACTIVE" ? "Активна" : "Завершена"}</StatusBadge></article></section>
    <SectionHeader eyebrow="Породы" title="Результаты закладки" />
    {batch.items.length ? <div className="transaction-list">{batch.items.map((item) => <AppCard key={item.id}><div className="card-title"><h2>{item.breed}</h2><StatusBadge tone="neutral">Вывод {item.hatchRate}%</StatusBadge></div><p className="muted">Заложено {item.setQuantity} · неоплод {item.infertileQuantity} · потери {item.lossQuantity} · вылупилось {item.hatchedQuantity}</p><form action={updateIncubationItemAction} className="compact-form"><input type="hidden" name="itemId" value={item.id}/><div className="form-grid"><label>Неоплод<input name="infertileQuantity" inputMode="numeric" defaultValue={item.infertileQuantity}/></label><label>Потери<input name="lossQuantity" inputMode="numeric" defaultValue={item.lossQuantity}/></label></div><label>Вылупилось<input name="hatchedQuantity" inputMode="numeric" defaultValue={item.hatchedQuantity}/></label><button className="button secondary">Сохранить результат</button></form>{item.hatchedQuantity > 0 && !item.poultryBatch && <form action={createBatchFromIncubationAction} className="compact-form"><input type="hidden" name="itemId" value={item.id}/><button className="button primary">Создать партию из вывода</button></form>}{item.poultryBatch && <Link href={`/poultry/flock/${item.poultryBatch.id}`} className="text-link">Открыть созданную партию →</Link>}</AppCard>)}</div> : <EmptyState title="Нет данных по породам" description="В этой закладке пока нет строк с породами." />}
  </>;
}
