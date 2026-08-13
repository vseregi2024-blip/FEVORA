import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { formatMoney } from "@/lib/money";
import { requireUser } from "@/server/auth";
import { getInfoDashboard, infoProductTypes } from "@/server/infobusiness";
import { createInfoProductAction } from "../actions";

const formats = { ONLINE: "Онлайн", OFFLINE: "Офлайн", HYBRID: "Гибридный" } as const;

export default async function InfoProductsPage() {
  const user = await requireUser(); const { products } = await getInfoDashboard(user.id);
  return <><header className="page-header"><div><p className="eyebrow">Инфобизнес · Продукты</p><h1>Курсы и обучение</h1><p className="muted">Один продукт — один понятный финансовый результат.</p></div><Link className="button secondary" href="/infobusiness">Назад</Link></header>
    <section className="family-grid"><article className="app-card"><h2>Новый продукт</h2><form action={createInfoProductAction} className="compact-form"><label>Название<input name="name" required placeholder="Ботокс без помилок" /></label><div className="form-grid"><label>Тип<input name="type" required list="info-product-types" placeholder="Онлайн-курс" /></label><label>Формат<select name="format" defaultValue="ONLINE"><option value="ONLINE">Онлайн</option><option value="OFFLINE">Офлайн</option><option value="HYBRID">Гибридный</option></select></label></div><div className="form-grid"><label>Базовая цена<input name="basePrice" inputMode="decimal" placeholder="Необязательно" /></label><label>Статус<select name="status" defaultValue="ACTIVE"><option value="PREPARATION">Подготовка</option><option value="ACTIVE">Активный</option><option value="COMPLETED">Завершён</option><option value="ARCHIVED">Архив</option></select></label></div><div className="form-grid"><label>Дата начала<input name="startDate" type="date" /></label><label>Дата окончания<input name="endDate" type="date" /></label></div><label>Комментарий<input name="comment" placeholder="Необязательно" /></label><button className="button primary">Добавить продукт</button></form><datalist id="info-product-types">{infoProductTypes.map((type) => <option key={type} value={type}/>)}</datalist></article><article className="app-card"><h2>Как это работает</h2><p className="muted">Доходы и привязанные расходы считаются по продукту. Общие расходы Инфобизнеса в прибыль курса не входят.</p></article></section>
    <section className="section-header"><div><p className="eyebrow">Список</p><h2>Все продукты</h2></div></section><div className="transaction-list">{products.map((product) => <Link key={product.id} href={`/infobusiness/products/${product.id}`} className="transaction-row"><span><b>{product.name}</b><small>{product.type} · {formats[product.format]} · {product.status === "ACTIVE" ? "активный" : product.status === "COMPLETED" ? "завершён" : product.status === "PREPARATION" ? "подготовка" : "архив"}</small></span><strong>{product.basePrice ? formatMoney(product.basePrice.toString()) : "Открыть →"}</strong></Link>)}</div>{products.length === 0 && <EmptyState title="Курсов пока нет" description="Добавьте первый продукт, чтобы учитывать его продажи и расходы."/>}</>;
}
