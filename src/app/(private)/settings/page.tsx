import { requireUser } from "@/server/auth";
import { formatMoney } from "@/lib/money";

export default async function SettingsPage() { const user = await requireUser(); return <section className="settings"><p className="eyebrow">Налаштування</p><h1>Профіль</h1><dl><div><dt>Email</dt><dd>{user.email}</dd></div><div><dt>Часовий пояс</dt><dd>{user.timezone}</dd></div><div><dt>Валюта</dt><dd>{user.defaultCurrency}</dd></div><div><dt>Стартовий залишок</dt><dd>{formatMoney(user.startingBalance.toString(), user.defaultCurrency)}</dd></div></dl><p className="muted">Редагування профілю та категорій буде додано в наступній задачі.</p></section>; }
