import type { CosmetologyBonusRedemptionStatus } from "@prisma/client";

const labels: Record<CosmetologyBonusRedemptionStatus, string> = {
  PENDING: "Списание бонусов ожидает отправки.",
  SENDING: "Списание бонусов выполняется.",
  REMOTE_CONFIRMED: "Бонусы списаны. Завершаем оплату процедуры.",
  APPLIED: "Бонусы списаны и применены к оплате.",
  FAILED_RETRYABLE: "Списание бонусов не завершено. Его можно повторить безопасно.",
  FAILED_FINAL: "Списание бонусов отклонено программой лояльности.",
  CONFLICT: "Обнаружен конфликт idempotency. Автоматический повтор отключён.",
};

type Props = {
  visitId: string;
  redemption: { id: string; status: CosmetologyBonusRedemptionStatus; bonusAmount: { toString(): string }; attemptCount: number; lastErrorCode: string | null; remoteRedemptionId: string | null } | null;
  action: (formData: FormData) => void | Promise<void>;
};

export function BonusRedemptionCard({ visitId, redemption, action }: Props) {
  if (!redemption) return null;
  const retryable = ["PENDING", "FAILED_RETRYABLE", "REMOTE_CONFIRMED"].includes(redemption.status);
  return <section className="app-card"><p className="eyebrow">Beauty Bonus Club</p><h2>Списание бонусов</h2><p><b>{labels[redemption.status]}</b></p><p className="muted">Сумма: {redemption.bonusAmount.toString()} · попыток: {redemption.attemptCount}{redemption.lastErrorCode ? ` · ошибка: ${redemption.lastErrorCode}` : ""}</p>{retryable ? <form action={action}><input type="hidden" name="visitId" value={visitId}/><input type="hidden" name="redemptionId" value={redemption.id}/><button className="button secondary">Повторить</button></form> : null}</section>;
}
