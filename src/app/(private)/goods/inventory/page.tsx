import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { todayInputValue } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { requireUser } from "@/server/auth";
import { getGoodsCategories, getGoodsDashboard } from "@/server/goods";

import { createProductAction, createProductCategoryAction, createPurchaseAction, writeOffInventoryAction } from "../actions";

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
    <header className="page-header"><div><p className="eyebrow">Товарка</p><h1>Склад</h1><p className="muted">Сначала смотрите наличие, затем вносите остаток, закупку или списание.</p></div><Link href="/goods" className="button secondary">Назад</Link></header>

    <SectionHeader eyebrow="Факт склада" title="Что есть сейчас" />
    {products.length ? <div className="transaction-list">{products.map((product) => {
      const value = product.inventoryLots.reduce((sum, lot) => sum + Number(lot.availableQuantity) * Number(lot.unitCost), 0);
      return <article className="transaction-row" key={product.id}><span><b>{product.name}</b><small>{product.category?.name ?? "Без категории"}{product.brand ? ` · ${product.brand}` : ""}</small><small>Себестоимость остатка: {formatMoney(value.toFixed(2))}{product.defaultSalePrice ? ` · продажа ${formatMoney(product.defaultSalePrice.toString())}` : ""}</small></span><strong>{product.currentQuantity} {units.find((unit) => unit.value === product.unit)?.label ?? "шт."}</strong></article>;
    })}</div> : <EmptyState title="Склад пока пуст" description="Создайте товар и при необходимости сразу внесите то, что уже есть." />}

    <SectionHeader eyebrow="Действия со складом" title="Внести, закупить или списать" />
    <section className="family-grid">
      <article className="app-card"><h2>1. Внести остаток</h2><p className="muted">Для нового товара, который уже был у вас до учёта.</p><form action={createProductAction} className="compact-form">
        <label>Название товара<input name="name" required placeholder="Например: чай" /></label>
        <div className="form-grid"><label>Категория<select name="categoryId" defaultValue=""><option value="">Без категории</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label><label>Бренд<input name="brand" placeholder="Необязательно" /></label></div>
        <label>Единица<select name="unit" defaultValue="PIECE">{units.map((unit) => <option value={unit.value} key={unit.value}>{unit.label}</option>)}</select></label>
        <div className="form-grid"><label>Сколько есть<input name="openingQuantity" required inputMode="numeric" defaultValue="0" placeholder="Например: 12" /></label><label>Закупочная цена за единицу<input name="openingUnitCost" inputMode="decimal" placeholder="Например: 133" /></label></div>
        <label>Дата внесения остатка<input name="openingDate" type="date" required defaultValue={todayInputValue()} /></label>
        <label>Цена продажи по умолчанию<input name="defaultSalePrice" inputMode="decimal" placeholder="Например: 250" /></label>
        <label>Комментарий<input name="comment" placeholder="Необязательно" /></label>
        <p className="summary-note">Остаток создаёт FIFO-партию, но не создаёт новый расход.</p><button className="button primary">Сохранить товар на складе</button>
      </form></article>

      <article className="app-card"><h2>2. Закупка</h2><p className="muted">Для уже созданного товара. Создаёт расход и увеличивает остаток.</p><form action={createPurchaseAction} className="compact-form">
        <input type="hidden" name="returnToInventory" value="true" />
        <label>Товар<select name="productId" required defaultValue=""><option value="" disabled>Выберите товар</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name} · остаток {product.currentQuantity}</option>)}</select></label>
        <div className="form-grid"><label>Количество<input name="quantity" required inputMode="numeric" placeholder="10" /></label><label>Закупочная цена за единицу<input name="unitPurchasePrice" required inputMode="decimal" placeholder="500" /></label></div>
        <label>Доставка<input name="deliveryAmount" inputMode="decimal" placeholder="0" /></label>
        <label style={{ display: "flex", alignItems: "center", gap: 10 }}><input style={{ width: 20, minHeight: 20 }} name="deliveryInCost" type="checkbox" />Включить доставку в себестоимость</label>
        <label>Поставщик<input name="supplier" placeholder="Необязательно" /></label><label>Дата<input name="operationDate" type="date" required defaultValue={todayInputValue()} /></label><label>Комментарий<input name="comment" placeholder="Необязательно" /></label>
        <button className="button primary">Купить и добавить на склад</button>
      </form></article>

      <article className="app-card"><h2>3. Списание</h2><p className="muted">Уменьшает склад, но не создаёт повторный денежный расход.</p><form action={writeOffInventoryAction} className="compact-form">
        <label>Товар<select name="productId" required defaultValue=""><option value="" disabled>Выберите товар</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name} · остаток {product.currentQuantity}</option>)}</select></label>
        <label>Сколько списать<input name="quantity" required inputMode="numeric" placeholder="Например: 1" /></label><label>Дата<input name="operationDate" type="date" required defaultValue={todayInputValue()} /></label><label>Причина списания<input name="comment" required placeholder="Например: повреждён товар" /></label>
        <button className="button secondary">Списать со склада</button>
      </form></article>

      <article className="app-card"><h2>Новая категория</h2><p className="muted">Например, «БАДы» или «Домашний уход».</p><form action={createProductCategoryAction} className="compact-form"><label>Название категории<input name="name" required placeholder="Новая категория" /></label><button className="button secondary">Добавить категорию</button></form></article>
    </section>
  </>;
}
