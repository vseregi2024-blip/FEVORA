"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { createCosmetologyPurchaseWithMoneyAction } from "@/app/(private)/cosmetology/actions";

type Option = { id: string; name: string };
const numeric = (value: string) => Number(value.replace(",", "."));
const display = (value: number) => Number.isFinite(value) ? String(Math.round(value * 100) / 100) : "";

export function CosmetologyPurchaseForm({ items, wallets, envelopeId, envelopeName, today }: { items: Option[]; wallets: Option[]; envelopeId: string | null; envelopeName: string | null; today: string }) {
  const [quantity, setQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [total, setTotal] = useState("");
  useEffect(() => {
    const amount = numeric(quantity); const price = numeric(unitPrice);
    if (amount > 0 && price >= 0 && unitPrice !== "") setTotal(display(amount * price));
  }, [quantity, unitPrice]);
  const updateQuantity = (value: string) => { setQuantity(value); const amount = numeric(value); if (amount > 0 && total && !unitPrice) setUnitPrice(display(numeric(total) / amount)); };
  const updateUnitPrice = (value: string) => { setUnitPrice(value); };
  const updateTotal = (value: string) => { setTotal(value); const amount = numeric(quantity); if (amount > 0 && value) setUnitPrice(display(numeric(value) / amount)); };

  return <form action={createCosmetologyPurchaseWithMoneyAction} className="transaction-form cosmetology-inventory-form"><label>Позиция<select name="itemId" required defaultValue=""><option value="" disabled>Выберите позицию</option>{items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><div className="form-grid"><label>Количество<input name="quantity" required inputMode="decimal" value={quantity} onChange={(event) => updateQuantity(event.target.value)} placeholder="10"/></label><label>Цена за единицу<input name="unitPrice" inputMode="decimal" value={unitPrice} onChange={(event) => updateUnitPrice(event.target.value)} placeholder="260"/></label></div><label>Общая сумма<input name="totalAmount" required inputMode="decimal" value={total} onChange={(event) => updateTotal(event.target.value)} placeholder="2600"/></label><p className="summary-note">Введите количество и цену либо общую сумму — второе значение рассчитается автоматически.</p><div className="form-grid"><label>Дата<input name="purchaseDate" type="date" required defaultValue={today}/></label><label>Поставщик <small>необязательно</small><input name="supplier"/></label></div><label>Кошелёк оплаты<select name="moneyAccountId" required defaultValue=""><option value="" disabled>Выберите кошелёк</option>{wallets.map((wallet) => <option key={wallet.id} value={wallet.id}>{wallet.name}</option>)}</select></label><label>Резерв «На закупку»<select name="procurementEnvelopeId" required defaultValue={envelopeId ?? ""}>{envelopeId && envelopeName ? <option value={envelopeId}>{envelopeName}</option> : <option value="" disabled>Не найден конверт «На закупку»</option>}</select></label><label>Комментарий <small>необязательно</small><input name="comment"/></label><div className="money-form-actions"><Link href="/cosmetology/inventory" className="button secondary">Отмена</Link><button className="button primary" disabled={!envelopeId || !wallets.length}>Купить и оприходовать</button></div></form>;
}
