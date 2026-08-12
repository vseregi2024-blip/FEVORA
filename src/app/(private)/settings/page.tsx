import { AppCard } from "@/components/ui/app-card";
import { formatMoney } from "@/lib/money";
import { requireUser } from "@/server/auth";

export default async function SettingsPage(){const user=await requireUser();return <section className="settings"><p className="eyebrow">Настройки</p><h1>Профиль</h1><p className="muted">Данные вашего личного учёта.</p><AppCard><dl><div><dt>Email</dt><dd>{user.email}</dd></div><div><dt>Часовой пояс</dt><dd>{user.timezone}</dd></div><div><dt>Валюта</dt><dd>₴ {user.defaultCurrency}</dd></div><div><dt>Стартовый остаток</dt><dd>{formatMoney(user.startingBalance.toString(),user.defaultCurrency)}</dd></div></dl></AppCard><p className="summary-note">Редактирование профиля и пользовательских категорий появится в отдельной задаче.</p></section>}
