import Link from "next/link";

type Category = { id: string; name: string; icon: string | null };
type Account = { id: string; name: string };

export function NewRecurringPaymentForm({
  categories,
  accounts,
  defaultDate,
  action,
}: {
  categories: Category[];
  accounts: Account[];
  defaultDate: string;
  action: (formData: FormData) => void | Promise<void>;
}) {
  return <form action={action} className="transaction-form recurring-payment-form">
    <label>Название<input name="name" required autoFocus placeholder="Например: интернет"/></label>
    <label className="amount-field">Сумма<span className="money-input"><input name="amount" required inputMode="decimal" placeholder="0,00"/><b>₴</b></span></label>
    <div className="form-grid"><DateField name="nextDueDate" label="Следующая дата" defaultValue={defaultDate} required/><label>Периодичность<select name="frequency"><option value="MONTHLY">Ежемесячно</option><option value="WEEKLY">Еженедельно</option></select></label></div>

    <section className="recurring-category-field">
      <label>Категория
        <select name="categoryId" defaultValue="">
          <option value="">Без категории</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
      </label>
      <Link href="/family/categories" className="recurring-new-category">＋ Новая категория</Link>
    </section>

    <label>Счёт / способ оплаты<select name="accountId"><option value="">Без счёта</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label>
    <DateField name="endDate" label="Дата окончания" optional/>
    <label>Комментарий<input name="note" maxLength={500} placeholder="Необязательно"/></label>
    <button className="button primary wide">Сохранить платёж</button>
  </form>;
}

function DateField({ name, label, defaultValue = "", optional = false, required = false }: { name: string; label: string; defaultValue?: string; optional?: boolean; required?: boolean }) {
  return <label className="family-date-field">{label} {optional && <small>необязательно</small>}<input className="family-date-native" name={name} type="date" required={required} defaultValue={defaultValue}/></label>;
}
