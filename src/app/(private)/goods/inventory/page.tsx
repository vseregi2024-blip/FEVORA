import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { todayInputValue } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { requireUser } from "@/server/auth";
import { getGoodsCategories, getGoodsDashboard } from "@/server/goods";

import { createInventoryChangeAction, createProductAction, createProductCategoryAction } from "../actions";

const units = [
  { value: "PIECE", label: "шт." },
  { value: "PACKAGE", label: "упаковка" },
  { value: "JAR", label: "банка" },
  { value: "BOTTLE", label: "флакон" },
  { value: "OTHER", label: "другое" },
];

export default async function InventoryPage() {
  const user = await requireUser();
  const [{ products }, categories] = await Promise.all([getGoodsDashboard(user.id), getGoodsCategories(user.id)]);

  return <>
    <header className="page-header">
      <div>
        <p className="eyebrow">Товарка</p>
        <h1>Товары и склад</h1>
        <p className="muted">Остатки считаются по стартовым остаткам, закупкам, продажам и движениям.</p>
      </div>
      <Link href="/goods" className="button secondary">Назад</Link>
    </header>

    <SectionHeader eyebrow="Факт склада" title="Что есть сейчас" />
    {products.length ? <div className="transaction-list">{products.map((product) => {
      const value = product.inventoryLots.reduce((sum, lot) => sum + Number(lot.availableQuantity) * Number(lot.unitCost), 0);
      return <article className="transaction-row" key={product.id}>
        <span>
          <b>{product.name}</b>
          <small>{product.category?.name ?? "Без категории"}{product.brand ? ` · ${product.brand}` : ""}</small>
          <small>Себестоимость остатка: {formatMoney(value.toFixed(2))}{product.defaultSalePrice ? ` · цена продажи ${formatMoney(product.defaultSalePrice.toString())}` : ""}</small>
        </span>
        <strong>{product.currentQuantity} {units.find((unit) => unit.value === product.unit)?.label ?? "шт."}</strong>
      </article>;
    })}</div> : <EmptyState title="Товаров пока нет" description="Добавьте товар и, если он уже есть, укажите стартовый остаток с его себестоимостью." />}

    <SectionHeader eyebrow="Движение" title="Списание или корректировка" />
    <article className="app-card"><form action={createInventoryChangeAction} className="compact-form">
      <label>Товар<select name="productId" required defaultValue=""><option value="" disabled>Выберите товар</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name} · остаток {product.currentQuantity}</option>)}</select></label>
      <div className="form-grid"><label>Тип<select name="type"><option value="WRITE_OFF">Списание</option><option value="ADJUSTMENT">Корректировка</option></select></label><label>Изменение количества<input name="quantity" required inputMode="numeric" placeholder="Для списания: -1" /></label></div>
      <label>Дата<input name="operationDate" type="date" required defaultValue={todayInputValue()} /></label>
      <label>Причина / комментарий<input name="comment" required placeholder="Например: повреждён товар" /></label>
      <p className="summary-note">Списание и корректировка меняют склад, но не создают новый денежный расход.</p>
      <button className="button secondary">Сохранить движение</button>
    </form></article>

    <SectionHeader eyebrow="Новый товар" title="Добавить товар и остаток" />
    <section className="family-grid">
      <article className="app-card"><form action={createProductAction} className="compact-form">
        <label>Название<input name="name" required placeholder="Herbalife Formula 1" /></label>
        <div className="form-grid"><label>Категория<select name="categoryId" defaultValue=""><option value="">Без категории</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label><label>Бренд<input name="brand" placeholder="Необязательно" /></label></div>
        <label>Единица<select name="unit" defaultValue="PIECE">{units.map((unit) => <option value={unit.value} key={unit.value}>{unit.label}</option>)}</select></label>
        <h2>Что уже есть на складе</h2>
        <div className="form-grid"><label>Стартовый остаток<input name="openingQuantity" required inputMode="numeric" defaultValue="0" placeholder="Например: 12" /></label><label>Закупочная цена за единицу<input name="openingUnitCost" inputMode="decimal" placeholder="Например: 500" /></label></div>
        <label>Дата внесения остатка<input name="openingDate" type="date" required defaultValue={todayInputValue()} /></label>
        <p className="summary-note">Стартовый остаток не создаёт расход: он только формирует склад и FIFO-себестоимость.</p>
        <h2>Цена продажи</h2>
        <label>Цена продажи по умолчанию<input name="defaultSalePrice" inputMode="decimal" placeholder="Например: 750" /></label>
        <p className="muted">Она подставится в новую продажу, но её можно изменить для конкретного покупателя.</p>
        <label>Комментарий<input name="comment" placeholder="Необязательно" /></label>
        <button className="button primary">Добавить товар</button>
      </form></article>
      <article className="app-card"><h2>Новая категория</h2><p className="muted">Например, «БАДы» или «Домашний уход».</p><form action={createProductCategoryAction} className="compact-form"><label>Название категории<input name="name" required placeholder="Новая категория" /></label><button className="button secondary">Добавить категорию</button></form></article>
    </section>
  </>;
}
