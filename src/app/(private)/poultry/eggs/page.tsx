import Link from "next/link";

import { DeletePoultryRecordForm } from "@/components/delete-poultry-record-form";
import { PoultryFormActions } from "@/components/poultry-form-actions";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { todayInputValue } from "@/lib/dates";
import { requireUser } from "@/server/auth";
import { getPoultryDashboard } from "@/server/poultry";
import { createEggCollectionAction, deleteEggCollectionAction } from "../actions";

export default async function PoultryEggsPage({ searchParams }: { searchParams: Promise<{ batchId?: string; returnTo?: string; all?: string }> }) {
  const user = await requireUser();
  const { batches, eggs, sales } = await getPoultryDashboard(user.id, "MONTH");
  const today = todayInputValue();
  const collectedToday = eggs.filter((item) => item.operationDate.toISOString().slice(0, 10) === today).reduce((sum, item) => sum + item.quantity, 0);
  const collectedMonth = eggs.reduce((sum, item) => sum + item.quantity, 0);
  const soldMonth = sales.filter((sale) => sale.saleType === "EGGS" && sale.operationDate.getUTCMonth() === new Date().getUTCMonth()).reduce((sum, sale) => sum + (sale.quantity ?? 0), 0);
  const query = await searchParams;
  const selectedBatchId = batches.some((batch) => batch.id === query.batchId) ? query.batchId ?? "" : "";
  const returnTo = query.returnTo?.startsWith("/poultry") && !query.returnTo.startsWith("//") ? query.returnTo : "/poultry/eggs";
  const visible = query.all === "1" ? eggs : eggs.slice(0, 5);

  return <>
    <header className="page-header compact-page-header"><div><p className="eyebrow">Птицеводство</p><h1>Яйца</h1><p className="muted">Сбор и продажи</p></div></header>
    <section className="metric-grid daily-metrics"><article><span>Сегодня</span><strong>{collectedToday}</strong></article><article><span>За месяц</span><strong>{collectedMonth}</strong></article><article><span>Продано за месяц</span><strong>{soldMonth}</strong></article></section>
    <div className="page-actions prominent-actions"><Link href="/poultry/eggs?returnTo=%2Fpoultry%2Feggs#collect" className="button primary">Записать сбор</Link><Link href="/poultry/sales?returnTo=%2Fpoultry%2Feggs#new-sale" className="button secondary">Продать яйца</Link></div>
    <details id="collect" className="app-card action-drawer"><summary><b>Новый сбор</b><span>＋</span></summary><form action={createEggCollectionAction} className="compact-form"><input type="hidden" name="returnTo" value={returnTo}/><label>Группа<select name="batchId" defaultValue={selectedBatchId}><option value="">Общий сбор / неизвестно</option>{batches.filter((batch) => batch.status === "ACTIVE").map((batch) => <option value={batch.id} key={batch.id}>{batch.name}</option>)}</select></label><div className="form-grid"><label>Порода<input name="breed" placeholder="Необязательно"/></label><label>Количество<input name="quantity" required inputMode="numeric"/></label></div><label>Дата<input name="operationDate" type="date" required defaultValue={today}/></label><label>Комментарий<input name="comment"/></label><PoultryFormActions cancelHref={returnTo}><button className="button primary">Сохранить сбор</button></PoultryFormActions></form></details>
    <SectionHeader eyebrow="История" title="Последние операции" action={<Link href={query.all === "1" ? "/poultry/eggs" : "/poultry/eggs?all=1"} className="text-link">{query.all === "1" ? "Свернуть" : "Показать всю историю"}</Link>}/>
    {visible.length ? <div className="compact-list">{visible.map((item) => <article className="compact-list-row" key={item.id}><span><b>+{item.quantity} яиц</b><small>{item.operationDate.toLocaleDateString("ru-RU")} · {item.batch?.name ?? item.breed ?? "Общий сбор"}</small></span><DeletePoultryRecordForm id={item.id} action={deleteEggCollectionAction}/></article>)}</div> : <EmptyState title="Сборов пока нет" description="Запишите первый сбор одной кнопкой."/>}
  </>;
}
