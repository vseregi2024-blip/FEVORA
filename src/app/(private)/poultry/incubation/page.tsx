import Link from "next/link";

import { PoultryFormActions } from "@/components/poultry-form-actions";
import { EmptyState } from "@/components/ui/empty-state";
import { todayInputValue } from "@/lib/dates";
import { requireUser } from "@/server/auth";
import { getPoultryDashboard } from "@/server/poultry";
import { createIncubationAction } from "../actions";

export default async function IncubationPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const user = await requireUser();
  const { incubations } = await getPoultryDashboard(user.id);
  const query = await searchParams;
  const status = query.status === "completed" ? "COMPLETED" : "ACTIVE";
  const visible = incubations.filter((item) => item.status === status);
  const today = new Date();

  return <>
    <header className="page-header compact-page-header"><div><p className="eyebrow">Птицеводство</p><h1>Инкубация</h1><p className="muted">Закладки и результаты вывода</p></div><Link href="/poultry/incubation#new" className="button primary">＋ Закладка</Link></header>
    <nav className="chip-tabs"><Link href="/poultry/incubation" className={status === "ACTIVE" ? "active" : ""}>Активные</Link><Link href="/poultry/incubation?status=completed" className={status === "COMPLETED" ? "active" : ""}>Завершённые</Link></nav>
    {visible.length ? <div className="compact-list">{visible.map((batch) => { const day = Math.max(1, Math.floor((today.getTime() - batch.setDate.getTime()) / 86400000) + 1); const total = batch.items.reduce((sum, item) => sum + item.setQuantity, 0); return <Link className="compact-list-row" href={`/poultry/incubation/${batch.id}`} key={batch.id}><span><b>{batch.name}</b><small>{batch.setDate.toLocaleDateString("ru-RU")} · {batch.birdType} · {total} яиц</small><small>{status === "ACTIVE" ? `${day}-й день · ближайшее: контроль закладки` : `Вылупилось ${batch.items.reduce((sum, item) => sum + item.hatchedQuantity, 0)}`}</small></span><span>→</span></Link>; })}</div> : <EmptyState title={status === "ACTIVE" ? "Активных инкубаций нет" : "Завершённых инкубаций нет"} description="Переключите вкладку или создайте новую закладку."/>}
    <details id="new" className="app-card action-drawer"><summary><b>Новая инкубация</b><span>＋</span></summary><form action={createIncubationAction} className="compact-form"><input type="hidden" name="returnTo" value="/poultry/incubation"/><div className="form-grid"><label>Название<input name="name" required placeholder="Закладка 31 августа"/></label><label>Вид птицы<input name="birdType" required placeholder="Куры"/></label></div><div className="form-grid"><label>Дата закладки<input name="setDate" type="date" required defaultValue={todayInputValue()}/></label><label>Источник яиц<select name="eggSource"><option value="OWN">Свои</option><option value="PURCHASED">Купленные</option><option value="GIFTED">Подаренные</option></select></label></div><div className="form-grid"><label>Оплачено, ₴<input name="cashCost" inputMode="decimal"/></label><label>Расчётная стоимость, ₴<input name="productionCost" inputMode="decimal"/></label></div>{[0,1,2,3].map((index) => <div className="form-grid" key={index}><label>Порода<input name={`breed-${index}`} placeholder={index ? "Ещё порода" : "Необязательно"}/></label><label>Заложено яиц<input name={`setQuantity-${index}`} required={index === 0} inputMode="numeric"/></label></div>)}<label>Комментарий<input name="comment"/></label><PoultryFormActions cancelHref="/poultry/incubation"><button className="button primary">Создать закладку</button></PoultryFormActions></form></details>
  </>;
}
