import type { ComponentProps } from "react";

type Category = { id: string; name: string };
type Action = ComponentProps<"form">["action"];

export function SplitReceiptForm({ categories, action, date }: { categories: Category[]; action: Action; date: string }) {
  return <form action={action} className="transaction-form"><label>Дата<input name="operationDate" type="date" defaultValue={date} required /></label><label>Опис чека<input name="description" required placeholder="Наприклад: АТБ" /></label><p className="muted">Додайте щонайменше дві позиції. Загальна сума окремо не створюється — подвійного обліку не буде.</p>{[0, 1, 2].map((index) => <div className="form-grid" key={index}><label>Категорія<select name={`categoryId-${index}`} required={index < 2}><option value="">{index < 2 ? "Оберіть" : "Не додавати"}</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label>Сума<input name={`amount-${index}`} required={index < 2} inputMode="decimal" placeholder="0,00" /></label></div>)}<button className="button primary">Зберегти split-чек</button></form>;
}
