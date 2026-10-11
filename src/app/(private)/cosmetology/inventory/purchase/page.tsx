import Link from "next/link";

import { CosmetologyPurchaseForm } from "@/components/cosmetology-purchase-form";
import { todayInputValue } from "@/lib/dates";
import { requireUser } from "@/server/auth";
import { getCosmetologyDashboard, getCosmetologyMoneyOptions } from "@/server/cosmetology";

export default async function NewCosmetologyPurchasePage() {
  const user = await requireUser();
  const [dashboard, money] = await Promise.all([getCosmetologyDashboard(user.id), getCosmetologyMoneyOptions(user.id)]);
  return <div className="cosmetology-inventory-flow"><header className="page-header"><div><p className="eyebrow">Препараты и расходники</p><h1>Новая закупка</h1><p className="muted">Одна закупка создаёт одну расходную операцию и пополняет склад.</p></div><Link href="/cosmetology/inventory" className="button secondary">Закрыть</Link></header>{dashboard.items.length ? <CosmetologyPurchaseForm items={dashboard.items.map((item) => ({ id: item.id, name: item.name }))} wallets={money.wallets.map((wallet) => ({ id: wallet.id, name: wallet.name }))} envelopeId={money.procurementEnvelope?.id ?? null} envelopeName={money.procurementEnvelope?.name ?? null} today={todayInputValue()}/> : <section className="app-card"><h2>Сначала добавьте позицию</h2><p className="muted">Для закупки нужен препарат или расходник в списке склада.</p><Link href="/cosmetology/inventory/new" className="button primary">＋ Добавить позицию</Link></section>}</div>;
}
