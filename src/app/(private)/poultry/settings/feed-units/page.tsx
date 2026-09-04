import { PoultryFormActions } from "@/components/poultry-form-actions";
import { requireUser } from "@/server/auth";
import { getFeedWorkspace } from "@/server/poultry";
import { updateFeedUnitSettingsAction } from "../../actions";

export default async function FeedUnitsPage() {
  const user = await requireUser();
  const data = await getFeedWorkspace(user.id);
  return <>
    <header className="page-header compact-page-header"><div><p className="eyebrow">Настройки</p><h1>Единицы корма</h1><p className="muted">Килограммы, мешки и одна бытовая мера для каждого корма</p></div></header>
    <div className="settings-list">{data.inventory.map((item) => <details className="settings-editor inline-editor" key={item.product.id}><summary><span><b>{item.product.name}</b><small>Мешок: {item.product.bagSizeKg?.toString() ?? "не задан"} кг · {item.product.householdUnitName ?? "бытовая единица"}: {item.product.householdUnitKg?.toString() ?? "не задано"} кг</small></span><span>Изменить</span></summary><form action={updateFeedUnitSettingsAction} className="compact-form"><input type="hidden" name="productId" value={item.product.id}/><input type="hidden" name="returnTo" value="/poultry/settings/feed-units"/><label>Вес мешка, кг<input name="bagSizeKg" inputMode="decimal" defaultValue={item.product.bagSizeKg?.toString() ?? ""}/></label><div className="form-grid"><label>Название бытовой единицы<input name="householdUnitName" defaultValue={item.product.householdUnitName ?? ""} placeholder="Кружка"/></label><label>Её вес, кг<input name="householdUnitKg" inputMode="decimal" defaultValue={item.product.householdUnitKg?.toString() ?? ""} placeholder="0,75"/></label></div><PoultryFormActions cancelHref="/poultry/settings/feed-units"><button className="button primary">Сохранить</button></PoultryFormActions></form></details>)}</div>
  </>;
}
