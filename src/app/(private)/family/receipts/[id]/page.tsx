import Link from "next/link";

import { DeleteTransactionForm } from "@/components/delete-transaction-form";
import { SplitReceiptForm } from "@/components/split-receipt-form";
import { dateToInput } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { requireUser } from "@/server/auth";
import { getFamilyAccounts, getFamilyCategories, getSplitReceipt } from "@/server/family";

import { deleteSplitReceiptAction, updateSplitReceiptAction } from "../../actions";

export default async function ReceiptPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string; updated?: string }> }) {
  const user = await requireUser(); const { id } = await params; const query = await searchParams;
  const [receipt, categories, accounts] = await Promise.all([getSplitReceipt(user.id, id), getFamilyCategories(user.id, "EXPENSE", true), getFamilyAccounts(user.id, true)]);
  return <><header className="page-header"><div><p className="eyebrow">Split-чек</p><h1>{formatMoney(receipt.totalAmount.toString())}</h1><p className="muted">{receipt.transactions.length} части · без дополнительного расхода сверху</p></div><Link href="/family" className="text-link">К Дому</Link></header>{(query.created || query.updated) && <p className="notice">Чек сохранён, сумма частей проверена.</p>}<SplitReceiptForm categories={categories} accounts={accounts} action={updateSplitReceiptAction} value={{ id: receipt.id, date: dateToInput(receipt.operationDate), description: receipt.description ?? "", totalAmount: receipt.totalAmount.toString(), accountId: receipt.transactions[0]?.familyAccountId ?? "", items: receipt.transactions.map((item) => ({ id: item.id, categoryId: item.categoryId ?? "", amount: item.amount.toString(), description: item.description ?? "" })) }}/><div className="danger-zone"><h2>Удалить весь чек</h2><p>Все части будут мягко удалены и перестанут влиять на баланс и отчёты.</p><DeleteTransactionForm id={receipt.id} action={deleteSplitReceiptAction}/></div></>;
}
