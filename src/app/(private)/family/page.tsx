import { ImperiaHome } from "@/components/imperia-home";
import { FinanceModule } from "@prisma/client";

import { formatMoney, minorUnitsToMoney, moneyToMinorUnits } from "@/lib/money";
import { requireUser } from "@/server/auth";
import { getFamilyAnalytics } from "@/server/family";
import { getMoneyWorkspace } from "@/server/money";

const noticeMessage = (params: Record<string, string | string[] | undefined>) => params.created ? "Операция сохранена." : params.paid ? "Платёж отмечен как оплаченный." : null;

export default async function FamilyPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const params = await searchParams;
  const rawPeriod = typeof params.period === "string" ? params.period : "MONTH";
  const period: "MONTH" | "THREE_MONTHS" | "YEAR" = rawPeriod === "THREE_MONTHS" || rawPeriod === "YEAR" ? rawPeriod : "MONTH";
  const fromValue = typeof params.from === "string" ? params.from : "";
  const toValue = typeof params.to === "string" ? params.to : "";
  const custom = /^\d{4}-\d{2}-\d{2}$/.test(fromValue) && /^\d{4}-\d{2}-\d{2}$/.test(toValue) ? { from: fromValue, to: toValue } : undefined;
  const [analytics, familyMoney] = await Promise.all([getFamilyAnalytics(user.id, period, custom), getMoneyWorkspace(user.id, FinanceModule.FAMILY)]);
  const capitalSummary = familyMoney.summaries.find((summary) => summary.currency === user.defaultCurrency) ?? familyMoney.summaries[0];
  const envelopes = familyMoney.accounts.filter((account) => account.kind === "ENVELOPE" && account.isActive).map((account) => {
    const targetMinor = account.targetAmount ? moneyToMinorUnits(account.targetAmount.toString()) : null;
    const progress = targetMinor && targetMinor > 0n ? Math.max(0, Math.min(100, Number(account.balanceMinor * 100n / targetMinor))) : null;
    return { id: account.id, name: account.name, current: formatMoney(minorUnitsToMoney(account.balanceMinor), account.currency), target: account.targetAmount ? formatMoney(account.targetAmount.toString(), account.currency) : null, progress };
  });
  const targetTotal = familyMoney.accounts.filter((account) => account.kind === "ENVELOPE" && account.isActive && account.targetAmount).reduce((total, account) => total + moneyToMinorUnits(account.targetAmount!.toString()), 0n);
  const savedTotal = familyMoney.accounts.filter((account) => account.kind === "ENVELOPE" && account.isActive).reduce((total, account) => total + account.balanceMinor, 0n);
  const goalProgress = targetTotal > 0n ? Math.max(0, Math.min(100, Number(savedTotal * 100n / targetTotal))) : 0;

  return <ImperiaHome
    balance={formatMoney(minorUnitsToMoney(capitalSummary?.total ?? 0n), capitalSummary?.currency ?? user.defaultCurrency)}
    income={formatMoney(analytics.income)}
    expense={formatMoney(analytics.expense)}
    result={formatMoney(analytics.result)}
    period={custom ? "CUSTOM" : period}
    envelopes={envelopes}
    goalProgress={goalProgress}
    categories={analytics.expensesByCategory.map((item) => ({ name: item.name, amount: formatMoney(item.amount), percent: item.percent }))}
    notice={noticeMessage(params)}
  />;
}
