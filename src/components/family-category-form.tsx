import { FamilyCategoryKindPicker } from "@/components/family-category-kind-picker";
import { FamilyIconPicker } from "@/components/family-icon-picker";

type FamilyCategoryFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  category?: { id: string; name: string; icon: string | null; kind: string };
};

export function FamilyCategoryForm({ action, category }: FamilyCategoryFormProps) {
  const editing = Boolean(category);

  return <form action={action} encType="multipart/form-data" className="imperia-category-form">
    {category && <input type="hidden" name="id" value={category.id}/>}
    <label>
      <span>Название категории</span>
      <input name="name" required autoFocus defaultValue={category?.name} placeholder="Например: Аптека"/>
    </label>
    <label>
      <span>Тип операции</span>
      <FamilyCategoryKindPicker value={category?.kind}/>
    </label>
    <FamilyIconPicker initialValue={category?.icon ?? "expense-shopping"}/>
    <button className="imperia-category-submit" type="submit">{editing ? "Сохранить изменения" : "Добавить категорию"}</button>
  </form>;
}
