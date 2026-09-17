import type { CosmetologyPaymentMethod } from "@prisma/client";

import { formatMoney } from "@/lib/money";

type Component = {
  id: string;
  method: CosmetologyPaymentMethod;
  amount: { toString(): string };
  operationDate: Date;
  comment: string | null;
  transactionId: string | null;
  certificate?: { certificateNumber: string } | null;
};

const labels: Record<CosmetologyPaymentMethod, string> = {
  CASH: "Наличные",
  MONOBANK: "Monobank",
  PRIVATBANK: "ПриватБанк",
  OTHER: "Прочие",
  CERTIFICATE: "Сертификат",
  BONUS: "Бонусы",
};

export function CosmetologyPaymentHistory({ components }: { components: Component[] }) {
  const groups = new Map<string, Component[]>();
  for (const component of components) {
    const key = component.transactionId ?? component.id;
    groups.set(key, [...(groups.get(key) ?? []), component]);
  }

  return <section className="app-card">
    <p className="eyebrow">Финансы</p>
    <h2>История оплат</h2>
    <div className="mini-list">{Array.from(groups.entries()).map(([key, items]) => {
      const total = items.reduce((sum, item) => sum + Number(item.amount), 0);
      const monetary = items.filter((item) => !["CERTIFICATE", "BONUS"].includes(item.method)).reduce((sum, item) => sum + Number(item.amount), 0);
      const certificate = items.filter((item) => item.method === "CERTIFICATE").reduce((sum, item) => sum + Number(item.amount), 0);
      const bonus = items.filter((item) => item.method === "BONUS").reduce((sum, item) => sum + Number(item.amount), 0);
      return <div key={key}><span><b>{items[0].operationDate.toLocaleDateString("ru-RU")} · одна оплата</b><small>{items.map((item) => `${labels[item.method]} — ${formatMoney(item.amount.toString())}${item.certificate ? ` · ${item.certificate.certificateNumber}` : ""}${item.comment ? ` (${item.comment})` : ""}`).join(" · ")}</small><small>Деньгами: {formatMoney(monetary.toFixed(2))}{certificate > 0 ? ` · сертификатом: ${formatMoney(certificate.toFixed(2))}` : ""}{bonus > 0 ? ` · бонусами: ${formatMoney(bonus.toFixed(2))}` : ""}</small></span><strong>Закрыто {formatMoney(total.toFixed(2))}</strong></div>;
    })}{!components.length && <p className="muted">Оплат пока нет.</p>}</div>
  </section>;
}
