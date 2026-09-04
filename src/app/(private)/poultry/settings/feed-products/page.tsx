import { PoultryFormActions } from "@/components/poultry-form-actions";
import { requireUser } from "@/server/auth";
import { getFeedProducts } from "@/server/poultry";
import { createFeedProductAction, deleteFeedProductAction, updateFeedProductCatalogAction } from "../../actions";

const errors: Record<string, string> = {
  duplicate: "Такой вид корма уже существует.",
  used: "Этот корм используется в истории. Его нельзя удалить, но можно переименовать.",
  protected: "Не удалось изменить вид корма.",
};

function feedTypeLabel(type: string | null) {
  if (/grain|зерн|пшениц|кукуруз/i.test(type ?? "")) return "Зерно";
  if (/supplement|additive|добав|мук|дрож|фосфат|трикальц|бмвд/i.test(type ?? "")) return "Добавки";
  return "Комбикорм";
}

export default async function FeedProductsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await requireUser();
  const [products, query] = await Promise.all([getFeedProducts(user.id), searchParams]);

  return <>
    <header className="page-header compact-page-header"><div><p className="eyebrow">Настройки</p><h1>Виды кормов</h1><p className="muted">Справочник кормов и добавок</p></div></header>
    {query.error && errors[query.error] && <p className="form-error">{errors[query.error]}</p>}
    <div className="settings-list">{products.map((product) => {
      const used = product._count.lots + product._count.rates + product._count.adjustments > 0;
      return <details className="settings-editor inline-editor" key={product.id}><summary><span><b>{product.name}</b><small>{feedTypeLabel(product.type)}{used ? " · есть история" : " · можно удалить"}</small></span><span>Изменить</span></summary><form action={updateFeedProductCatalogAction} className="compact-form"><input type="hidden" name="id" value={product.id}/><input type="hidden" name="returnTo" value="/poultry/settings/feed-products"/><label>Название<input name="name" required defaultValue={product.name}/></label><label>Категория<select name="type" defaultValue={feedTypeLabel(product.type)}><option>Зерно</option><option>Комбикорм</option><option>Добавки</option></select></label><PoultryFormActions cancelHref="/poultry/settings/feed-products"><button className="button primary">Сохранить</button></PoultryFormActions></form>{!used && <form action={deleteFeedProductAction} className="inline-settings-actions"><input type="hidden" name="id" value={product.id}/><button className="text-button danger-text">Удалить вид корма</button></form>}</details>;
    })}</div>
    <details className="app-card action-drawer"><summary><b>＋ Добавить вид корма</b><span>＋</span></summary><form action={createFeedProductAction} className="compact-form"><input type="hidden" name="returnTo" value="/poultry/settings/feed-products"/><label>Название<input name="name" required placeholder="Например, Кукуруза"/></label><label>Категория<select name="type" defaultValue="Комбикорм"><option>Зерно</option><option>Комбикорм</option><option>Добавки</option></select></label><p className="summary-note">Создаётся только название. Остаток можно внести отдельно, без покупки и денежного расхода.</p><PoultryFormActions cancelHref="/poultry/settings/feed-products"><button className="button primary">Добавить</button></PoultryFormActions></form></details>
  </>;
}
