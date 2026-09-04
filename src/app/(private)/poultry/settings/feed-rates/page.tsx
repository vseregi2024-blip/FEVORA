import { PoultryFormActions } from "@/components/poultry-form-actions";
import { todayInputValue } from "@/lib/dates";
import { requireUser } from "@/server/auth";
import { getFeedWorkspace } from "@/server/poultry";
import { createFeedRateAction } from "../../actions";

export default async function FeedRatesPage() {
  const user = await requireUser();
  const data = await getFeedWorkspace(user.id);
  const active = data.batches.filter((batch) => batch.status === "ACTIVE");
  const rates = active.flatMap((batch) => batch.feedRates.map((rate) => ({ ...rate, batchName: batch.name }))).sort((a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime());
  return <>
    <header className="page-header compact-page-header"><div><p className="eyebrow">Настройки</p><h1>Нормы кормления</h1><p className="muted">Новая дата создаёт новую норму, старая история сохраняется</p></div></header>
    <div className="compact-list">{rates.map((rate) => <article className="compact-list-row" key={rate.id}><span><b>{rate.batchName}</b><small>{rate.product.name} · {rate.dailyQuantity.toString()} {rate.unit === "KG" ? "кг" : rate.unit === "BAG" ? "меш." : rate.product.householdUnitName ?? "быт. ед."}/день</small></span><small>с {rate.effectiveFrom.toLocaleDateString("ru-RU")}</small></article>)}</div>
    <details className="app-card action-drawer"><summary><b>＋ Новая норма</b><span>＋</span></summary><form action={createFeedRateAction} className="compact-form"><input type="hidden" name="returnTo" value="/poultry/settings/feed-rates"/><label>Группа<select name="batchId" required defaultValue=""><option value="" disabled>Выберите группу</option>{active.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}</select></label><label>Корм<select name="productId" required defaultValue=""><option value="" disabled>Выберите корм</option>{data.inventory.map((item) => <option key={item.product.id} value={item.product.id}>{item.product.name}</option>)}</select></label><div className="form-grid"><label>Количество в день<input name="dailyQuantity" required inputMode="decimal"/></label><label>Единица<select name="unit"><option value="KG">Килограмм</option><option value="BAG">Мешок</option><option value="HOUSEHOLD">Бытовая единица</option></select></label></div><label>Дата начала<input name="effectiveFrom" type="date" required defaultValue={todayInputValue()}/></label><label>Комментарий<input name="comment"/></label><PoultryFormActions cancelHref="/poultry/settings/feed-rates"><button className="button primary">Сохранить норму</button></PoultryFormActions></form></details>
  </>;
}
