import Link from "next/link";

import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { formatMoney } from "@/lib/money";
import { requireUser } from "@/server/auth";
import { getInternalTransferHistory } from "@/server/money";
import { cancelInternalTransferAction } from "../actions";

export default async function MoneyTransfersPage({ searchParams }: { searchParams: Promise<{ error?: string; cancelled?: string }> }) {
  const user = await requireUser(); const [query, transfers] = await Promise.all([searchParams, getInternalTransferHistory(user.id)]);
  return <><header className="page-header"><div><Link href="/safe" className="eyebrow">← Сейф</Link><h1>История переводов</h1><p className="muted">Перемещения собственных денег между кошельками и конвертами. Они не меняют доходы, расходы и общий капитал.</p></div><Link href="/money/transfer" className="button primary">↔ Перевести</Link></header>{query.cancelled && <p className="notice">Перевод отменён, остатки восстановлены ✓</p>}{query.error && <p className="form-error">{query.error}</p>}<div className="money-transfer-history">{transfers.map((transfer) => <article className={`app-card money-transfer-card ${transfer.status === "CANCELLED" ? "cancelled" : ""}`} key={transfer.id}><div className="money-transfer-card-head"><span><b>{transfer.sourceAccount.name}</b><small>→ {transfer.targetAccount.name}</small></span><strong>{formatMoney(transfer.sourceAmount.toString(), transfer.sourceCurrency)}</strong></div><div className="money-transfer-meta"><span>{transfer.operationDate.toLocaleDateString("ru-RU")}</span><span>{transfer.sourceAccount.kind === "ENVELOPE" || transfer.targetAccount.kind === "ENVELOPE" ? "Резервирование" : "Между кошельками"}</span>{transfer.status === "CANCELLED" && <span>Отменён</span>}</div>{transfer.comment && <p>{transfer.comment}</p>}{transfer.status === "POSTED" && <ConfirmationDialog action={cancelInternalTransferAction} fieldName="id" fieldValue={transfer.id} trigger="Отменить перевод" title="Отменить этот перевод?" description="Остатки будут восстановлены только если полученные деньги ещё доступны." confirmLabel="Отменить перевод" triggerClassName="text-button expense"/>}</article>)}{transfers.length === 0 && <p className="empty">Переводов пока нет.</p>}</div></>;
}
