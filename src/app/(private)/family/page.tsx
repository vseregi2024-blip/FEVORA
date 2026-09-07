import { FamilyMoneyWorkspace } from "@/components/family-money-workspace";
import { dateFromInput, todayInputValue } from "@/lib/dates";
import { formatMoney, minorUnitsToMoney, moneyToMinorUnits } from "@/lib/money";
import { requireUser } from "@/server/auth";
import { getFamilyAccounts, getFamilyAnalytics, getFamilyReport, getFamilyTransactions, getRecurringPaymentProgress, getRecurringPayments } from "@/server/family";

const noticeMessage = (params: Record<string, string | string[] | undefined>) => params.created ? "Операция сохранена." : params.paid ? "Платёж отмечен как оплаченный." : null;

export default async function FamilyPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser(); const params = await searchParams;
  const rawPeriod = typeof params.period === "string" ? params.period : "MONTH"; const period: "MONTH" | "THREE_MONTHS" | "YEAR" = rawPeriod === "THREE_MONTHS" || rawPeriod === "YEAR" ? rawPeriod : "MONTH"; const fromValue = typeof params.from === "string" ? params.from : ""; const toValue = typeof params.to === "string" ? params.to : ""; const custom = /^\d{4}-\d{2}-\d{2}$/.test(fromValue) && /^\d{4}-\d{2}-\d{2}$/.test(toValue) ? { from: fromValue, to: toValue } : undefined;
  const today = dateFromInput(todayInputValue()); const monthFrom = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1, 12)); const monthTo = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0, 12));
  const analytics = await getFamilyAnalytics(user.id, period, custom); const [report, allTransactions, recurring, accounts, paymentProgress] = await Promise.all([getFamilyReport(user.id, "MONTH"), getFamilyTransactions(user.id), getRecurringPayments(user.id), getFamilyAccounts(user.id), getRecurringPaymentProgress(user.id, monthFrom, monthTo)]);
  const balanceMinor = allTransactions.reduce((total, item) => total + (["EXPENSE", "SAVING_IN"].includes(item.type) ? -moneyToMinorUnits(item.amount.toString()) : moneyToMinorUnits(item.amount.toString())), 0n);
  const accountTotals = new Map<string, bigint>(); for (const item of allTransactions) if (item.familyAccountId) accountTotals.set(item.familyAccountId, (accountTotals.get(item.familyAccountId) ?? 0n) + (["EXPENSE", "SAVING_IN"].includes(item.type) ? -moneyToMinorUnits(item.amount.toString()) : moneyToMinorUnits(item.amount.toString())));
  const seenReceipts = new Set<string>(); const recent = allTransactions.filter((item) => { if (item.type === "SAVING_IN" || item.type === "SAVING_OUT") return false; if (!item.receiptId) return true; if (seenReceipts.has(item.receiptId)) return false; seenReceipts.add(item.receiptId); return true; }).slice(0, 8);
  const nearest = recurring[0]; const notice = noticeMessage(params);
  return <>{notice && <p className="notice money-notice">{notice}</p>}<FamilyMoneyWorkspace
    balance={formatMoney(minorUnitsToMoney(balanceMinor))}
    income={formatMoney(report.income)}
    expense={formatMoney(report.expense)}
    period={custom ? "CUSTOM" : period}
    analytics={{ income: formatMoney(analytics.income), expense: formatMoney(analytics.expense), result: formatMoney(analytics.result), categories: analytics.expensesByCategory.map((item) => ({ name: item.name, amount: formatMoney(item.amount), percent: item.percent })) }}
    payments={{ planned: formatMoney(paymentProgress.planned), paid: formatMoney(paymentProgress.paid), remaining: formatMoney(paymentProgress.remaining), overdue: formatMoney(paymentProgress.overdue), overdueCount: paymentProgress.overdueCount, percent: paymentProgress.percent }}
    accounts={accounts.map((account) => ({ id: account.id, name: account.name, balance: formatMoney(minorUnitsToMoney(accountTotals.get(account.id) ?? 0n)) }))}
    nearest={nearest ? { name: nearest.name, meta: `${nearest.nextDueDate.toLocaleDateString("ru-RU")} · ${formatMoney(nearest.amount.toString())}`, href: `/family/recurring/${nearest.id}` } : null}
    recent={recent.map((item) => ({ id: item.id, href: item.receiptId ? `/family/receipts/${item.receiptId}` : `/family/${item.id}`, title: item.receiptId ? "Разделённый чек" : item.category?.name ?? "Без категории", meta: `${item.operationDate.toLocaleDateString("ru-RU")}${item.description ? ` · ${item.description}` : ""}${item.familyAccount ? ` · ${item.familyAccount.name}` : ""}`, amount: formatMoney(item.receipt?.totalAmount?.toString() ?? item.amount.toString()), outgoing: item.type === "EXPENSE" }))}
  /></>;
}
