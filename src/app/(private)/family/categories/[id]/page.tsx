import Link from "next/link";
import { notFound } from "next/navigation";

import { FamilyCategoryForm } from "@/components/family-category-form";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { requireUser } from "@/server/auth";
import { getFamilyCategories } from "@/server/family";

import { deleteFamilyCategoryAction, updateFamilyCategoryAction } from "../../actions";

export default async function FamilyCategoryEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, user] = await Promise.all([params, requireUser()]);
  const categories = await getFamilyCategories(user.id, undefined, true);
  const category = categories.find((item) => item.id === id);
  if (!category) notFound();
  const editable = category.userId === user.id;

  return <main className="imperia-category-page imperia-category-editor-page">
    <header className="imperia-category-editor-header">
      <Link href="/family/categories" className="imperia-category-close" aria-label="Закрыть">×</Link>
      <p className="imperia-category-eyebrow">Финансовые категории</p>
      <h1>{editable ? "Изменить категорию" : "Системная категория"}</h1>
      <p>{editable ? "Настройте название, тип операции и иконку." : "Системные категории доступны в операциях, но их нельзя изменять."}</p>
    </header>
    <section className="imperia-category-editor-card">
      {editable ? <>
        <FamilyCategoryForm action={updateFamilyCategoryAction} category={category}/>
        <div className="imperia-category-danger-zone">
          <h2>Удаление категории</h2>
          <p>Операции и суммы сохранятся, но будут отображаться без категории.</p>
          <ConfirmationDialog action={deleteFamilyCategoryAction} fieldName="id" fieldValue={category.id} trigger="Удалить категорию" title={`Удалить «${category.name}»?`} description="Операции и суммы сохранятся, но будут отображаться без категории." confirmLabel="Удалить категорию" triggerClassName="imperia-category-delete"/>
        </div>
      </> : <Link href="/family/categories" className="imperia-category-submit imperia-category-return">Вернуться к списку</Link>}
    </section>
  </main>;
}
