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

export function PoultrySaleForm({ batches, selectedBatchId, returnTo, action }: { batches: BatchOption[]; selectedBatchId: string; returnTo: string; action: (formData: FormData) => void | Promise<void> }) {
  const [saleType, setSaleType] = useState("LIVE_BIRD");
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
    <label>Тип продажи<select name="saleType" value={saleType} onChange={(event) => setSaleType(event.target.value)}><option value="LIVE_BIRD">Живая птица</option><option value="CARCASS">Тушка</option><option value="EGGS">Яйца</option><option value="OTHER">Другое</option></select></label>
    {(saleType === "LIVE_BIRD" || saleType === "CARCASS") && <label>Группа птицы<select name="batchId" required={saleType === "LIVE_BIRD"} defaultValue={selectedBatchId}><option value="">Без привязки</option>{batches.map((batch) => <option value={batch.id} key={batch.id}>{batch.name} · {batch.currentQuantity} гол.</option>)}</select></label>}
    <label>Что продано<input name="itemName" required placeholder={saleType === "EGGS" ? "Домашние яйца" : saleType === "CARCASS" ? "Тушка" : "Курица"} /></label>
    <div className="form-grid"><label>Количество<input name="quantity" inputMode="numeric" value={quantity} onChange={(event) => setQuantity(event.target.value)} placeholder="Например, 2" /><small>Нужно, чтобы уменьшить партию.</small></label><label>Вес, кг<input name="weightKg" inputMode="decimal" value={weight} onChange={(event) => setWeight(event.target.value)} placeholder="Например, 4,600" /><small>Можно через запятую или точку.</small></label></div>
    <label>Цена за кг / шт.<input name="price" inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="Например, 230" /></label>
    <div className="summary-note" aria-live="polite"><b>Предварительный итог: </b>{calculatedTotal ? formatPreview(calculatedTotal) : "укажите цену и количество или вес"}{weight && quantity && <small> Расчёт идёт по весу: количество нужно для уменьшения партии.</small>}</div>
    <label>Итоговая сумма, если отличается<input name="totalAmount" inputMode="decimal" value={totalAmount} onChange={(event) => setTotalAmount(event.target.value)} placeholder="Оставьте пустым для автоматического расчёта" /><small>{savedTotal ? `Будет сохранено: ${formatPreview(savedTotal)}.` : "Если поле пустое, FEVORA сохранит рассчитанный итог."}</small></label>
    <details className="form-details"><summary>Данные покупателя</summary><div className="form-grid"><label>Имя<input name="buyer" placeholder="Необязательно" /></label><label>Телефон<input name="buyerPhone" inputMode="tel" placeholder="Необязательно" /></label></div></details>
    <label>Дата<input name="operationDate" type="date" required defaultValue={todayInputValue()} /></label>
    <label>Комментарий<input name="comment" placeholder="Необязательно" /></label>
    <PoultryFormActions cancelHref={returnTo}><button className="button primary">Сохранить продажу</button></PoultryFormActions>
  </form>;
}
