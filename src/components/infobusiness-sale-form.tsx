"use client";

import { useState } from "react";

type Product = { id: string; name: string; basePrice: string | null };

export function InfoSaleForm({ products, action, initialValues, defaultDate }: { products: Product[]; action: (formData: FormData) => void | Promise<void>; initialValues?: { id?: string; productId: string; amount: string; operationDate: string; buyer: string; seats: number; comment: string }; defaultDate?: string }) {
  const [amount, setAmount] = useState(initialValues?.amount ?? "");
  return <form action={action} className="transaction-form">
    {initialValues?.id && <input type="hidden" name="id" value={initialValues.id} />}
    <label>Продукт / курс<select name="productId" required defaultValue={initialValues?.productId ?? ""} onChange={(event) => { const product = products.find((item) => item.id === event.target.value); if (!initialValues && !amount && product?.basePrice) setAmount(product.basePrice); }}><option value="" disabled>Выберите продукт</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}{product.basePrice ? ` · ${product.basePrice} грн` : ""}</option>)}</select></label>
    <div className="form-grid"><label>Сумма<input name="amount" required inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="500" /></label><label>Дата<input name="operationDate" type="date" required defaultValue={initialValues?.operationDate ?? defaultDate} /></label></div>
    <div className="form-grid"><label>Покупатель / ученик<input name="buyer" defaultValue={initialValues?.buyer} placeholder="Необязательно" /></label><label>Количество мест<input name="seats" required inputMode="numeric" defaultValue={initialValues?.seats ?? 1} /></label></div>
    <label>Комментарий<input name="comment" defaultValue={initialValues?.comment} placeholder="Необязательно" /></label>
    <button className="button primary">{initialValues ? "Сохранить без второго дохода" : "Сохранить продажу"}</button>
  </form>;
}
