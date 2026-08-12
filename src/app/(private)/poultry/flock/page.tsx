import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/app-card";
import { todayInputValue } from "@/lib/dates";
import { requireUser } from "@/server/auth";
import { getPoultryDashboard } from "@/server/poultry";
import { createPoultryBatchAction, createPoultryMovementAction } from "../actions";

export default async function FlockPage() {
  const user = await requireUser();
  const { batches } = await getPoultryDashboard(user.id);
  const active = batches.filter((batch) => batch.status === "ACTIVE");
  const currentQuantity = active.reduce((total, batch) => total + batch.currentQuantity, 0);

  return <>
    <header className="page-header"><div><p className="eyebrow">Птицеводство</p><h1>Поголовье</h1><p className="muted">Сначала факт наличия, затем изменения и создание новой партии.</p></div><Link href="/poultry" className="button secondary">Назад</Link></header>

    <section className="balance-card"><p>Сейчас в активных партиях</p><strong>{currentQuantity} гол.</strong><span>{active.length ? `${active.length} активн. ${active.length === 1 ? "партия" : "партии"}` : "Активных партий пока нет"}</span></section>
    <SectionHeader eyebrow="Факт поголовья" title="Что есть сейчас" />
    {batches.length ? <section className="project-grid">{batches.map((batch) => <Link className="project-card active" href={`/poultry/flock/${batch.id}`} key={batch.id}><div className="card-title"><h3>{batch.name}</h3><StatusBadge tone={batch.status === "ACTIVE" ? "success" : "neutral"}>{batch.status === "ACTIVE" ? "Активна" : "Завершена"}</StatusBadge></div><span>{batch.birdType}{batch.breed ? ` · ${batch.breed}` : ""}</span><strong>{batch.currentQuantity} гол.</strong><small>Старт: {batch.startingQuantity} · возраст: {batch.ageDays} дн.</small><em>Открыть партию →</em></Link>)}</section> : <EmptyState title="Пока нет партий птицы" description="Создайте первую партию, чтобы учитывать поголовье и связанные операции." />}

    <SectionHeader eyebrow="Движение" title="Что изменилось?" />
    <article className="app-card"><h2>Движение поголовья</h2><p className="muted">Падёж, птица для семьи, перевод и другие изменения без продажи.</p><Link href="/poultry/sales" className="button primary">Продать птицу</Link><form action={createPoultryMovementAction} className="compact-form"><label>Партия<select name="batchId" required defaultValue=""><option value="" disabled>Выберите активную партию</option>{active.map((batch) => <option value={batch.id} key={batch.id}>{batch.name} · {batch.currentQuantity} гол.</option>)}</select></label><div className="form-grid"><label>Событие<select name="type"><option value="MORTALITY">Падёж</option><option value="FAMILY_USE">Оставлено семье / забой</option><option value="ADD">Добавлено</option><option value="TRANSFER">Перевод</option><option value="ADJUSTMENT">Корректировка</option></select></label><label>Количество<input name="quantity" required inputMode="numeric" /></label></div><label>Дата<input name="operationDate" type="date" required defaultValue={todayInputValue()} /></label><label>Комментарий<input name="comment" placeholder="Необязательно" /></label><p className="summary-note">Для продажи используйте кнопку выше: она создаст доход и уменьшит партию одной связанной операцией.</p><button className="button secondary">Сохранить движение</button></form></article>

    <SectionHeader eyebrow="Новая запись" title="Добавить партию" />
    <article className="app-card"><h2>Новая партия</h2><form action={createPoultryBatchAction} className="compact-form"><label>Название / номер<input name="name" required placeholder="Бройлеры №3" /></label><div className="form-grid"><label>Вид птицы<input name="birdType" required list="bird-types" placeholder="Бройлеры" /></label><label>Порода<input name="breed" placeholder="Необязательно" /></label></div><div className="form-grid"><label>Дата начала<input name="startDate" type="date" required defaultValue={todayInputValue()} /></label><label>Стартовое количество<input name="quantity" required inputMode="numeric" /></label></div><label>Источник<select name="source"><option value="PURCHASE">Покупка</option><option value="INCUBATION">Собственная инкубация</option><option value="OTHER">Другое</option></select></label><label>Комментарий<input name="comment" placeholder="Необязательно" /></label><button className="button primary">Создать партию</button></form><datalist id="bird-types"><option value="Куры" /><option value="Бройлеры" /><option value="Утки" /><option value="Индоутки" /><option value="Несушки" /><option value="Другая птица" /></datalist></article>
  </>;
}
