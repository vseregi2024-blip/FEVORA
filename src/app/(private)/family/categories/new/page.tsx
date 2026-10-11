import Link from "next/link";

import { FamilyCategoryForm } from "@/components/family-category-form";

import { createFamilyCategoryAction } from "../../actions";

export default function NewFamilyCategoryPage() {
  return <main className="imperia-category-page imperia-category-editor-page">
    <header className="imperia-category-editor-header">
      <Link href="/family/categories" className="imperia-category-close" aria-label="Закрыть">×</Link>
      <p className="imperia-category-eyebrow">Финансовые категории</p>
      <h1>Новая категория</h1>
      <p>Она появится в выборе доходов и расходов.</p>
    </header>
    <section className="imperia-category-editor-card">
      <FamilyCategoryForm action={createFamilyCategoryAction}/>
    </section>
  </main>;
}
