import Link from "next/link";

import { categoryIconImage } from "@/lib/family-category-icons";

type Category = { id: string; name: string; icon: string | null };
type Account = { id: string; name: string };

export function QuickFamilyOperationForm({ categories, accounts, type, date, action, recurringPayment }: { categories: Category[]; accounts: Account[]; type: "EXPENSE" | "INCOME"; date: string; action: (formData: FormData) => void | Promise<void>; recurringPayment?: { id: string; amount: string; categoryId: string | null; accountId: string | null; name: string } }) {
  return <form action={action} className={`money-entry ${type === "EXPENSE" ? "money-entry-expense" : "money-entry-income"}`}>
    <input type="hidden" name="type" value={type}/>
    {recurringPayment && <input type="hidden" name="recurringPaymentId" value={recurringPayment.id}/>}

    <label className="money-entry-row money-entry-amount-row">
      <span><small>Сумма</small></span>
      <span className="money-entry-amount-input"><input name="amount" type="text" inputMode="decimal" autoComplete="off" required defaultValue={recurringPayment?.amount} placeholder="0" aria-label="Сумма"/><em>₴</em></span>
    </label>

    <details className="money-entry-details money-choice-details">
      <summary><span>Категория</span><b>Выбрать категорию</b></summary>
      <div className="money-choice-list">
        {categories.map((category) => <label key={category.id}><input type="radio" name="categoryId" value={category.id} required defaultChecked={category.id === recurringPayment?.categoryId}/><span>{categoryVisual(category.icon)}</span><b>{category.name}</b></label>)}
        {!categories.length && <p>Нет доступных категорий.</p>}
      </div>
    </details>

    <label className="money-account-select"><span>{type === "INCOME" ? "Кошелёк поступления" : "Счёт оплаты"}</span><select name="accountId" required={type === "INCOME"} defaultValue={recurringPayment?.accountId ?? ""}><option value="" disabled>Выберите кошелёк</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label>

    <section className="money-entry-details money-entry-note-fields">
      <header>Дата и комментарий</header>
      <div><label>Дата<input name="operationDate" type="date" required defaultValue={date}/></label><label>Комментарий<input name="description" maxLength={500} defaultValue={recurringPayment ? `Оплата: ${recurringPayment.name}` : ""} placeholder="Необязательно"/></label></div>
    </section>

    {type === "EXPENSE" && <Link href="/family/receipts/new" className="money-split-receipt-link">Разделить один чек на несколько категорий <span>›</span></Link>}
    <button className="money-entry-save">Сохранить {type === "EXPENSE" ? "расход" : "доход"}</button>
  </form>;
}

function categoryVisual(icon: string | null) {
  const image = categoryIconImage(icon) ?? categoryIconImage("expense-shopping");
  return <img className="family-custom-icon" src={image} alt=""/>;
}
