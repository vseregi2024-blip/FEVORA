import Link from "next/link";

import { categoryIconImage } from "@/lib/family-category-icons";
import { requireUser } from "@/server/auth";
import { getFamilyCategories } from "@/server/family";

const kindLabel = (kind: string) => kind === "EXPENSE" ? "Расход" : kind === "INCOME" ? "Доход" : "Общая категория";

export default async function FamilyCategoriesPage() {
  const user = await requireUser();
  const categories = await getFamilyCategories(user.id, undefined, true);

  return <main className="imperia-category-page">
    <header className="imperia-category-header">
      <div>
        <Link href="/family/settings/sections" className="imperia-category-back">← Разделы приложения</Link>
        <p className="imperia-category-eyebrow">Финансы</p>
        <h1>Финансовые категории</h1>
        <p>Создавайте и меняйте категории на отдельном удобном экране.</p>
      </div>
      <Link href="/family/categories/new" className="imperia-category-create">＋ Добавить</Link>
    </header>

    <section className="imperia-category-list-section" aria-labelledby="category-list-heading">
      <div className="imperia-category-list-heading">
        <div>
          <p className="imperia-category-eyebrow">Мои категории</p>
          <h2 id="category-list-heading">{categories.length} {pluralizeCategories(categories.length)}</h2>
        </div>
        <span>Нажмите, чтобы изменить</span>
      </div>
      {categories.length > 0 ? <div className="imperia-category-list">
        {categories.map((category) => {
          const image = categoryIconImage(category.icon) ?? categoryIconImage("expense-shopping");
          return <Link key={category.id} href={`/family/categories/${category.id}`} className="imperia-category-row">
            <span className="imperia-category-icon"><img src={image} alt=""/></span>
            <span>
              <b>{category.name}</b>
              <small>{kindLabel(category.kind)}{category.isArchived ? " · В архиве" : ""}</small>
            </span>
            <i aria-hidden="true">›</i>
          </Link>;
        })}
      </div> : <div className="imperia-category-empty">
        <b>Категорий пока нет</b>
        <p>Добавьте первую категорию — например, «Продукты» или «Зарплата».</p>
        <Link href="/family/categories/new">Добавить категорию</Link>
      </div>}
    </section>
  </main>;
}

function pluralizeCategories(count: number) {
  const lastTwo = count % 100;
  if (lastTwo >= 11 && lastTwo <= 14) return "категорий";
  if (count % 10 === 1) return "категория";
  if (count % 10 >= 2 && count % 10 <= 4) return "категории";
  return "категорий";
}
