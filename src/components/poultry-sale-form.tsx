"use client";

import { useMemo, useState } from "react";

import { PoultryFormActions } from "@/components/poultry-form-actions";
import { todayInputValue } from "@/lib/dates";

type BatchOption = { id: string; name: string; currentQuantity: number };

function parseDecimal(value: string) {
  const normalized = value.trim().replace(",", ".");
  const number = Number(normalized);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function formatPreview(value: number) {
  return `${new Intl.NumberFormat("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)} ₴`;
}

function defaultItemName(saleType: string) {
  return saleType === "EGGS" ? "Домашние яйца" : saleType === "CARCASS" ? "Тушка" : saleType === "OTHER" ? "Другое" : "Птица";
}

export function PoultrySaleForm({ batches, selectedBatchId, initialSaleType = "LIVE_BIRD", returnTo, action }: { batches: BatchOption[]; selectedBatchId: string; initialSaleType?: string; returnTo: string; action: (formData: FormData) => void | Promise<void> }) {
  const [saleType, setSaleType] = useState(["LIVE_BIRD", "CARCASS", "EGGS", "OTHER"].includes(initialSaleType) ? initialSaleType : "LIVE_BIRD");
  const [itemName, setItemName] = useState(defaultItemName(initialSaleType));
  const [quantity, setQuantity] = useState("");
  const [weight, setWeight] = useState("");
  const [price, setPrice] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const calculatedTotal = useMemo(() => {
    const multiplier = parseDecimal(weight) ?? parseDecimal(quantity);
    const unitPrice = parseDecimal(price);
    return multiplier && unitPrice ? multiplier * unitPrice : null;
  }, [price, quantity, weight]);
  const savedTotal = parseDecimal(totalAmount);

  return <form action={action} className="compact-form">
    <input type="hidden" name="returnTo" value={returnTo} />
    <label>Тип продажи<select name="saleType" value={saleType} onChange={(event) => { setSaleType(event.target.value); setItemName(defaultItemName(event.target.value)); }}><option value="LIVE_BIRD">Живая птица</option><option value="CARCASS">Тушка</option><option value="EGGS">Яйца</option><option value="OTHER">Другое</option></select></label>
    {(saleType === "LIVE_BIRD" || saleType === "CARCASS") && <label>Группа птицы<select name="batchId" required={saleType === "LIVE_BIRD"} defaultValue={selectedBatchId}><option value="">Без привязки</option>{batches.map((batch) => <option value={batch.id} key={batch.id}>{batch.name} · {batch.currentQuantity} гол.</option>)}</select></label>}
    <div className="form-grid"><label>Количество<input name="quantity" inputMode="numeric" value={quantity} onChange={(event) => setQuantity(event.target.value)} placeholder="Например, 2" /></label><label>Итоговая сумма, ₴<input name="totalAmount" inputMode="decimal" value={totalAmount} onChange={(event) => setTotalAmount(event.target.value)} placeholder="Например, 460" /></label></div>
    <label>Дата<input name="operationDate" type="date" required defaultValue={todayInputValue()} /></label>
    <details className="optional-details"><summary>Добавить детали</summary><label>Что продано<input name="itemName" required value={itemName} onChange={(event) => setItemName(event.target.value)} /></label><div className="form-grid"><label>Вес, кг<input name="weightKg" inputMode="decimal" value={weight} onChange={(event) => setWeight(event.target.value)} placeholder="Например, 4,600" /></label><label>Цена за кг / шт.<input name="price" inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="Например, 230" /></label></div><div className="summary-note" aria-live="polite"><b>Расчётный итог: </b>{calculatedTotal ? formatPreview(calculatedTotal) : "укажите цену и количество или вес"}{savedTotal && <small> Сохранится указанная сумма: {formatPreview(savedTotal)}.</small>}</div><div className="form-grid"><label>Покупатель<input name="buyer" placeholder="Необязательно" /></label><label>Телефон<input name="buyerPhone" inputMode="tel" placeholder="Необязательно" /></label></div><label>Комментарий<input name="comment" placeholder="Необязательно" /></label></details>
    <PoultryFormActions cancelHref={returnTo}><button className="button primary">Сохранить продажу</button></PoultryFormActions>
  </form>;
}
