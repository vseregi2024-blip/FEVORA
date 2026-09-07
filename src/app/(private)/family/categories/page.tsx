import Link from "next/link";

import { FamilyIconPicker } from "@/components/family-icon-picker";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { requireUser } from "@/server/auth";
import { getFamilyCategories } from "@/server/family";

import { createFamilyCategoryAction, deleteFamilyCategoryAction, updateFamilyCategoryAction } from "../actions";

const icons: Record<string, string> = { cart: "🛒", home: "🏠", children: "🧸", health: "💊", clothes: "👕", transport: "🚗", fun: "🎭", travel: "✈️", bill: "🧾", income: "💼", other: "•••" };
const kindLabel = (kind: string) => kind === "EXPENSE" ? "Расход" : kind === "INCOME" ? "Доход" : "Доход и расход";
const KindSelect = ({ value = "EXPENSE" }: { value?: string }) => <select name="kind" defaultValue={value}><option value="EXPENSE">Расход</option><option value="INCOME">Доход</option><option value="BOTH">Доход и расход</option></select>;
const CategoryIcon = ({ icon }: { icon: string | null }) => icon?.startsWith("data:image/") ? <img src={icon} alt=""/> : <>{icons[icon ?? "other"] ?? icons.other}</>;

export default async function FamilyCategoriesPage() {
  const user = await requireUser(); const categories = await getFamilyCategories(user.id, undefined, true);
  return <><header className="page-header family-modern-header"><div><Link href="/family" className="eyebrow family-home-link">← Семья</Link><h1>Категории</h1><p className="muted">Создайте только те категории, которыми действительно пользуетесь.</p></div></header>
    <section className="family-clean-section category-create"><h2>Новая категория</h2><form action={createFamilyCategoryAction} className="compact-form"><label>Название<input name="name" required autoFocus placeholder="Например: Питомцы"/></label><label>Тип<KindSelect/></label><FamilyIconPicker/><button className="button primary">Сохранить категорию</button></form></section>
    <section className="section-header"><div><p className="eyebrow">Мои категории</p><h2>{categories.length} категорий</h2></div></section>
    <div className="family-reference-list family-clean-list">{categories.map((category) => <details key={category.id}><summary><span className="family-reference-icon"><CategoryIcon icon={category.icon}/></span><span><b>{category.name}</b><small>{kindLabel(category.kind)}</small></span><i>›</i></summary><form action={updateFamilyCategoryAction} className="compact-form family-reference-edit"><input type="hidden" name="id" value={category.id}/><label>Название<input name="name" required defaultValue={category.name}/></label><label>Тип<KindSelect value={category.kind}/></label><FamilyIconPicker initialValue={category.icon ?? "other"}/><button className="button secondary category-save-button">Сохранить изменения</button></form><div className="family-reference-delete"><ConfirmationDialog action={deleteFamilyCategoryAction} fieldName="id" fieldValue={category.id} trigger="Удалить категорию" title={`Удалить «${category.name}»?`} description="Операции и суммы сохранятся, но будут отображаться без категории." confirmLabel="Удалить категорию" triggerClassName="text-button expense"/></div></details>)}{categories.length === 0 && <p className="empty">Категорий пока нет. Создайте первую выше.</p>}</div>
  </>;
}
