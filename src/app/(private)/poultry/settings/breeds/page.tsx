import { requireUser } from "@/server/auth";
import { getPoultryBreeds } from "@/server/poultry";
import { archivePoultryBreedAction, createPoultryBreedAction, movePoultryBreedAction, updatePoultryBreedAction } from "../../actions";

export default async function PoultryBreedsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await requireUser();
  const [breeds, query] = await Promise.all([getPoultryBreeds(user.id, true), searchParams]);
  return <>
    <header className="page-header compact-page-header"><div><p className="eyebrow">Настройки</p><h1>Породы</h1><p className="muted">Порода необязательна при создании группы</p></div></header>
    {query.error === "duplicate" && <p className="form-error">Такая порода уже существует.</p>}
    <div className="settings-list">{breeds.map((breed) => <article className={`settings-editor ${breed.isArchived ? "archived" : ""}`} key={breed.id}><div className="settings-row-title"><span className="settings-icon">🐔</span><span><b>{breed.name}</b><small>{breed.isArchived ? "В архиве" : "Активна"}</small></span></div><details className="inline-editor"><summary>Изменить</summary><form action={updatePoultryBreedAction} className="inline-form"><input type="hidden" name="id" value={breed.id}/><input name="name" required defaultValue={breed.name}/><button className="button primary">Сохранить</button></form><div className="inline-settings-actions"><form action={movePoultryBreedAction}><input type="hidden" name="id" value={breed.id}/><button name="direction" value="UP" className="text-button">↑</button><button name="direction" value="DOWN" className="text-button">↓</button></form><form action={archivePoultryBreedAction}><input type="hidden" name="id" value={breed.id}/><input type="hidden" name="archived" value={breed.isArchived ? "0" : "1"}/><button className="text-button">{breed.isArchived ? "Восстановить" : "Архивировать"}</button></form></div></details></article>)}</div>
    <details className="app-card action-drawer"><summary><b>＋ Добавить породу</b><span>＋</span></summary><form action={createPoultryBreedAction} className="inline-form"><input name="name" required placeholder="Название породы"/><button className="button primary">Добавить</button></form></details>
  </>;
}
