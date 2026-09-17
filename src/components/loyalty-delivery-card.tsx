import type { CosmetologyLoyaltyDeliveryStatus } from "@prisma/client";

const errorMessages: Record<string, string> = {
  UNAUTHORIZED: "Нет доступа к программе лояльности.",
  NOT_FOUND: "Клиент не найден в программе лояльности.",
  CONFLICT: "Эта операция уже была передана с другими данными.",
  VALIDATION: "Некорректные данные оплаты.",
  RATE_LIMIT: "Слишком много запросов.",
  UNAVAILABLE: "Программа лояльности временно недоступна.",
  TIMEOUT: "Не удалось передать оплату.",
  INVALID_RESPONSE: "Получен некорректный ответ программы лояльности.",
};

type Props = {
  visitId: string;
  connected: boolean;
  fullyPaid: boolean;
  delivery: { status: CosmetologyLoyaltyDeliveryStatus; lastErrorCode: string | null; attemptCount: number } | null;
  enabled: boolean;
  action: (formData: FormData) => void | Promise<void>;
};

export function LoyaltyDeliveryCard({ visitId, connected, fullyPaid, delivery, enabled, action }: Props) {
  let content = <p className="muted">Для существующей процедуры передача не подготавливалась.</p>;
  if (!connected) content = <p className="muted">— Клиент не подключён к программе лояльности.</p>;
  else if (!fullyPaid) content = <p className="muted">— Процедура оплачена не полностью.</p>;
  else if (delivery?.status === "SENT") content = <p className="income"><b>✓ Передано в программу лояльности</b></p>;
  else if (delivery?.status === "SENDING") content = <p><b>⏳ Отправляется</b></p>;
  else if (delivery?.status === "NOT_SENT") content = <><p><b>Готово к передаче в программу лояльности</b></p>{enabled ? <form action={action}><input type="hidden" name="visitId" value={visitId}/><button className="button primary">Передать оплату</button></form> : <p className="muted">Отправка production payment отключена до отдельного подтверждения.</p>}</>;
  else if (delivery?.status === "FAILED") { const conflict = delivery.lastErrorCode === "CONFLICT"; content = <><p className="expense"><b>⚠ Не передано</b></p><p className="muted">{errorMessages[delivery.lastErrorCode ?? ""] ?? "Не удалось передать оплату."}</p>{enabled && !conflict ? <form action={action}><input type="hidden" name="visitId" value={visitId}/><button className="button secondary">Повторить передачу</button></form> : null}</>; }
  return <section className="app-card"><p className="eyebrow">Программа лояльности</p><h2>Beauty Bonus Club</h2>{content}{delivery && <p className="muted"><small>Попыток передачи: {delivery.attemptCount}</small></p>}</section>;
}
