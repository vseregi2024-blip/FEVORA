import Link from "next/link";

import { AppIcon } from "@/components/ui/icons";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { todayInputValue } from "@/lib/dates";
import { requireUser } from "@/server/auth";
import { getPoultryDashboard } from "@/server/poultry";
import { createFeedPurchaseAction, createFeedUsageAction } from "../actions";
import styles from "./feed.module.css";

export default async function FeedPage() {
  const user = await requireUser();
  const { batches, lots } = await getPoultryDashboard(user.id);
  const activeBatches = batches.filter((batch) => batch.status === "ACTIVE");
  const availableBags = lots.reduce((total, lot) => total + lot.availableBags, 0);

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Птицеводство</p>
          <h1>Корма и склад</h1>
          <p className="muted">Сначала остатки, затем нужное действие.</p>
        </div>
        <Link href="/poultry" className="button secondary">Назад</Link>
      </header>

      <section className={`balance-card ${styles.inventoryHero}`}>
        <span>Сейчас на складе</span>
        <strong>{availableBags} меш.</strong>
        <p>{lots.length ? `${lots.length} поз. корма в наличии` : "Добавьте первую покупку корма"}</p>
      </section>

      <SectionHeader eyebrow="Остатки" title="Что есть на складе" />
      {lots.length ? (
        <div className="transaction-list">
          {lots.map((lot) => (
            <article className={styles.inventoryRow} key={lot.id}>
              <span className={styles.inventoryIcon}><AppIcon name="feed" /></span>
              <span className={styles.inventoryInfo}>
                <b>{lot.product.name}</b>
                <small>{lot.product.type ?? "Корм"}{lot.product.bagSizeKg ? ` · мешок ${lot.product.bagSizeKg.toString()} кг` : ""}</small>
                <small>Куплено {lot.purchasedBags} · выдано {lot.purchasedBags - lot.availableBags}</small>
              </span>
              <strong className={styles.inventoryAmount}>{lot.availableBags}<small>меш.</small></strong>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="Корма на складе пока нет" description="Добавьте первую покупку — расход и остаток мешков появятся вместе." />
      )}

      <SectionHeader eyebrow="Действия" title="Что хотите сделать?" />
      <section className="quick-grid">
        <a href="#buy-feed" className="quick-action"><AppIcon name="feed" /><span>Купить корм</span></a>
        <a href="#assign-feed" className="quick-action"><AppIcon name="flock" /><span>Назначить партии</span></a>
      </section>

      <section className={styles.forms}>
        <details id="buy-feed" className="app-card">
          <summary className={styles.summary}>
            <span><b>Купить корм</b><small>Добавит мешки на склад и один расход Poultry</small></span>
            <span>＋</span>
          </summary>
          <form action={createFeedPurchaseAction} className={`compact-form ${styles.form}`}>
            <label>Название корма<input name="name" required placeholder="ПК-3-4" /></label>
            <div className="form-grid">
              <label>Тип<input name="type" placeholder="Комбикорм" /></label>
              <label>Размер мешка, кг<input name="bagSizeKg" inputMode="decimal" placeholder="Необязательно" /></label>
            </div>
            <div className="form-grid">
              <label>Количество мешков<input name="bags" required inputMode="numeric" placeholder="5" /></label>
              <label>Общая сумма<input name="totalAmount" required inputMode="decimal" placeholder="2500" /></label>
            </div>
            <label>Дата<input name="operationDate" type="date" required defaultValue={todayInputValue()} /></label>
            <label>Комментарий<input name="comment" placeholder="Необязательно" /></label>
            <button className="button primary">Купить и добавить на склад</button>
          </form>
        </details>

        <details id="assign-feed" className="app-card">
          <summary className={styles.summary}>
            <span><b>Назначить мешок партии</b><small>Не создаёт новый расход</small></span>
            <span>＋</span>
          </summary>
          <form action={createFeedUsageAction} className={`compact-form ${styles.form}`}>
            <label>Корм<select name="lotId" required defaultValue=""><option value="" disabled>Выберите корм</option>{lots.filter((lot) => lot.availableBags > 0).map((lot) => <option value={lot.id} key={lot.id}>{lot.product.name} · доступно {lot.availableBags} меш.</option>)}</select></label>
            <label>Партия птицы<select name="batchId" required defaultValue=""><option value="" disabled>Выберите партию</option>{activeBatches.map((batch) => <option value={batch.id} key={batch.id}>{batch.name} · {batch.currentQuantity} гол.</option>)}</select></label>
            <div className="form-grid">
              <label>Статус<select name="type"><option value="ASSIGNED">Назначить</option><option value="FINISHED">Мешок закончился</option></select></label>
              <label>Мешков<input name="bags" required inputMode="numeric" defaultValue="1" /></label>
            </div>
            <label>Дата<input name="operationDate" type="date" required defaultValue={todayInputValue()} /></label>
            <label>Комментарий<input name="comment" placeholder="Например: открыт для №3" /></label>
            <p className="summary-note">Назначение связано с партией и уменьшает складской остаток без повторного расхода.</p>
            <button className="button secondary">Сохранить назначение</button>
          </form>
        </details>
      </section>
    </>
  );
}
