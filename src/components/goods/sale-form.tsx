"use client";

import { useState } from "react";

import { todayInputValue } from "@/lib/dates";

type ProductOption = { id: string; name: string; currentQuantity: number; defaultSalePrice: string | null };

export function SaleForm({ action, products }: { action: (formData: FormData) => void; products: ProductOption[] }) {
  const [productId, setProductId] = useState("");
  const [unitSalePrice, setUnitSalePrice] = useState("");

  const selectProduct = (id: string) => {
    setProductId(id);
    setUnitSalePrice(products.find((product) => product.id === id)?.defaultSalePrice ?? "");
  };

  return <form action={action} className="compact-form">
    <label>Товар<select name="productId" required value={productId} onChange={(event) => selectProduct(event.target.value)}><option value="" disabled>Выберите товар</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name} · остаток {product.currentQuantity}{product.defaultSalePrice ? ` · цена ${product.defaultSalePrice}` : ""}</option>)}</select></label>
    <div className="form-grid"><label>Количество<input name="quantity" required inputMode="numeric" placeholder="2" /></label><label>Цена продажи за единицу<input name="unitSalePrice" required inputMode="decimal" value={unitSalePrice} onChange={(event) => setUnitSalePrice(event.target.value)} placeholder="750" /></label></div>
    <label>Итоговая сумма, если отличается<input name="totalAmount" inputMode="decimal" placeholder="Оставьте пустым для расчёта" /></label>
    <label>Покупатель<input name="buyer" placeholder="Необязательно" /></label>
    <label>Дата<input name="operationDate" type="date" required defaultValue={todayInputValue()} /></label>
    <label>Комментарий<input name="comment" placeholder="Необязательно" /></label>
    <button className="button primary">Сохранить продажу</button>
  </form>;
}
